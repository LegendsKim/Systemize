-- ============================================================================
-- 00002_leads.sql
--
-- Replaces the boilerplate `contact_requests` demo table with `leads`, the table
-- specified in docs/PRODUCT.md §6, and corrects the security posture for a site
-- that has no authentication anywhere.
--
-- Why `contact_requests` is dropped rather than left in place:
--   * It is not in the product data model. Nothing in the application reads or
--     writes it after this migration.
--   * Its RLS policies are gated on `auth.uid()` and its grants are issued to
--     `authenticated`. There is no sign-in on this site (AGENTS.client.md §1),
--     so those grants can never be exercised by a legitimate caller and are
--     pure standing surface area on a table that holds PII columns.
--   * There is no hosted Supabase project yet (AGENTS.client.md §9); the table
--     exists only in local CLI stacks, so no production data is at risk.
-- Dropping it is a schema migration, not an application delete. Application code
-- still never hard-deletes a lead — no role is granted DELETE on `leads` below.
--
-- `rate_limit_buckets` and `public.check_rate_limit()` from 00001 are reused
-- unchanged; only the loose default table grants on the bucket table are revoked.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Retire the boilerplate demo table
-- ----------------------------------------------------------------------------

DROP TABLE IF EXISTS public.contact_requests;

-- The `updated_at` trigger function existed solely for that table. `leads` is
-- append-only and has no `updated_at`, so the function is now unreferenced and a
-- mutable-search_path finding waiting to happen.
DROP FUNCTION IF EXISTS public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 2. leads — the single system of record for lead capture
-- ----------------------------------------------------------------------------

CREATE TABLE public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    full_name TEXT NOT NULL
        CONSTRAINT leads_full_name_length
        CHECK (char_length(btrim(full_name)) BETWEEN 2 AND 200),
    business_name TEXT NOT NULL
        CONSTRAINT leads_business_name_length
        CHECK (char_length(btrim(business_name)) BETWEEN 2 AND 200),
    phone TEXT NOT NULL
        CONSTRAINT leads_phone_length
        CHECK (char_length(btrim(phone)) BETWEEN 9 AND 32),
    email TEXT NOT NULL
        CONSTRAINT leads_email_shape
        CHECK (char_length(email) BETWEEN 6 AND 320 AND position('@' IN email) > 1),
    message TEXT NOT NULL
        CONSTRAINT leads_message_length
        CHECK (char_length(btrim(message)) BETWEEN 10 AND 5000),
    idempotency_key TEXT NOT NULL
        CONSTRAINT leads_idempotency_key_length
        CHECK (char_length(idempotency_key) BETWEEN 8 AND 128),
    request_id TEXT NOT NULL
        CONSTRAINT leads_request_id_length
        CHECK (char_length(request_id) BETWEEN 1 AND 128),
    CONSTRAINT leads_idempotency_key_key UNIQUE (idempotency_key)
);

COMMENT ON TABLE public.leads IS
    'Lead submissions from the public Blueprint form. Contains PII (name, business name, phone, email, free text). Owner-only access via the Supabase dashboard; no application role may read or delete rows.';
COMMENT ON COLUMN public.leads.idempotency_key IS
    'Client-generated per form session, enforced here by a unique constraint. A replay of the same key must never create a second row.';
COMMENT ON COLUMN public.leads.request_id IS
    'Server-generated correlation id. The only field in this table that is safe to log.';

-- The unique constraint already indexes `idempotency_key`, which is the lookup
-- the Server Action performs on every submission.
CREATE INDEX leads_created_at_idx ON public.leads (created_at DESC);
CREATE INDEX leads_request_id_idx ON public.leads (request_id);

-- ----------------------------------------------------------------------------
-- 3. Deny-by-default RLS
--
-- RLS is enabled and NO policy is created. That is the deny-by-default posture:
-- every non-superuser role that is subject to RLS is refused every row, for
-- every command, regardless of table grants. The grants below are revoked as
-- well, so `anon` fails at the privilege check before RLS is ever consulted.
--
-- `service_role` is BYPASSRLS, so the anonymous visitor's insert reaches the
-- table only through the server path in src/server/repositories/lead.repository.ts,
-- which uses the service-role client. No role is granted DELETE or UPDATE.
-- ----------------------------------------------------------------------------

-- FORCE ROW LEVEL SECURITY is deliberately NOT set: the owner reads leads in the
-- Supabase dashboard, and with zero policies a forced table would lock the table
-- owner out of the only lead-reading surface the MVP has.
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- service_role is included in the revoke: Supabase's default privileges grant it
-- everything on a new public table, including TRUNCATE, and the application's own
-- client must not be able to destroy leads. It is then granted back exactly two
-- privileges. Only the table owner retains UPDATE/DELETE, which is the manual
-- operator action the retention policy describes.
REVOKE ALL ON TABLE public.leads FROM PUBLIC, anon, authenticated, service_role;
GRANT INSERT, SELECT ON TABLE public.leads TO service_role;

-- ----------------------------------------------------------------------------
-- 4. Tighten the reused rate-limit bucket table
--
-- 00001 enabled RLS on it but left Supabase's default table grants in place.
-- Rows are only ever touched by public.check_rate_limit(), a SECURITY DEFINER
-- function whose EXECUTE grant is already service-role only.
-- ----------------------------------------------------------------------------

REVOKE ALL ON TABLE public.rate_limit_buckets FROM PUBLIC, anon, authenticated;
