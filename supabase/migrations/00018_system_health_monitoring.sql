-- Durable owner-visible system health with transition-only Push notifications.
-- Provider probes run server-side; only bounded safe error codes are persisted.

CREATE TABLE public.system_health_checks (
  component TEXT PRIMARY KEY
    CONSTRAINT system_health_component_allowed CHECK (
      component IN (
        'database',
        'zoom',
        'google_calendar',
        'push_notifications',
        'meeting_automation'
      )
    ),
  status TEXT NOT NULL
    CONSTRAINT system_health_status_allowed CHECK (status IN ('healthy', 'unhealthy')),
  error_code TEXT
    CONSTRAINT system_health_error_code_safe CHECK (
      error_code IS NULL OR (
        char_length(error_code) BETWEEN 3 AND 80
        AND error_code ~ '^[a-z0-9_:.-]+$'
      )
    ),
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status_changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT system_health_error_matches_status CHECK (
    (status = 'healthy' AND error_code IS NULL)
    OR (status = 'unhealthy' AND error_code IS NOT NULL)
  )
);

ALTER TABLE public.system_health_checks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.system_health_checks FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.system_health_checks TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.system_health_checks TO service_role;

CREATE POLICY system_health_owner_read
ON public.system_health_checks
FOR SELECT TO authenticated
USING (private.is_systemize_owner());

CREATE OR REPLACE FUNCTION public.record_system_health_snapshot(p_checks JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_check JSONB;
  v_component TEXT;
  v_status TEXT;
  v_error_code TEXT;
  v_previous_status TEXT;
  v_seen_components TEXT[] := ARRAY[]::TEXT[];
  v_failed TEXT[] := ARRAY[]::TEXT[];
  v_recovered TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Serialize cron, manual, and post-meeting probes so one transition emits one alert.
  PERFORM pg_catalog.pg_advisory_xact_lock(482992349124);

  IF jsonb_typeof(p_checks) <> 'array'
    OR jsonb_array_length(p_checks) <> 5 THEN
    RAISE EXCEPTION 'invalid_health_snapshot' USING ERRCODE = '22023';
  END IF;

  FOR v_check IN SELECT value FROM jsonb_array_elements(p_checks)
  LOOP
    IF jsonb_typeof(v_check) <> 'object'
      OR v_check - ARRAY['component', 'status', 'error_code'] <> '{}'::JSONB THEN
      RAISE EXCEPTION 'invalid_health_check_shape' USING ERRCODE = '22023';
    END IF;

    v_component := v_check->>'component';
    v_status := v_check->>'status';
    v_error_code := NULLIF(v_check->>'error_code', '');

    IF v_component NOT IN (
      'database', 'zoom', 'google_calendar', 'push_notifications', 'meeting_automation'
    ) OR v_status NOT IN ('healthy', 'unhealthy')
      OR (v_status = 'healthy' AND v_error_code IS NOT NULL)
      OR (v_status = 'unhealthy' AND (
        v_error_code IS NULL
        OR char_length(v_error_code) NOT BETWEEN 3 AND 80
        OR v_error_code !~ '^[a-z0-9_:.-]+$'
      )) THEN
      RAISE EXCEPTION 'invalid_health_check_value' USING ERRCODE = '22023';
    END IF;

    IF v_component = ANY(v_seen_components) THEN
      RAISE EXCEPTION 'duplicate_health_component' USING ERRCODE = '22023';
    END IF;
    v_seen_components := array_append(v_seen_components, v_component);

    SELECT health.status
    INTO v_previous_status
    FROM public.system_health_checks health
    WHERE health.component = v_component
    FOR UPDATE;

    INSERT INTO public.system_health_checks (
      component, status, error_code, checked_at, status_changed_at
    ) VALUES (
      v_component, v_status, v_error_code, now(), now()
    )
    ON CONFLICT (component) DO UPDATE
    SET
      status = EXCLUDED.status,
      error_code = EXCLUDED.error_code,
      checked_at = EXCLUDED.checked_at,
      status_changed_at = CASE
        WHEN public.system_health_checks.status IS DISTINCT FROM EXCLUDED.status
          THEN EXCLUDED.checked_at
        ELSE public.system_health_checks.status_changed_at
      END;

    IF v_status = 'unhealthy' AND v_previous_status IS DISTINCT FROM 'unhealthy' THEN
      v_failed := array_append(v_failed, v_component);
    ELSIF v_status = 'healthy' AND v_previous_status = 'unhealthy' THEN
      v_recovered := array_append(v_recovered, v_component);
    END IF;
  END LOOP;

  IF cardinality(v_failed) > 0 THEN
    WITH inserted AS (
      INSERT INTO public.notifications (
        recipient_user_id, project_id, kind, title, body, href
      )
      SELECT
        profile.id,
        NULL,
        'system_health_failed',
        'תקלה במערכות SYSTEMIZE',
        'זוהתה תקלה בחיבור מערכת. יש לפתוח את ההגדרות לפרטים.',
        '/admin/settings'
      FROM public.profiles profile
      WHERE profile.app_role = 'systemize_owner'
      RETURNING id
    )
    INSERT INTO private.push_outbox (notification_id)
    SELECT id FROM inserted
    ON CONFLICT (notification_id) DO NOTHING;
  END IF;

  IF cardinality(v_recovered) > 0 THEN
    WITH inserted AS (
      INSERT INTO public.notifications (
        recipient_user_id, project_id, kind, title, body, href
      )
      SELECT
        profile.id,
        NULL,
        'system_health_recovered',
        'מערכות SYSTEMIZE חזרו לפעול',
        'החיבורים שנכשלו עברו בדיקה נוספת וכעת פועלים כרגיל.',
        '/admin/settings'
      FROM public.profiles profile
      WHERE profile.app_role = 'systemize_owner'
      RETURNING id
    )
    INSERT INTO private.push_outbox (notification_id)
    SELECT id FROM inserted
    ON CONFLICT (notification_id) DO NOTHING;
  END IF;

  RETURN jsonb_build_object(
    'failed', to_jsonb(v_failed),
    'recovered', to_jsonb(v_recovered)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.record_system_health_snapshot(JSONB)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_system_health_snapshot(JSONB)
  TO service_role;

-- A system failure is operationally critical and cannot be muted by preference writes.
CREATE OR REPLACE FUNCTION private.muted_categories_are_allowed(
  p_categories TEXT[]
)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT
    cardinality(p_categories) <= 20
    AND COALESCE(
      bool_and(
        char_length(category) BETWEEN 3 AND 80
        AND category !~ '^(payment_|contract_|signature_|invitation_|system_health_)'
      ),
      TRUE
    )
  FROM unnest(p_categories) AS category;
$$;

COMMENT ON TABLE public.system_health_checks IS
  'Latest safe health state for owner-visible infrastructure components.';
COMMENT ON FUNCTION public.record_system_health_snapshot(JSONB) IS
  'Atomically persists a complete health snapshot and enqueues transition-only owner alerts.';
