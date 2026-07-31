-- ============================================================================
-- Database contract tests for the lead pipeline.
--
-- Run with: npm run test:db  (supabase db reset && supabase test db)
--
-- Covers AGENTS.md §6 and QUALITY.md §3: the migration applies from empty, RLS is
-- deny-by-default, `anon` can neither read nor write, only the service role has a
-- path to the table, and the idempotency key is uniquely constrained.
-- ============================================================================

BEGIN;
SET LOCAL search_path = public, extensions;
SELECT plan(17);

-- ---------------------------------------------------------------------------
-- Shape
-- ---------------------------------------------------------------------------

SELECT has_table('public', 'leads', 'leads exists');
SELECT hasnt_table(
  'public', 'contact_requests',
  'the boilerplate contact_requests table has been retired'
);
SELECT has_table('public', 'rate_limit_buckets', 'rate_limit_buckets is reused');
SELECT has_function(
  'public', 'check_rate_limit', ARRAY['text', 'integer', 'integer'],
  'check_rate_limit is reused unchanged'
);

SELECT columns_are(
  'public', 'leads',
  ARRAY[
    'id', 'created_at', 'full_name', 'business_name',
    'phone', 'email', 'message', 'idempotency_key', 'request_id'
  ],
  'leads has exactly the columns docs/PRODUCT.md §6 specifies'
);

SELECT col_is_unique(
  'public', 'leads', 'idempotency_key',
  'idempotency_key is uniquely constrained'
);

-- ---------------------------------------------------------------------------
-- RLS posture — deny by default
-- ---------------------------------------------------------------------------

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.leads'::regclass),
  'leads has RLS enabled'
);

SELECT is(
  (SELECT count(*) FROM pg_policies
   WHERE schemaname = 'public' AND tablename = 'leads'),
  1::bigint,
  'leads has exactly one owner-read policy'
);

SELECT is(
  (SELECT count(*) FROM information_schema.role_table_grants
   WHERE table_schema = 'public'
     AND table_name = 'leads'
     AND grantee = 'authenticated'
     AND privilege_type = 'SELECT'),
  1::bigint,
  'authenticated may select, while RLS limits rows to the SYSTEMIZE owner'
);

-- Scoped to the roles the application can actually authenticate as. The table owner
-- keeps full privileges on purpose: manual deletion under the retention policy is an
-- operator action, not an application one.
SELECT is(
  (SELECT count(*) FROM information_schema.role_table_grants
   WHERE table_schema = 'public'
     AND table_name = 'leads'
     AND grantee IN ('anon', 'authenticated', 'service_role', 'PUBLIC')
     AND privilege_type IN ('DELETE', 'UPDATE', 'TRUNCATE')),
  0::bigint,
  'no application role may update, delete, or truncate a lead'
);

SELECT bag_eq(
  $$SELECT privilege_type FROM information_schema.role_table_grants
    WHERE table_schema = 'public' AND table_name = 'leads'
      AND grantee = 'service_role'$$,
  $$VALUES ('INSERT'), ('SELECT')$$,
  'the service role holds insert and select on leads, and nothing else'
);

-- ---------------------------------------------------------------------------
-- anon is denied both directions
-- ---------------------------------------------------------------------------

SET LOCAL ROLE anon;

SELECT throws_ok(
  $$INSERT INTO public.leads
    (full_name, business_name, phone, email, message, idempotency_key, request_id)
    VALUES ('Anon Visitor', 'Anon Business', '050-0000000',
            'anon@example.test', 'This insert must be refused.',
            'anon-key-000000000000', 'anon-request')$$,
  '42501',
  'permission denied for table leads',
  'anon cannot insert into leads'
);

SELECT throws_ok(
  $$SELECT id FROM public.leads$$,
  '42501',
  'permission denied for table leads',
  'anon cannot select from leads'
);

SELECT throws_ok(
  $$SELECT public.check_rate_limit('anon-probe', 5, 3600)$$,
  '42501',
  'permission denied for function check_rate_limit',
  'anon cannot drive the rate limiter directly'
);

RESET ROLE;

-- ---------------------------------------------------------------------------
-- authenticated is denied too — this site has no sign-in
-- ---------------------------------------------------------------------------

SET LOCAL ROLE authenticated;

SELECT is(
  (SELECT count(*) FROM public.leads),
  0::bigint,
  'an authenticated non-owner cannot enumerate leads'
);

RESET ROLE;

-- ---------------------------------------------------------------------------
-- The server path — service_role only — and the idempotency constraint
-- ---------------------------------------------------------------------------

SET LOCAL ROLE service_role;

SELECT lives_ok(
  $$INSERT INTO public.leads
    (full_name, business_name, phone, email, message, idempotency_key, request_id)
    VALUES ('Test Owner', 'Test Business', '050-1234567',
            'owner@example.test', 'A deterministic fixture lead.',
            'fixture-key-0000000001', 'fixture-request')$$,
  'the service role can insert a lead'
);

SELECT throws_ok(
  $$INSERT INTO public.leads
    (full_name, business_name, phone, email, message, idempotency_key, request_id)
    VALUES ('Test Owner', 'Test Business', '050-1234567',
            'owner@example.test', 'The same key replayed.',
            'fixture-key-0000000001', 'fixture-request-2')$$,
  '23505',
  NULL,
  'replaying an idempotency key is refused by the unique constraint'
);

RESET ROLE;

SELECT * FROM finish();
ROLLBACK;
