-- Lead visibility contract: the SYSTEMIZE owner reads leads, nobody else does,
-- and no browser-facing role can change or destroy one.
-- Run after migrations with: npm run test:db

BEGIN;
SET LOCAL search_path = public, extensions;
SELECT no_plan();

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.leads'::regclass),
  'leads has RLS'
);

SELECT is(
  (
    SELECT count(*)
    FROM information_schema.role_table_grants
    WHERE table_schema = 'public'
      AND table_name = 'leads'
      AND grantee IN ('authenticated', 'anon', 'service_role')
      AND privilege_type IN ('UPDATE', 'DELETE', 'TRUNCATE')
  ),
  0::bigint,
  'no browser-facing or application role can change or destroy a lead'
);

SELECT is(
  (
    SELECT count(*)
    FROM information_schema.role_table_grants
    WHERE table_schema = 'public'
      AND table_name = 'leads'
      AND grantee = 'anon'
  ),
  0::bigint,
  'anonymous visitors hold no grant on leads'
);

INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES
(
  '20000000-0000-4000-8000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'leadowner@gmail.com',
  '',
  now(),
  '{"provider":"google","providers":["google"]}'::jsonb,
  '{}'::jsonb,
  now(),
  now()
),
(
  '20000000-0000-4000-8000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'leadclient@gmail.com',
  '',
  now(),
  '{"provider":"google","providers":["google"]}'::jsonb,
  '{}'::jsonb,
  now(),
  now()
);

INSERT INTO public.profiles (id, email, full_name, app_role) VALUES
(
  '20000000-0000-4000-8000-000000000001',
  'leadowner@gmail.com',
  'Systemize Owner',
  'systemize_owner'
),
(
  '20000000-0000-4000-8000-000000000002',
  'leadclient@gmail.com',
  'Client Owner',
  'client'
);

INSERT INTO public.leads (
  full_name,
  business_name,
  phone,
  email,
  message,
  idempotency_key,
  request_id
) VALUES (
  'Lead Person',
  'Lead Business',
  '0501234567',
  'lead@example.com',
  'We would like to discuss automating our intake process.',
  'lead-idempotency-key-0001',
  'req-0001'
);

SET LOCAL ROLE authenticated;
SELECT set_config(
  'request.jwt.claim.sub',
  '20000000-0000-4000-8000-000000000001',
  true
);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);

SELECT is(
  (SELECT count(*) FROM public.leads),
  1::bigint,
  'the SYSTEMIZE owner can read leads in the console'
);
SELECT throws_ok(
  $$UPDATE public.leads SET full_name = 'Renamed'$$,
  '42501',
  NULL,
  'the SYSTEMIZE owner cannot edit a lead through the console'
);
SELECT throws_ok(
  $$DELETE FROM public.leads$$,
  '42501',
  NULL,
  'the SYSTEMIZE owner cannot delete a lead through the console'
);

RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT set_config(
  'request.jwt.claim.sub',
  '20000000-0000-4000-8000-000000000002',
  true
);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);

SELECT is(
  (SELECT count(*) FROM public.leads),
  0::bigint,
  'a client owner cannot enumerate leads'
);

RESET ROLE;
SELECT * FROM finish();
ROLLBACK;
