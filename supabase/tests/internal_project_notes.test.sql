-- Internal notes contract: the SYSTEMIZE owner writes and reads them, and a client
-- owner with an active membership on the very same project sees nothing at all.
-- Run after migrations with: npm run test:db

BEGIN;
SET LOCAL search_path = public, extensions;
SELECT no_plan();

SELECT has_table(
  'public',
  'project_internal_notes',
  'internal project notes exist'
);
SELECT ok(
  (
    SELECT relrowsecurity
    FROM pg_class
    WHERE oid = 'public.project_internal_notes'::regclass
  ),
  'internal project notes have RLS'
);
SELECT is(
  (
    SELECT count(*)
    FROM information_schema.role_table_grants
    WHERE table_schema = 'public'
      AND table_name = 'project_internal_notes'
      AND grantee IN ('anon', 'authenticated', 'service_role')
      AND privilege_type IN ('DELETE', 'TRUNCATE')
  ),
  0::bigint,
  'internal notes cannot be destroyed by any application role'
);
SELECT is(
  (
    SELECT count(*)
    FROM information_schema.role_table_grants
    WHERE table_schema = 'public'
      AND table_name = 'project_internal_notes'
      AND grantee = 'anon'
  ),
  0::bigint,
  'anonymous visitors hold no grant on internal notes'
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
  '30000000-0000-4000-8000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'notesowner@gmail.com',
  '',
  now(),
  '{"provider":"google","providers":["google"]}'::jsonb,
  '{}'::jsonb,
  now(),
  now()
),
(
  '30000000-0000-4000-8000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'notesclient@gmail.com',
  '',
  now(),
  '{"provider":"google","providers":["google"]}'::jsonb,
  '{}'::jsonb,
  now(),
  now()
);

INSERT INTO public.profiles (id, email, full_name, app_role) VALUES
(
  '30000000-0000-4000-8000-000000000001',
  'notesowner@gmail.com',
  'Systemize Owner',
  'systemize_owner'
),
(
  '30000000-0000-4000-8000-000000000002',
  'notesclient@gmail.com',
  'Client Owner',
  'client'
);

INSERT INTO public.companies (id, name, created_by) VALUES (
  '30000000-0000-4000-8000-00000000000a',
  'Notes Company',
  '30000000-0000-4000-8000-000000000001'
);

INSERT INTO public.company_people (
  id,
  company_id,
  user_id,
  full_name,
  email,
  phone,
  created_by
) VALUES (
  '30000000-0000-4000-8000-00000000000b',
  '30000000-0000-4000-8000-00000000000a',
  '30000000-0000-4000-8000-000000000002',
  'Client Owner',
  'notesclient@gmail.com',
  '0501234567',
  '30000000-0000-4000-8000-000000000001'
);

INSERT INTO public.projects (id, company_id, name, created_by) VALUES (
  '30000000-0000-4000-8000-00000000000c',
  '30000000-0000-4000-8000-00000000000a',
  'Notes Project',
  '30000000-0000-4000-8000-000000000001'
);

INSERT INTO public.project_memberships (
  project_id,
  user_id,
  person_id,
  added_by
) VALUES (
  '30000000-0000-4000-8000-00000000000c',
  '30000000-0000-4000-8000-000000000002',
  '30000000-0000-4000-8000-00000000000b',
  '30000000-0000-4000-8000-000000000001'
);

SET LOCAL ROLE authenticated;
SELECT set_config(
  'request.jwt.claim.sub',
  '30000000-0000-4000-8000-000000000001',
  true
);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);

SELECT lives_ok(
  $$INSERT INTO public.project_internal_notes (
      project_id,
      impression,
      budget_signal,
      readiness,
      risks,
      flags,
      updated_by
    ) VALUES (
      '30000000-0000-4000-8000-00000000000c',
      'Named a budget well below the real cost.',
      'Around 20k, expects 60k of scope.',
      'low',
      'Decision maker was not in the room.',
      'Asked twice whether the discovery fee is refundable.',
      '30000000-0000-4000-8000-000000000001'
    )$$,
  'the SYSTEMIZE owner records internal notes'
);
SELECT is(
  (SELECT count(*) FROM public.project_internal_notes),
  1::bigint,
  'the SYSTEMIZE owner reads their own notes'
);
SELECT lives_ok(
  $$UPDATE public.project_internal_notes
    SET readiness = 'medium'
    WHERE project_id = '30000000-0000-4000-8000-00000000000c'$$,
  'notes stay editable as the engagement develops'
);
SELECT throws_ok(
  $$DELETE FROM public.project_internal_notes$$,
  '42501',
  NULL,
  'notes cannot be destroyed from the console'
);

RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT set_config(
  'request.jwt.claim.sub',
  '30000000-0000-4000-8000-000000000002',
  true
);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);

-- The point of the whole migration: an active member of this exact project.
SELECT is(
  (SELECT count(*) FROM public.projects),
  1::bigint,
  'the client owner really is an active member of this project'
);
SELECT is(
  (SELECT count(*) FROM public.project_internal_notes),
  0::bigint,
  'the client owner cannot read internal notes about their own project'
);
SELECT throws_ok(
  $$INSERT INTO public.project_internal_notes (project_id, updated_by)
    VALUES (
      '30000000-0000-4000-8000-00000000000c',
      '30000000-0000-4000-8000-000000000002'
    )$$,
  '42501',
  NULL,
  'the client owner cannot write internal notes'
);

RESET ROLE;
SELECT * FROM finish();
ROLLBACK;
