-- Owner entity-management contract and invitation-binding invariants.

BEGIN;
SET LOCAL search_path = public, extensions;
SELECT no_plan();

SELECT has_function(
  'public',
  'update_project_details',
  ARRAY['uuid', 'text', 'text', 'text'],
  'project detail editing has one transactional RPC'
);
SELECT has_function(
  'public',
  'update_company_person',
  ARRAY['uuid', 'uuid', 'text', 'text', 'text', 'text'],
  'contact editing has one transactional RPC'
);

INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) VALUES
(
  '81000000-0000-4000-8000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'entityowner@gmail.com', '', now(),
  '{"provider":"google","providers":["google"]}'::jsonb, '{}'::jsonb, now(), now()
),
(
  '81000000-0000-4000-8000-000000000002',
  '00000000-0000-0000-8000-000000000000',
  'authenticated', 'authenticated', 'entityclient@gmail.com', '', now(),
  '{"provider":"google","providers":["google"]}'::jsonb, '{}'::jsonb, now(), now()
);

INSERT INTO public.profiles (id, email, full_name, app_role) VALUES
('81000000-0000-4000-8000-000000000001', 'entityowner@gmail.com', 'Entity Owner', 'systemize_owner'),
('81000000-0000-4000-8000-000000000002', 'entityclient@gmail.com', 'Entity Client', 'client');
INSERT INTO public.companies (id, name, created_by) VALUES (
  '82000000-0000-4000-8000-000000000001',
  'Original Company',
  '81000000-0000-4000-8000-000000000001'
);
INSERT INTO public.company_people (
  id, company_id, user_id, full_name, email, phone, created_by
) VALUES
(
  '83000000-0000-4000-8000-000000000001',
  '82000000-0000-4000-8000-000000000001',
  NULL,
  'Pending Person',
  'pendingentity@gmail.com',
  '0501111111',
  '81000000-0000-4000-8000-000000000001'
),
(
  '83000000-0000-4000-8000-000000000002',
  '82000000-0000-4000-8000-000000000001',
  '81000000-0000-4000-8000-000000000002',
  'Active Person',
  'entityclient@gmail.com',
  '0502222222',
  '81000000-0000-4000-8000-000000000001'
);
INSERT INTO public.projects (id, company_id, name, created_by) VALUES (
  '84000000-0000-4000-8000-000000000001',
  '82000000-0000-4000-8000-000000000001',
  'Original Project',
  '81000000-0000-4000-8000-000000000001'
);
INSERT INTO public.project_memberships (
  project_id, user_id, person_id, added_by
) VALUES (
  '84000000-0000-4000-8000-000000000001',
  '81000000-0000-4000-8000-000000000002',
  '83000000-0000-4000-8000-000000000002',
  '81000000-0000-4000-8000-000000000001'
);
INSERT INTO public.project_invitations (
  id, company_id, project_id, person_id, email, token_hash,
  idempotency_key, expires_at, created_by
) VALUES (
  '85000000-0000-4000-8000-000000000001',
  '82000000-0000-4000-8000-000000000001',
  '84000000-0000-4000-8000-000000000001',
  '83000000-0000-4000-8000-000000000001',
  'pendingentity@gmail.com',
  repeat('d', 64),
  'entity-pending-invitation',
  now() + interval '7 days',
  '81000000-0000-4000-8000-000000000001'
);

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '81000000-0000-4000-8000-000000000002', true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SELECT throws_ok(
  $$SELECT public.update_project_details(
      '84000000-0000-4000-8000-000000000001',
      'Forbidden Company',
      'Forbidden Project',
      'client-project-update'
    )$$,
  '42501',
  'systemize_owner_required',
  'a client cannot edit project identity'
);

RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '81000000-0000-4000-8000-000000000001', true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);

SELECT lives_ok(
  $$SELECT public.update_project_details(
      '84000000-0000-4000-8000-000000000001',
      'Updated Company',
      'Updated Project',
      'owner-project-update'
    )$$,
  'the owner can update company and project names atomically'
);
SELECT is(
  (SELECT name FROM public.companies WHERE id = '82000000-0000-4000-8000-000000000001'),
  'Updated Company',
  'the company name changed'
);
SELECT is(
  (SELECT name FROM public.projects WHERE id = '84000000-0000-4000-8000-000000000001'),
  'Updated Project',
  'the project name changed'
);

SELECT lives_ok(
  $$SELECT public.update_company_person(
      '84000000-0000-4000-8000-000000000001',
      '83000000-0000-4000-8000-000000000001',
      'Updated Person',
      'updatedentity@gmail.com',
      '0503333333',
      'owner-contact-update'
    )$$,
  'the owner can update an unactivated contact'
);
SELECT is(
  (
    SELECT status::text
    FROM public.project_invitations
    WHERE id = '85000000-0000-4000-8000-000000000001'
  ),
  'revoked',
  'changing Gmail revokes the stale invitation'
);
SELECT throws_ok(
  $$SELECT public.update_company_person(
      '84000000-0000-4000-8000-000000000001',
      '83000000-0000-4000-8000-000000000002',
      'Active Person',
      'differentidentity@gmail.com',
      '0502222222',
      'owner-active-email-update'
    )$$,
  '22023',
  'activated_contact_email_immutable',
  'an activated Google identity cannot be silently replaced'
);

RESET ROLE;
SELECT * FROM finish();
ROLLBACK;
