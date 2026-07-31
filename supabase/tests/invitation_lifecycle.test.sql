-- Invitation lifecycle contract: owner-only, idempotent revoke/reissue with audit.

BEGIN;
SET LOCAL search_path = public, extensions;
SELECT no_plan();

SELECT has_function(
  'public',
  'revoke_project_invitation',
  ARRAY['uuid', 'text'],
  'invitation revocation has one transactional RPC'
);
SELECT has_function(
  'public',
  'reissue_project_invitation',
  ARRAY['uuid', 'uuid', 'text', 'text', 'timestamp with time zone'],
  'invitation reissue has one transactional RPC'
);

INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) VALUES
(
  '61000000-0000-4000-8000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'lifecycleowner@gmail.com', '', now(),
  '{"provider":"google","providers":["google"]}'::jsonb, '{}'::jsonb, now(), now()
),
(
  '61000000-0000-4000-8000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'lifecycleclient@gmail.com', '', now(),
  '{"provider":"google","providers":["google"]}'::jsonb, '{}'::jsonb, now(), now()
);

INSERT INTO public.profiles (id, email, full_name, app_role) VALUES
(
  '61000000-0000-4000-8000-000000000001',
  'lifecycleowner@gmail.com',
  'Lifecycle Owner',
  'systemize_owner'
),
(
  '61000000-0000-4000-8000-000000000002',
  'lifecycleclient@gmail.com',
  'Lifecycle Client',
  'client'
);

INSERT INTO public.companies (id, name, created_by) VALUES (
  '62000000-0000-4000-8000-000000000001',
  'Lifecycle Company',
  '61000000-0000-4000-8000-000000000001'
);
INSERT INTO public.company_people (
  id, company_id, full_name, email, phone, created_by
) VALUES (
  '63000000-0000-4000-8000-000000000001',
  '62000000-0000-4000-8000-000000000001',
  'Invited Person',
  'invitedlifecycle@gmail.com',
  '0501234567',
  '61000000-0000-4000-8000-000000000001'
);
INSERT INTO public.projects (id, company_id, name, created_by) VALUES (
  '64000000-0000-4000-8000-000000000001',
  '62000000-0000-4000-8000-000000000001',
  'Lifecycle Project',
  '61000000-0000-4000-8000-000000000001'
);
INSERT INTO public.project_invitations (
  id, company_id, project_id, person_id, email, token_hash,
  idempotency_key, expires_at, created_by
) VALUES (
  '65000000-0000-4000-8000-000000000001',
  '62000000-0000-4000-8000-000000000001',
  '64000000-0000-4000-8000-000000000001',
  '63000000-0000-4000-8000-000000000001',
  'invitedlifecycle@gmail.com',
  repeat('a', 64),
  'lifecycle-original-invite',
  now() + interval '7 days',
  '61000000-0000-4000-8000-000000000001'
);

SET LOCAL ROLE authenticated;
SELECT set_config(
  'request.jwt.claim.sub',
  '61000000-0000-4000-8000-000000000002',
  true
);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);

SELECT throws_ok(
  $$SELECT public.reissue_project_invitation(
      '65000000-0000-4000-8000-000000000001',
      '65000000-0000-4000-8000-000000000002',
      repeat('b', 64),
      'client-cannot-reissue',
      now() + interval '7 days'
    )$$,
  '42501',
  'systemize_owner_required',
  'a client cannot reissue an invitation'
);

RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT set_config(
  'request.jwt.claim.sub',
  '61000000-0000-4000-8000-000000000001',
  true
);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);

SELECT lives_ok(
  $$SELECT public.reissue_project_invitation(
      '65000000-0000-4000-8000-000000000001',
      '65000000-0000-4000-8000-000000000002',
      repeat('b', 64),
      'owner-reissue-idempotency',
      now() + interval '7 days'
    )$$,
  'the owner can replace a pending invitation'
);
SELECT is(
  (
    SELECT status::text
    FROM public.project_invitations
    WHERE id = '65000000-0000-4000-8000-000000000001'
  ),
  'revoked',
  'reissue revokes the previous invitation'
);
SELECT is(
  (
    SELECT status::text
    FROM public.project_invitations
    WHERE id = '65000000-0000-4000-8000-000000000002'
  ),
  'pending',
  'reissue creates one live replacement'
);
SELECT lives_ok(
  $$SELECT public.reissue_project_invitation(
      '65000000-0000-4000-8000-000000000001',
      '65000000-0000-4000-8000-000000000003',
      repeat('c', 64),
      'owner-reissue-idempotency',
      now() + interval '7 days'
    )$$,
  'replaying the idempotency key reconciles instead of duplicating'
);
SELECT is(
  (
    SELECT count(*)
    FROM public.project_invitations
    WHERE project_id = '64000000-0000-4000-8000-000000000001'
  ),
  2::bigint,
  'the replay created no duplicate invitation'
);
SELECT is(
  (
    SELECT count(*)
    FROM public.project_events
    WHERE event_type = 'invitation_reissued'
      AND project_id = '64000000-0000-4000-8000-000000000001'
  ),
  1::bigint,
  'reissue appends exactly one audit event'
);

SELECT lives_ok(
  $$SELECT public.revoke_project_invitation(
      '65000000-0000-4000-8000-000000000002',
      'owner-revoke-idempotency'
    )$$,
  'the owner can revoke the replacement'
);
SELECT lives_ok(
  $$SELECT public.revoke_project_invitation(
      '65000000-0000-4000-8000-000000000002',
      'owner-revoke-idempotency'
    )$$,
  'revocation is safe to replay'
);
SELECT is(
  (
    SELECT count(*)
    FROM public.project_events
    WHERE event_type = 'invitation_revoked'
      AND project_id = '64000000-0000-4000-8000-000000000001'
  ),
  1::bigint,
  'revocation appends exactly one audit event'
);

RESET ROLE;
SELECT * FROM finish();
ROLLBACK;
