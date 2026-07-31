-- Local-only deterministic fixtures.
-- Never add real names, contact details, tokens, or project content here.

INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES
(
  'e1000000-0000-4000-8000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'e2e.owner@gmail.com',
  crypt('systemize-e2e-password', gen_salt('bf')),
  now(),
  '',
  '',
  '',
  '',
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"E2E Systemize Owner"}'::jsonb,
  now(),
  now()
),
(
  'e1000000-0000-4000-8000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'e2e.client.a@gmail.com',
  crypt('systemize-e2e-password', gen_salt('bf')),
  now(),
  '',
  '',
  '',
  '',
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"E2E Client A"}'::jsonb,
  now(),
  now()
),
(
  'e1000000-0000-4000-8000-000000000003',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'e2e.client.b@gmail.com',
  crypt('systemize-e2e-password', gen_salt('bf')),
  now(),
  '',
  '',
  '',
  '',
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"E2E Client B"}'::jsonb,
  now(),
  now()
);

INSERT INTO auth.identities (
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES
(
  'e1000000-0000-4000-8000-000000000001',
  'e1000000-0000-4000-8000-000000000001',
  '{"sub":"e1000000-0000-4000-8000-000000000001","email":"e2e.owner@gmail.com","email_verified":true}'::jsonb,
  'email',
  now(),
  now(),
  now()
),
(
  'e1000000-0000-4000-8000-000000000002',
  'e1000000-0000-4000-8000-000000000002',
  '{"sub":"e1000000-0000-4000-8000-000000000002","email":"e2e.client.a@gmail.com","email_verified":true}'::jsonb,
  'email',
  now(),
  now(),
  now()
),
(
  'e1000000-0000-4000-8000-000000000003',
  'e1000000-0000-4000-8000-000000000003',
  '{"sub":"e1000000-0000-4000-8000-000000000003","email":"e2e.client.b@gmail.com","email_verified":true}'::jsonb,
  'email',
  now(),
  now(),
  now()
);

INSERT INTO public.profiles (id, email, full_name, app_role) VALUES
(
  'e1000000-0000-4000-8000-000000000001',
  'e2e.owner@gmail.com',
  'E2E Systemize Owner',
  'systemize_owner'
),
(
  'e1000000-0000-4000-8000-000000000002',
  'e2e.client.a@gmail.com',
  'E2E Client A',
  'client'
),
(
  'e1000000-0000-4000-8000-000000000003',
  'e2e.client.b@gmail.com',
  'E2E Client B',
  'client'
);

INSERT INTO public.companies (id, name, created_by) VALUES
(
  'e2000000-0000-4000-8000-000000000001',
  'E2E Company A',
  'e1000000-0000-4000-8000-000000000001'
),
(
  'e2000000-0000-4000-8000-000000000002',
  'E2E Company B',
  'e1000000-0000-4000-8000-000000000001'
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
  'e3000000-0000-4000-8000-000000000001',
  'e2000000-0000-4000-8000-000000000001',
  'e1000000-0000-4000-8000-000000000002',
  'E2E Client A',
  'e2e.client.a@gmail.com',
  '0500000001',
  'e1000000-0000-4000-8000-000000000001'
),
(
  'e3000000-0000-4000-8000-000000000002',
  'e2000000-0000-4000-8000-000000000002',
  'e1000000-0000-4000-8000-000000000003',
  'E2E Client B',
  'e2e.client.b@gmail.com',
  '0500000002',
  'e1000000-0000-4000-8000-000000000001'
);

INSERT INTO public.projects (id, company_id, name, created_by) VALUES
(
  'e4000000-0000-4000-8000-000000000001',
  'e2000000-0000-4000-8000-000000000001',
  'E2E Project A',
  'e1000000-0000-4000-8000-000000000001'
),
(
  'e4000000-0000-4000-8000-000000000002',
  'e2000000-0000-4000-8000-000000000002',
  'E2E Project B',
  'e1000000-0000-4000-8000-000000000001'
);

INSERT INTO public.project_memberships (
  project_id,
  user_id,
  person_id,
  added_by
) VALUES
(
  'e4000000-0000-4000-8000-000000000001',
  'e1000000-0000-4000-8000-000000000002',
  'e3000000-0000-4000-8000-000000000001',
  'e1000000-0000-4000-8000-000000000001'
),
(
  'e4000000-0000-4000-8000-000000000002',
  'e1000000-0000-4000-8000-000000000003',
  'e3000000-0000-4000-8000-000000000002',
  'e1000000-0000-4000-8000-000000000001'
);
