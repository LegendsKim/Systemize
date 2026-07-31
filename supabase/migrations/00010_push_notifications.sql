-- Slice 4: per-device Web Push subscriptions and a durable delivery outbox.
-- In-app notifications remain authoritative; provider delivery is best-effort.

CREATE TABLE public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE
    CONSTRAINT push_subscriptions_endpoint_valid
    CHECK (
      endpoint ~ '^https://[^[:space:]]+$'
      AND char_length(endpoint) BETWEEN 16 AND 2000
    ),
  p256dh TEXT NOT NULL
    CONSTRAINT push_subscriptions_p256dh_length
    CHECK (char_length(p256dh) BETWEEN 32 AND 256),
  auth TEXT NOT NULL
    CONSTRAINT push_subscriptions_auth_length
    CHECK (char_length(auth) BETWEEN 8 AND 128),
  user_agent TEXT
    CONSTRAINT push_subscriptions_user_agent_length
    CHECK (user_agent IS NULL OR char_length(user_agent) <= 300),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  failure_count SMALLINT NOT NULL DEFAULT 0
    CONSTRAINT push_subscriptions_failure_count_range
    CHECK (failure_count BETWEEN 0 AND 5)
);

CREATE INDEX push_subscriptions_user_seen_idx
  ON public.push_subscriptions(user_id, last_seen_at DESC);

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
        AND category !~ '^(payment_|contract_|signature_|invitation_)'
      ),
      TRUE
    )
  FROM unnest(p_categories) AS category;
$$;

CREATE TABLE public.notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  muted_categories TEXT[] NOT NULL DEFAULT '{}'::TEXT[]
    CONSTRAINT notification_preferences_categories_allowed
    CHECK (private.muted_categories_are_allowed(muted_categories)),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE private.push_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL UNIQUE
    REFERENCES public.notifications(id) ON DELETE CASCADE,
  attempts SMALLINT NOT NULL DEFAULT 0
    CONSTRAINT push_outbox_attempts_range CHECK (attempts BETWEEN 0 AND 5),
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivered_at TIMESTAMPTZ,
  last_error_code TEXT
    CONSTRAINT push_outbox_error_length
    CHECK (last_error_code IS NULL OR char_length(last_error_code) <= 80),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX push_outbox_due_idx
  ON private.push_outbox(next_attempt_at, created_at)
  WHERE delivered_at IS NULL AND attempts < 5;

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE
  public.push_subscriptions,
  public.notification_preferences
FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.push_subscriptions,
  public.notification_preferences
TO authenticated;

-- The dispatcher uses the service role, which bypasses RLS but still requires
-- explicit table privileges after the blanket revoke above.
GRANT SELECT, UPDATE, DELETE ON TABLE public.push_subscriptions TO service_role;
GRANT SELECT ON TABLE public.notification_preferences TO service_role;

CREATE POLICY push_subscriptions_self_read
ON public.push_subscriptions
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY push_subscriptions_self_insert
ON public.push_subscriptions
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY push_subscriptions_self_update
ON public.push_subscriptions
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY push_subscriptions_self_delete
ON public.push_subscriptions
FOR DELETE TO authenticated
USING (user_id = auth.uid());

CREATE POLICY notification_preferences_self_read
ON public.notification_preferences
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY notification_preferences_self_insert
ON public.notification_preferences
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY notification_preferences_self_update
ON public.notification_preferences
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY notification_preferences_self_delete
ON public.notification_preferences
FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- Replace the two fan-out helpers so the notification and its outbox row are
-- committed in one transaction. Provider failure can never roll either back.
CREATE OR REPLACE FUNCTION private.notify_project_members(
  p_project_id UUID,
  p_kind TEXT,
  p_title TEXT,
  p_body TEXT,
  p_href TEXT,
  p_exclude_user_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  WITH inserted AS (
    INSERT INTO public.notifications (
      recipient_user_id,
      project_id,
      kind,
      title,
      body,
      href
    )
    SELECT
      membership.user_id,
      p_project_id,
      p_kind,
      p_title,
      p_body,
      p_href
    FROM public.project_memberships membership
    WHERE membership.project_id = p_project_id
      AND membership.status = 'active'
      AND (p_exclude_user_id IS NULL OR membership.user_id <> p_exclude_user_id)
    RETURNING id
  )
  INSERT INTO private.push_outbox (notification_id)
  SELECT id FROM inserted
  ON CONFLICT (notification_id) DO NOTHING;
$$;

CREATE OR REPLACE FUNCTION private.notify_systemize_owner(
  p_project_id UUID,
  p_kind TEXT,
  p_title TEXT,
  p_body TEXT,
  p_href TEXT
)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  WITH inserted AS (
    INSERT INTO public.notifications (
      recipient_user_id,
      project_id,
      kind,
      title,
      body,
      href
    )
    SELECT
      profile.id,
      p_project_id,
      p_kind,
      p_title,
      p_body,
      p_href
    FROM public.profiles profile
    WHERE profile.app_role = 'systemize_owner'
    RETURNING id
  )
  INSERT INTO private.push_outbox (notification_id)
  SELECT id FROM inserted
  ON CONFLICT (notification_id) DO NOTHING;
$$;

REVOKE ALL ON FUNCTION private.notify_project_members(UUID, TEXT, TEXT, TEXT, TEXT, UUID)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.notify_systemize_owner(UUID, TEXT, TEXT, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.claim_push_batch(p_limit INTEGER)
RETURNS TABLE (
  outbox_id UUID,
  notification_id UUID,
  recipient_user_id UUID,
  kind TEXT,
  href TEXT,
  attempts SMALLINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  WITH claimed AS (
    SELECT outbox.id
    FROM private.push_outbox outbox
    WHERE outbox.delivered_at IS NULL
      AND outbox.attempts < 5
      AND outbox.next_attempt_at <= now()
    ORDER BY outbox.next_attempt_at, outbox.created_at
    FOR UPDATE SKIP LOCKED
    LIMIT LEAST(GREATEST(p_limit, 1), 50)
  ),
  updated AS (
    UPDATE private.push_outbox outbox
    SET
      attempts = (outbox.attempts + 1)::SMALLINT,
      next_attempt_at = now() + interval '5 minutes'
    FROM claimed
    WHERE outbox.id = claimed.id
    RETURNING outbox.*
  )
  SELECT
    updated.id,
    notification.id,
    notification.recipient_user_id,
    notification.kind,
    notification.href,
    updated.attempts
  FROM updated
  JOIN public.notifications notification
    ON notification.id = updated.notification_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.settle_push_delivery(
  p_id UUID,
  p_outcome TEXT,
  p_error_code TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_retry_after INTEGER;
BEGIN
  IF p_outcome NOT IN ('delivered', 'retry', 'dead') THEN
    RAISE EXCEPTION 'invalid_push_outcome' USING ERRCODE = '22023';
  END IF;

  IF p_error_code IS NOT NULL AND char_length(p_error_code) > 80 THEN
    RAISE EXCEPTION 'push_error_code_too_long' USING ERRCODE = '22023';
  END IF;

  v_retry_after := COALESCE(
    NULLIF(substring(p_error_code FROM 'retry_after=([0-9]+)'), '')::INTEGER,
    0
  );

  UPDATE private.push_outbox
  SET
    delivered_at = CASE
      WHEN p_outcome IN ('delivered', 'dead') THEN now()
      ELSE NULL
    END,
    next_attempt_at = CASE
      WHEN p_outcome = 'retry' THEN
        now() + make_interval(
          secs => LEAST(
            3600,
            GREATEST(
              v_retry_after,
              (30 * power(2, GREATEST(attempts - 1, 0)))::INTEGER
              + floor(random() * 16)::INTEGER
            )
          )
        )
      ELSE next_attempt_at
    END,
    last_error_code = p_error_code
  WHERE id = p_id;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_push_batch(INTEGER)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.settle_push_delivery(UUID, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_push_batch(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.settle_push_delivery(UUID, TEXT, TEXT)
  TO service_role;

COMMENT ON TABLE public.push_subscriptions IS
  'Per-device Web Push endpoints. A subscription is delivery state, never identity or authorization.';
COMMENT ON TABLE private.push_outbox IS
  'Durable best-effort Web Push work created atomically with authoritative in-app notifications.';
