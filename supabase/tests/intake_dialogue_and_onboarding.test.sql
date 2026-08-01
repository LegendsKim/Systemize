-- The intake as a two-way exchange: a change request survives a saved draft, the client's
-- answer to it travels with the re-submission, and the orientation is recorded once.
-- Run after migrations with: npm run test:db

BEGIN;
SET LOCAL search_path = public, extensions;
SELECT no_plan();

SELECT has_column(
  'public',
  'client_intakes',
  'client_reply',
  'the intake carries the client answer to a review note'
);
SELECT has_column(
  'public',
  'profiles',
  'portal_onboarded_at',
  'the profile records that the orientation was read'
);
SELECT has_function(
  'public',
  'complete_portal_onboarding',
  'finishing the orientation goes through an RPC, not a table grant'
);
SELECT has_function(
  'public',
  'project_push_readiness',
  ARRAY['uuid'],
  'push reach is answerable without reading subscription rows'
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
  '40000000-0000-4000-8000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'dialogueowner@gmail.com',
  '',
  now(),
  '{"provider":"google","providers":["google"]}'::jsonb,
  '{}'::jsonb,
  now(),
  now()
),
(
  '40000000-0000-4000-8000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'dialogueclient@gmail.com',
  '',
  now(),
  '{"provider":"google","providers":["google"]}'::jsonb,
  '{}'::jsonb,
  now(),
  now()
);

INSERT INTO public.profiles (id, email, full_name, app_role) VALUES
(
  '40000000-0000-4000-8000-000000000001',
  'dialogueowner@gmail.com',
  'Systemize Owner',
  'systemize_owner'
),
(
  '40000000-0000-4000-8000-000000000002',
  'dialogueclient@gmail.com',
  'Client Owner',
  'client'
);

INSERT INTO public.companies (id, name, created_by) VALUES (
  '40000000-0000-4000-8000-00000000000a',
  'Dialogue Company',
  '40000000-0000-4000-8000-000000000001'
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
  '40000000-0000-4000-8000-00000000000b',
  '40000000-0000-4000-8000-00000000000a',
  '40000000-0000-4000-8000-000000000002',
  'Client Owner',
  'dialogueclient@gmail.com',
  '0501234567',
  '40000000-0000-4000-8000-000000000001'
);

INSERT INTO public.projects (id, company_id, name, created_by) VALUES (
  '40000000-0000-4000-8000-00000000000c',
  '40000000-0000-4000-8000-00000000000a',
  'Dialogue Project',
  '40000000-0000-4000-8000-000000000001'
);

INSERT INTO public.project_memberships (
  project_id,
  user_id,
  person_id,
  added_by
) VALUES (
  '40000000-0000-4000-8000-00000000000c',
  '40000000-0000-4000-8000-000000000002',
  '40000000-0000-4000-8000-00000000000b',
  '40000000-0000-4000-8000-000000000001'
);

-- The client fills the intake and submits it.
SET LOCAL ROLE authenticated;
SELECT set_config(
  'request.jwt.claim.sub',
  '40000000-0000-4000-8000-000000000002',
  true
);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);

SELECT lives_ok(
  $$SELECT public.save_client_intake(
      '40000000-0000-4000-8000-00000000000c',
      '{"companyOverview":"A company that does real work for real people."}'::jsonb,
      1::smallint,
      true,
      '40000000-0000-4000-8000-0000000000f1',
      NULL
    )$$,
  'the client submits the intake for review'
);

SELECT is(
  (
    SELECT status::text
    FROM public.client_intakes
    WHERE project_id = '40000000-0000-4000-8000-00000000000c'
  ),
  'submitted',
  'a submitted intake is waiting on SYSTEMIZE'
);

-- The owner asks for one correction.
RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT set_config(
  'request.jwt.claim.sub',
  '40000000-0000-4000-8000-000000000001',
  true
);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);

SELECT lives_ok(
  $$SELECT public.review_client_intake(
      '40000000-0000-4000-8000-00000000000c',
      'request_changes',
      'חסר לנו מי מקבל את ההחלטה בפועל.',
      '40000000-0000-4000-8000-0000000000f2'
    )$$,
  'the owner requests a correction with a note'
);

-- Back to the client: saving a draft must not erase the request.
RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT set_config(
  'request.jwt.claim.sub',
  '40000000-0000-4000-8000-000000000002',
  true
);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);

SELECT lives_ok(
  $$SELECT public.save_client_intake(
      '40000000-0000-4000-8000-00000000000c',
      '{"companyOverview":"A company that does real work for real people."}'::jsonb,
      1::smallint,
      false,
      '40000000-0000-4000-8000-0000000000f3',
      'עונה בהמשך היום.'
    )$$,
  'the client saves a draft while the correction is open'
);

SELECT is(
  (
    SELECT status::text
    FROM public.client_intakes
    WHERE project_id = '40000000-0000-4000-8000-00000000000c'
  ),
  'changes_requested',
  'a saved draft leaves the change request standing'
);
SELECT isnt(
  (
    SELECT review_note
    FROM public.client_intakes
    WHERE project_id = '40000000-0000-4000-8000-00000000000c'
  ),
  NULL,
  'the review note survives the save that used to delete it'
);

SELECT lives_ok(
  $$SELECT public.autosave_client_intake(
      '40000000-0000-4000-8000-00000000000c',
      '{"companyOverview":"A company that does real work for real people, expanded."}'::jsonb,
      2::smallint,
      'המנכ"ל מחליט, מנהלת התפעול מאשרת.'
    )$$,
  'autosave stores work in progress'
);

SELECT is(
  (
    SELECT status::text
    FROM public.client_intakes
    WHERE project_id = '40000000-0000-4000-8000-00000000000c'
  ),
  'changes_requested',
  'autosave transitions nothing'
);
SELECT is(
  (
    SELECT client_reply
    FROM public.client_intakes
    WHERE project_id = '40000000-0000-4000-8000-00000000000c'
  ),
  'המנכ"ל מחליט, מנהלת התפעול מאשרת.',
  'the reply is kept next to the answers it belongs to'
);

SELECT lives_ok(
  $$SELECT public.save_client_intake(
      '40000000-0000-4000-8000-00000000000c',
      '{"companyOverview":"A company that does real work for real people, expanded."}'::jsonb,
      2::smallint,
      true,
      '40000000-0000-4000-8000-0000000000f4',
      'המנכ"ל מחליט, מנהלת התפעול מאשרת.'
    )$$,
  'the client answers the note and re-submits'
);

SELECT is(
  (
    SELECT status::text
    FROM public.client_intakes
    WHERE project_id = '40000000-0000-4000-8000-00000000000c'
  ),
  'submitted',
  're-submission puts the intake back in review'
);
SELECT is(
  (
    SELECT review_note
    FROM public.client_intakes
    WHERE project_id = '40000000-0000-4000-8000-00000000000c'
  ),
  NULL,
  'the answered note is cleared by the re-submission, not by a draft save'
);
SELECT throws_ok(
  $$SELECT public.autosave_client_intake(
      '40000000-0000-4000-8000-00000000000c',
      '{"companyOverview":"Edited after submission."}'::jsonb,
      2::smallint,
      NULL
    )$$,
  '55000',
  NULL,
  'autosave cannot edit an intake that is already under review'
);

SELECT is(
  (
    SELECT portal_onboarded_at
    FROM public.profiles
    WHERE id = '40000000-0000-4000-8000-000000000002'
  ),
  NULL,
  'the orientation starts unread'
);
SELECT lives_ok(
  $$SELECT public.complete_portal_onboarding()$$,
  'the client records that the orientation was read'
);
SELECT isnt(
  (
    SELECT portal_onboarded_at
    FROM public.profiles
    WHERE id = '40000000-0000-4000-8000-000000000002'
  ),
  NULL,
  'the orientation is not owed twice'
);

SELECT throws_ok(
  $$SELECT * FROM public.project_push_readiness(
      '40000000-0000-4000-8000-00000000000c'
    )$$,
  '42501',
  NULL,
  'a client cannot read push reach for their project'
);

RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT set_config(
  'request.jwt.claim.sub',
  '40000000-0000-4000-8000-000000000001',
  true
);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);

-- Read as the owner: a client cannot see the owner's notifications, which is the point.
SELECT is(
  (
    SELECT count(*)
    FROM public.notifications
    WHERE recipient_user_id = '40000000-0000-4000-8000-000000000001'
      AND kind = 'client_intake_submitted'
  ),
  2::bigint,
  'both the first submission and the corrected one reach the owner'
);

SELECT is(
  (
    SELECT members_with_push
    FROM public.project_push_readiness(
      '40000000-0000-4000-8000-00000000000c'
    )
  ),
  0,
  'the owner sees that nobody on the project can be reached by push'
);
SELECT is(
  (
    SELECT members
    FROM public.project_push_readiness(
      '40000000-0000-4000-8000-00000000000c'
    )
  ),
  1,
  'the owner sees the number of active members it was measured against'
);

RESET ROLE;
SELECT * FROM finish();
ROLLBACK;
