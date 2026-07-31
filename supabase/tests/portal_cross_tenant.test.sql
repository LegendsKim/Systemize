-- Cross-company and cross-project RLS contract.

BEGIN;
SET LOCAL search_path = public, extensions;
SELECT no_plan();

INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) VALUES
(
  '71000000-0000-4000-8000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'tenantowner@gmail.com', '', now(),
  '{"provider":"google","providers":["google"]}'::jsonb, '{}'::jsonb, now(), now()
),
(
  '71000000-0000-4000-8000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'clienta@gmail.com', '', now(),
  '{"provider":"google","providers":["google"]}'::jsonb, '{}'::jsonb, now(), now()
),
(
  '71000000-0000-4000-8000-000000000003',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'clientb@gmail.com', '', now(),
  '{"provider":"google","providers":["google"]}'::jsonb, '{}'::jsonb, now(), now()
);

INSERT INTO public.profiles (id, email, full_name, app_role) VALUES
('71000000-0000-4000-8000-000000000001', 'tenantowner@gmail.com', 'Tenant Owner', 'systemize_owner'),
('71000000-0000-4000-8000-000000000002', 'clienta@gmail.com', 'Client A', 'client'),
('71000000-0000-4000-8000-000000000003', 'clientb@gmail.com', 'Client B', 'client');

INSERT INTO public.companies (id, name, created_by) VALUES
('72000000-0000-4000-8000-000000000001', 'Company A', '71000000-0000-4000-8000-000000000001'),
('72000000-0000-4000-8000-000000000002', 'Company B', '71000000-0000-4000-8000-000000000001');
INSERT INTO public.company_people (
  id, company_id, user_id, full_name, email, phone, created_by
) VALUES
(
  '73000000-0000-4000-8000-000000000001',
  '72000000-0000-4000-8000-000000000001',
  '71000000-0000-4000-8000-000000000002',
  'Client A', 'clienta@gmail.com', '0501111111',
  '71000000-0000-4000-8000-000000000001'
),
(
  '73000000-0000-4000-8000-000000000002',
  '72000000-0000-4000-8000-000000000002',
  '71000000-0000-4000-8000-000000000003',
  'Client B', 'clientb@gmail.com', '0502222222',
  '71000000-0000-4000-8000-000000000001'
);
INSERT INTO public.projects (id, company_id, name, created_by) VALUES
(
  '74000000-0000-4000-8000-000000000001',
  '72000000-0000-4000-8000-000000000001',
  'Project A',
  '71000000-0000-4000-8000-000000000001'
),
(
  '74000000-0000-4000-8000-000000000002',
  '72000000-0000-4000-8000-000000000002',
  'Project B',
  '71000000-0000-4000-8000-000000000001'
);
INSERT INTO public.project_memberships (
  project_id, user_id, person_id, added_by
) VALUES
(
  '74000000-0000-4000-8000-000000000001',
  '71000000-0000-4000-8000-000000000002',
  '73000000-0000-4000-8000-000000000001',
  '71000000-0000-4000-8000-000000000001'
),
(
  '74000000-0000-4000-8000-000000000002',
  '71000000-0000-4000-8000-000000000003',
  '73000000-0000-4000-8000-000000000002',
  '71000000-0000-4000-8000-000000000001'
);
INSERT INTO public.project_events (
  project_id, event_type, idempotency_key
) VALUES
('74000000-0000-4000-8000-000000000001', 'tenant_fixture_a', 'tenant-event-a'),
('74000000-0000-4000-8000-000000000002', 'tenant_fixture_b', 'tenant-event-b');

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '71000000-0000-4000-8000-000000000002', true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);

SELECT is((SELECT count(*) FROM public.projects), 1::bigint, 'client A sees only project A');
SELECT is((SELECT count(*) FROM public.companies), 1::bigint, 'client A sees only company A');
SELECT is((SELECT count(*) FROM public.company_people), 1::bigint, 'client A sees no people from company B');
SELECT is((SELECT count(*) FROM public.project_memberships), 1::bigint, 'client A sees no memberships from project B');
SELECT is((SELECT count(*) FROM public.project_events), 1::bigint, 'client A sees no events from project B');
SELECT is((SELECT count(*) FROM public.project_invitations), 0::bigint, 'client A cannot enumerate invitations');

UPDATE public.projects
SET name = 'Cross-tenant mutation'
WHERE id = '74000000-0000-4000-8000-000000000002';

RESET ROLE;
SELECT is(
  (SELECT name FROM public.projects WHERE id = '74000000-0000-4000-8000-000000000002'),
  'Project B',
  'a client cannot mutate a project by guessing its identifier'
);

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '71000000-0000-4000-8000-000000000001', true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SELECT is(
  (
    SELECT count(*)
    FROM public.projects
    WHERE id IN (
      '74000000-0000-4000-8000-000000000001',
      '74000000-0000-4000-8000-000000000002'
    )
  ),
  2::bigint,
  'the SYSTEMIZE owner can operate across both fixture projects'
);

RESET ROLE;
SELECT * FROM finish();
ROLLBACK;
