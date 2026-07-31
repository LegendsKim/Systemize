-- SYSTEMIZE PORTAL foundation contract tests.
-- Run after migrations with: npm run test:db

BEGIN;
SET LOCAL search_path = public, extensions;
SELECT no_plan();

SELECT has_table('public', 'profiles', 'profiles exists');
SELECT has_table('public', 'companies', 'companies exists');
SELECT has_table('public', 'company_people', 'company_people exists');
SELECT has_table('public', 'projects', 'projects exists');
SELECT has_table('public', 'project_memberships', 'project_memberships exists');
SELECT has_table('public', 'project_invitations', 'project_invitations exists');
SELECT has_table('public', 'project_events', 'project_events exists');

SELECT has_function(
  'public',
  'create_company_project',
  ARRAY['uuid', 'uuid', 'text', 'text', 'text'],
  'company and project creation has one transactional RPC'
);
SELECT has_function(
  'public',
  'create_project_invitation',
  ARRAY['uuid', 'uuid', 'text', 'text', 'text', 'text', 'text', 'timestamp with time zone'],
  'invitation creation has one transactional RPC'
);
SELECT has_function(
  'public',
  'accept_project_invitation',
  ARRAY['text', 'uuid', 'text'],
  'invitation activation has one transactional RPC'
);

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.profiles'::regclass),
  'profiles has RLS'
);
SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.companies'::regclass),
  'companies has RLS'
);
SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.company_people'::regclass),
  'company_people has RLS'
);
SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.projects'::regclass),
  'projects has RLS'
);
SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.project_memberships'::regclass),
  'project_memberships has RLS'
);
SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.project_invitations'::regclass),
  'project_invitations has RLS'
);
SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.project_events'::regclass),
  'project_events has RLS'
);

SELECT is(
  (
    SELECT count(*)
    FROM information_schema.role_table_grants
    WHERE table_schema = 'public'
      AND table_name IN (
        'profiles',
        'companies',
        'company_people',
        'projects',
        'project_memberships',
        'project_invitations',
        'project_events'
      )
      AND grantee = 'anon'
  ),
  0::bigint,
  'anon has no portal table grants'
);

SELECT is(
  (
    SELECT count(*)
    FROM information_schema.role_table_grants
    WHERE table_schema = 'public'
      AND table_name = 'project_events'
      AND grantee = 'authenticated'
      AND privilege_type IN ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE')
  ),
  0::bigint,
  'project events are append-only from browser-facing roles'
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
  '10000000-0000-4000-8000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'owner@gmail.com',
  '',
  now(),
  '{"provider":"google","providers":["google"]}'::jsonb,
  '{}'::jsonb,
  now(),
  now()
),
(
  '10000000-0000-4000-8000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'client@gmail.com',
  '',
  now(),
  '{"provider":"google","providers":["google"]}'::jsonb,
  '{}'::jsonb,
  now(),
  now()
),
(
  '10000000-0000-4000-8000-000000000003',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'outsider@gmail.com',
  '',
  now(),
  '{"provider":"google","providers":["google"]}'::jsonb,
  '{}'::jsonb,
  now(),
  now()
),
(
  '10000000-0000-4000-8000-000000000004',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'invited@gmail.com',
  '',
  now(),
  '{"provider":"google","providers":["google"]}'::jsonb,
  '{}'::jsonb,
  now(),
  now()
);

INSERT INTO public.profiles (id, email, full_name, app_role) VALUES
(
  '10000000-0000-4000-8000-000000000001',
  'owner@gmail.com',
  'Systemize Owner',
  'systemize_owner'
),
(
  '10000000-0000-4000-8000-000000000002',
  'client@gmail.com',
  'Client Owner',
  'client'
),
(
  '10000000-0000-4000-8000-000000000003',
  'outsider@gmail.com',
  'Outside User',
  'client'
);

INSERT INTO public.companies (id, name, created_by) VALUES (
  '20000000-0000-4000-8000-000000000001',
  'Fixture Company',
  '10000000-0000-4000-8000-000000000001'
);

INSERT INTO public.company_people (
  id,
  company_id,
  user_id,
  full_name,
  email,
  phone,
  created_by
) VALUES
(
  '30000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000002',
  'Client Owner',
  'client@gmail.com',
  '0501234567',
  '10000000-0000-4000-8000-000000000001'
),
(
  '30000000-0000-4000-8000-000000000002',
  '20000000-0000-4000-8000-000000000001',
  NULL,
  'Invited Owner',
  'invited@gmail.com',
  '0507654321',
  '10000000-0000-4000-8000-000000000001'
);

INSERT INTO public.projects (id, company_id, name, created_by) VALUES (
  '40000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000001',
  'Fixture Project',
  '10000000-0000-4000-8000-000000000001'
);

INSERT INTO public.project_memberships (
  project_id,
  user_id,
  person_id,
  added_by
) VALUES (
  '40000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000002',
  '30000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001'
);

INSERT INTO public.project_invitations (
  id,
  company_id,
  project_id,
  person_id,
  email,
  token_hash,
  idempotency_key,
  expires_at,
  created_by
) VALUES (
  '50000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000001',
  '40000000-0000-4000-8000-000000000001',
  '30000000-0000-4000-8000-000000000002',
  'invited@gmail.com',
  repeat('a', 64),
  'fixture-invitation-accept',
  now() + interval '7 days',
  '10000000-0000-4000-8000-000000000001'
);

SET LOCAL ROLE authenticated;
SELECT set_config(
  'request.jwt.claim.sub',
  '10000000-0000-4000-8000-000000000002',
  true
);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);

SELECT is(
  (SELECT count(*) FROM public.projects),
  1::bigint,
  'a client owner can read their project'
);
SELECT is(
  (SELECT count(*) FROM public.companies),
  1::bigint,
  'a client owner can read their company'
);
SELECT is(
  (SELECT count(*) FROM public.project_invitations),
  0::bigint,
  'a client owner cannot enumerate invitations'
);
SELECT throws_ok(
  $$INSERT INTO public.companies (name, created_by)
    VALUES ('Forbidden Company', '10000000-0000-4000-8000-000000000002')$$,
  '42501',
  NULL,
  'a client owner cannot create a company'
);

RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT set_config(
  'request.jwt.claim.sub',
  '10000000-0000-4000-8000-000000000003',
  true
);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);

SELECT is(
  (SELECT count(*) FROM public.projects),
  0::bigint,
  'an authenticated outsider cannot read another project'
);
SELECT throws_ok(
  $$SELECT public.create_project_invitation(
      '50000000-0000-4000-8000-000000000010',
      '40000000-0000-4000-8000-000000000001',
      'Forbidden Invite',
      'forbidden@gmail.com',
      '0500000000',
      repeat('b', 64),
      'forbidden-invite-key',
      now() + interval '7 days'
    )$$,
  '42501',
  'systemize_owner_required',
  'a client cannot create an invitation'
);

RESET ROLE;
SET LOCAL ROLE service_role;
SELECT set_config('request.jwt.claim.role', 'service_role', true);

SELECT lives_ok(
  $$SELECT public.accept_project_invitation(
      repeat('a', 64),
      '10000000-0000-4000-8000-000000000004',
      'invited@gmail.com'
    )$$,
  'the service boundary atomically accepts a matching invitation'
);

RESET ROLE;
SELECT is(
  (
    SELECT status::text
    FROM public.project_invitations
    WHERE id = '50000000-0000-4000-8000-000000000001'
  ),
  'accepted',
  'the invitation is consumed'
);
SELECT is(
  (
    SELECT count(*)
    FROM public.project_memberships
    WHERE project_id = '40000000-0000-4000-8000-000000000001'
      AND user_id = '10000000-0000-4000-8000-000000000004'
      AND status = 'active'
  ),
  1::bigint,
  'activation creates exactly one active membership'
);

SET LOCAL ROLE service_role;
SELECT set_config('request.jwt.claim.role', 'service_role', true);
SELECT throws_ok(
  $$SELECT public.accept_project_invitation(
      repeat('a', 64),
      '10000000-0000-4000-8000-000000000004',
      'invited@gmail.com'
    )$$,
  '42501',
  'invalid_or_expired_invitation',
  'an accepted invitation cannot be reused'
);

RESET ROLE;
SELECT * FROM finish();
ROLLBACK;
