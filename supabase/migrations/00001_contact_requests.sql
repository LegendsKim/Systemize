-- Create updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create contact_requests table
CREATE TABLE public.contact_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    idempotency_key TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'notified', 'failed')),
    notification_error TEXT,
    ip_address TEXT,
    user_id UUID DEFAULT auth.uid(),
    CONSTRAINT contact_requests_idempotency_key_key UNIQUE (idempotency_key)
);

-- Triggers
CREATE TRIGGER set_public_contact_requests_updated_at
BEFORE UPDATE ON public.contact_requests
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Indexes
CREATE INDEX contact_requests_idempotency_key_idx ON public.contact_requests(idempotency_key);
CREATE INDEX contact_requests_email_idx ON public.contact_requests(email);
CREATE INDEX contact_requests_created_at_idx ON public.contact_requests(created_at);

-- Distributed fixed-window rate limiting for public Server Actions.
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE TABLE public.rate_limit_buckets (
    bucket_key TEXT PRIMARY KEY,
    window_started_at TIMESTAMPTZ NOT NULL,
    request_count INTEGER NOT NULL CHECK (request_count > 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rate_limit_buckets ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.check_rate_limit(
    p_key TEXT,
    p_limit INTEGER,
    p_window_seconds INTEGER
)
RETURNS TABLE (allowed BOOLEAN, retry_after_ms BIGINT, remaining INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_now TIMESTAMPTZ := clock_timestamp();
    v_key TEXT := encode(extensions.digest(p_key, 'sha256'), 'hex');
    v_bucket public.rate_limit_buckets%ROWTYPE;
BEGIN
    IF p_limit < 1 OR p_window_seconds < 1 THEN
        RAISE EXCEPTION 'Invalid rate limit configuration';
    END IF;

    INSERT INTO public.rate_limit_buckets AS buckets (
        bucket_key, window_started_at, request_count, updated_at
    )
    VALUES (v_key, v_now, 1, v_now)
    ON CONFLICT (bucket_key) DO UPDATE SET
        window_started_at = CASE
            WHEN buckets.window_started_at
                + make_interval(secs => p_window_seconds) <= v_now
            THEN v_now
            ELSE buckets.window_started_at
        END,
        request_count = CASE
            WHEN buckets.window_started_at
                + make_interval(secs => p_window_seconds) <= v_now
            THEN 1
            ELSE buckets.request_count + 1
        END,
        updated_at = v_now
    RETURNING * INTO v_bucket;

    allowed := v_bucket.request_count <= p_limit;
    remaining := GREATEST(0, p_limit - v_bucket.request_count);
    retry_after_ms := CASE
        WHEN allowed THEN 0
        ELSE GREATEST(
            0,
            CEIL(EXTRACT(EPOCH FROM (
                v_bucket.window_started_at
                + make_interval(secs => p_window_seconds)
                - v_now
            )) * 1000)::BIGINT
        )
    END;
    RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.check_rate_limit(TEXT, INTEGER, INTEGER)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(TEXT, INTEGER, INTEGER)
TO service_role;

-- RLS
ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.contact_requests FROM PUBLIC, anon, authenticated;
GRANT INSERT, SELECT ON TABLE public.contact_requests TO authenticated;
GRANT INSERT, SELECT, UPDATE ON TABLE public.contact_requests TO service_role;

-- Policies
CREATE POLICY "Users can insert their own requests"
ON public.contact_requests
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can select their own requests"
ON public.contact_requests
FOR SELECT
TO authenticated
USING (user_id = auth.uid());
