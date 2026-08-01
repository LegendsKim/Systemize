-- Durable Zoom + Google Calendar provisioning for booked discovery meetings.
-- The booking remains authoritative even when either provider is unavailable.

CREATE TYPE public.meeting_integration_status AS ENUM (
  'pending',
  'provisioning',
  'retry',
  'ready',
  'attention'
);

CREATE TABLE public.meeting_integrations (
  meeting_slot_id UUID PRIMARY KEY
    REFERENCES public.meeting_slots(id) ON DELETE RESTRICT,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE RESTRICT,
  status public.meeting_integration_status NOT NULL DEFAULT 'pending',
  zoom_meeting_id TEXT
    CONSTRAINT meeting_integrations_zoom_id_length
    CHECK (zoom_meeting_id IS NULL OR char_length(zoom_meeting_id) BETWEEN 1 AND 80),
  zoom_join_url TEXT
    CONSTRAINT meeting_integrations_zoom_join_url
    CHECK (
      zoom_join_url IS NULL
      OR (
        char_length(zoom_join_url) <= 1000
        AND zoom_join_url ~ '^https://([a-z0-9-]+\.)*zoom\.us/'
      )
    ),
  google_event_id TEXT
    CONSTRAINT meeting_integrations_google_event_id
    CHECK (
      google_event_id IS NULL
      OR (
        char_length(google_event_id) BETWEEN 5 AND 1024
        AND google_event_id ~ '^[0-9a-v]+$'
      )
    ),
  google_event_url TEXT
    CONSTRAINT meeting_integrations_google_event_url
    CHECK (
      google_event_url IS NULL
      OR (
        char_length(google_event_url) <= 1000
        AND google_event_url ~ '^https://([a-z0-9-]+\.)*google\.com/'
      )
    ),
  calendar_invite_sent_at TIMESTAMPTZ,
  last_error_code TEXT
    CONSTRAINT meeting_integrations_error_length
    CHECK (last_error_code IS NULL OR char_length(last_error_code) <= 80),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT meeting_integrations_ready_consistency CHECK (
    status <> 'ready'
    OR (
      zoom_meeting_id IS NOT NULL
      AND zoom_join_url IS NOT NULL
      AND google_event_id IS NOT NULL
      AND calendar_invite_sent_at IS NOT NULL
    )
  )
);

CREATE UNIQUE INDEX meeting_integrations_zoom_id_idx
  ON public.meeting_integrations(zoom_meeting_id)
  WHERE zoom_meeting_id IS NOT NULL;

CREATE UNIQUE INDEX meeting_integrations_google_event_idx
  ON public.meeting_integrations(google_event_id)
  WHERE google_event_id IS NOT NULL;

CREATE TABLE private.meeting_integration_outbox (
  meeting_slot_id UUID PRIMARY KEY
    REFERENCES public.meeting_slots(id) ON DELETE RESTRICT,
  attempts SMALLINT NOT NULL DEFAULT 0
    CONSTRAINT meeting_integration_outbox_attempts_range
    CHECK (attempts BETWEEN 0 AND 5),
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  last_error_code TEXT
    CONSTRAINT meeting_integration_outbox_error_length
    CHECK (last_error_code IS NULL OR char_length(last_error_code) <= 80),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX meeting_integration_outbox_due_idx
  ON private.meeting_integration_outbox(next_attempt_at, created_at)
  WHERE completed_at IS NULL AND attempts < 5;

CREATE TABLE private.google_calendar_connections (
  singleton BOOLEAN PRIMARY KEY DEFAULT TRUE
    CONSTRAINT google_calendar_connections_singleton CHECK (singleton),
  refresh_token TEXT NOT NULL
    CONSTRAINT google_calendar_refresh_token_length
    CHECK (char_length(refresh_token) BETWEEN 20 AND 2048),
  connected_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  connected_email TEXT NOT NULL
    CONSTRAINT google_calendar_connected_email
    CHECK (
      connected_email = lower(btrim(connected_email))
      AND connected_email ~ '^[^@[:space:]]+@gmail\.com$'
      AND char_length(connected_email) BETWEEN 11 AND 320
    ),
  granted_scopes TEXT[] NOT NULL DEFAULT '{}'::TEXT[]
    CONSTRAINT google_calendar_scope_bounds
    CHECK (
      cardinality(granted_scopes) BETWEEN 1 AND 10
      AND char_length(array_to_string(granted_scopes, '')) BETWEEN 3 AND 2000
    ),
  connected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.meeting_integrations ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.meeting_integrations
  FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.meeting_integrations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.meeting_integrations TO service_role;

CREATE POLICY meeting_integrations_project_read
ON public.meeting_integrations
FOR SELECT TO authenticated
USING (
  private.is_systemize_owner()
  OR private.is_active_project_member(project_id)
);

CREATE OR REPLACE FUNCTION private.enqueue_meeting_integration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.status = 'booked'
    AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.meeting_integrations (meeting_slot_id, project_id)
    VALUES (NEW.id, NEW.project_id)
    ON CONFLICT (meeting_slot_id) DO NOTHING;

    INSERT INTO private.meeting_integration_outbox (meeting_slot_id)
    VALUES (NEW.id)
    ON CONFLICT (meeting_slot_id) DO UPDATE
    SET
      attempts = 0,
      next_attempt_at = now(),
      completed_at = NULL,
      last_error_code = NULL;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.enqueue_meeting_integration()
  FROM PUBLIC, anon, authenticated;

CREATE TRIGGER enqueue_meeting_integration_after_booking
AFTER UPDATE OF status ON public.meeting_slots
FOR EACH ROW EXECUTE FUNCTION private.enqueue_meeting_integration();

-- Existing booked meetings are also provisioned when this migration reaches production.
INSERT INTO public.meeting_integrations (meeting_slot_id, project_id)
SELECT slot.id, slot.project_id
FROM public.meeting_slots slot
WHERE slot.status = 'booked'
ON CONFLICT (meeting_slot_id) DO NOTHING;

INSERT INTO private.meeting_integration_outbox (meeting_slot_id)
SELECT integration.meeting_slot_id
FROM public.meeting_integrations integration
WHERE integration.status <> 'ready'
ON CONFLICT (meeting_slot_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.claim_meeting_integration_batch(p_limit INTEGER)
RETURNS TABLE (
  meeting_slot_id UUID,
  project_id UUID,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  client_email TEXT,
  attempts SMALLINT,
  zoom_meeting_id TEXT,
  zoom_join_url TEXT,
  google_event_id TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'service_role_required' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  WITH claimed AS (
    SELECT outbox.meeting_slot_id
    FROM private.meeting_integration_outbox outbox
    WHERE outbox.completed_at IS NULL
      AND outbox.attempts < 5
      AND outbox.next_attempt_at <= now()
    ORDER BY outbox.next_attempt_at, outbox.created_at
    FOR UPDATE SKIP LOCKED
    LIMIT LEAST(GREATEST(p_limit, 1), 20)
  ),
  updated AS (
    UPDATE private.meeting_integration_outbox outbox
    SET
      attempts = (outbox.attempts + 1)::SMALLINT,
      next_attempt_at = now() + interval '5 minutes'
    FROM claimed
    WHERE outbox.meeting_slot_id = claimed.meeting_slot_id
    RETURNING outbox.*
  ),
  integration_updated AS (
    UPDATE public.meeting_integrations integration
    SET status = 'provisioning', updated_at = now()
    FROM updated
    WHERE integration.meeting_slot_id = updated.meeting_slot_id
      AND integration.status <> 'ready'
    RETURNING integration.meeting_slot_id
  )
  SELECT
    slot.id,
    slot.project_id,
    slot.starts_at,
    slot.ends_at,
    profile.email,
    updated.attempts,
    integration.zoom_meeting_id,
    integration.zoom_join_url,
    integration.google_event_id
  FROM updated
  JOIN public.meeting_slots slot ON slot.id = updated.meeting_slot_id
  JOIN public.profiles profile ON profile.id = slot.booked_by
  JOIN public.meeting_integrations integration
    ON integration.meeting_slot_id = slot.id
  JOIN integration_updated integration_claim
    ON integration_claim.meeting_slot_id = slot.id
  WHERE slot.status = 'booked';
END;
$$;

CREATE OR REPLACE FUNCTION public.record_meeting_zoom(
  p_meeting_slot_id UUID,
  p_zoom_meeting_id TEXT,
  p_zoom_join_url TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'service_role_required' USING ERRCODE = '42501';
  END IF;
  IF char_length(p_zoom_meeting_id) NOT BETWEEN 1 AND 80
    OR char_length(p_zoom_join_url) > 1000
    OR p_zoom_join_url !~ '^https://([a-z0-9-]+\.)*zoom\.us/' THEN
    RAISE EXCEPTION 'invalid_zoom_result' USING ERRCODE = '22023';
  END IF;

  UPDATE public.meeting_integrations
  SET
    zoom_meeting_id = p_zoom_meeting_id,
    zoom_join_url = p_zoom_join_url,
    updated_at = now()
  WHERE meeting_slot_id = p_meeting_slot_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'meeting_integration_not_found' USING ERRCODE = 'P0002';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.settle_meeting_integration(
  p_meeting_slot_id UUID,
  p_outcome TEXT,
  p_google_event_id TEXT,
  p_google_event_url TEXT,
  p_error_code TEXT,
  p_retry_after_seconds INTEGER DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_attempts SMALLINT;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'service_role_required' USING ERRCODE = '42501';
  END IF;
  IF p_outcome NOT IN ('ready', 'retry', 'attention')
    OR (p_error_code IS NOT NULL AND char_length(p_error_code) > 80)
    OR (p_retry_after_seconds IS NOT NULL AND p_retry_after_seconds NOT BETWEEN 0 AND 3600) THEN
    RAISE EXCEPTION 'invalid_meeting_integration_outcome' USING ERRCODE = '22023';
  END IF;

  SELECT attempts INTO v_attempts
  FROM private.meeting_integration_outbox
  WHERE meeting_slot_id = p_meeting_slot_id
  FOR UPDATE;

  UPDATE public.meeting_integrations
  SET
    status = p_outcome::public.meeting_integration_status,
    google_event_id = CASE
      WHEN p_outcome = 'ready' THEN p_google_event_id
      ELSE google_event_id
    END,
    google_event_url = CASE
      WHEN p_outcome = 'ready' THEN p_google_event_url
      ELSE google_event_url
    END,
    calendar_invite_sent_at = CASE
      WHEN p_outcome = 'ready' THEN now()
      ELSE calendar_invite_sent_at
    END,
    last_error_code = p_error_code,
    updated_at = now()
  WHERE meeting_slot_id = p_meeting_slot_id;

  UPDATE private.meeting_integration_outbox
  SET
    completed_at = CASE
      WHEN p_outcome IN ('ready', 'attention') THEN now()
      ELSE NULL
    END,
    next_attempt_at = CASE
      WHEN p_outcome = 'retry' THEN
        now() + make_interval(
          secs => LEAST(
            3600,
            GREATEST(
              COALESCE(p_retry_after_seconds, 0),
              (30 * power(2, GREATEST(v_attempts - 1, 0)))::INTEGER
              + floor(random() * 16)::INTEGER
            )
          )
        )
      ELSE next_attempt_at
    END,
    last_error_code = p_error_code
  WHERE meeting_slot_id = p_meeting_slot_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.store_google_calendar_connection(
  p_refresh_token TEXT,
  p_connected_by UUID,
  p_connected_email TEXT,
  p_granted_scopes TEXT[]
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'service_role_required' USING ERRCODE = '42501';
  END IF;
  IF char_length(p_refresh_token) NOT BETWEEN 20 AND 2048
    OR p_connected_email <> lower(btrim(p_connected_email))
    OR p_connected_email !~ '^[^@[:space:]]+@gmail\.com$'
    OR cardinality(p_granted_scopes) NOT BETWEEN 1 AND 10 THEN
    RAISE EXCEPTION 'invalid_google_calendar_connection' USING ERRCODE = '22023';
  END IF;

  INSERT INTO private.google_calendar_connections (
    singleton,
    refresh_token,
    connected_by,
    connected_email,
    granted_scopes
  ) VALUES (
    TRUE,
    p_refresh_token,
    p_connected_by,
    p_connected_email,
    p_granted_scopes
  )
  ON CONFLICT (singleton) DO UPDATE
  SET
    refresh_token = EXCLUDED.refresh_token,
    connected_by = EXCLUDED.connected_by,
    connected_email = EXCLUDED.connected_email,
    granted_scopes = EXCLUDED.granted_scopes,
    connected_at = now(),
    updated_at = now();

  UPDATE private.meeting_integration_outbox outbox
  SET attempts = 0, next_attempt_at = now(), completed_at = NULL, last_error_code = NULL
  FROM public.meeting_integrations integration
  WHERE integration.meeting_slot_id = outbox.meeting_slot_id
    AND integration.status <> 'ready';

  UPDATE public.meeting_integrations
  SET status = 'pending', last_error_code = NULL, updated_at = now()
  WHERE status <> 'ready';
END;
$$;

CREATE OR REPLACE FUNCTION public.get_google_calendar_connection()
RETURNS TABLE (
  refresh_token TEXT,
  connected_email TEXT,
  granted_scopes TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'service_role_required' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT connection.refresh_token, connection.connected_email, connection.granted_scopes
  FROM private.google_calendar_connections connection
  WHERE connection.singleton = TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_meeting_integration_batch(INTEGER)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.record_meeting_zoom(UUID, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.settle_meeting_integration(UUID, TEXT, TEXT, TEXT, TEXT, INTEGER)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.store_google_calendar_connection(TEXT, UUID, TEXT, TEXT[])
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_google_calendar_connection()
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.claim_meeting_integration_batch(INTEGER)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.record_meeting_zoom(UUID, TEXT, TEXT)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.settle_meeting_integration(UUID, TEXT, TEXT, TEXT, TEXT, INTEGER)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.store_google_calendar_connection(TEXT, UUID, TEXT, TEXT[])
  TO service_role;
GRANT EXECUTE ON FUNCTION public.get_google_calendar_connection()
  TO service_role;

COMMENT ON TABLE public.meeting_integrations IS
  'Safe client-visible conference state. Host start URLs and OAuth credentials are never stored here.';
COMMENT ON TABLE private.meeting_integration_outbox IS
  'Durable provider work created atomically when a meeting slot becomes booked.';
COMMENT ON TABLE private.google_calendar_connections IS
  'Server-only Google Calendar offline credential for the SYSTEMIZE owner calendar.';
