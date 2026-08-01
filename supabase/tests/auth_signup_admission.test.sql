-- Invite-only Auth Hook contract.

BEGIN;
SET LOCAL search_path = public, extensions;
SELECT plan(10);

SELECT has_function(
  'public',
  'before_user_created_invite_only',
  ARRAY['jsonb'],
  'the before-user-created admission hook exists'
);

SELECT ok(
  has_function_privilege(
    'supabase_auth_admin',
    'public.before_user_created_invite_only(jsonb)',
    'EXECUTE'
  ),
  'Supabase Auth can execute the admission hook'
);
SELECT ok(
  NOT has_function_privilege(
    'anon',
    'public.before_user_created_invite_only(jsonb)',
    'EXECUTE'
  ),
  'anonymous callers cannot execute the admission hook'
);
SELECT ok(
  NOT has_function_privilege(
    'authenticated',
    'public.before_user_created_invite_only(jsonb)',
    'EXECUTE'
  ),
  'authenticated callers cannot execute the admission hook'
);

SELECT is(
  public.before_user_created_invite_only(
    jsonb_build_object(
      'user', jsonb_build_object(
        'email', 'e2e.owner@gmail.com',
        'app_metadata', jsonb_build_object('provider', 'google')
      )
    )
  ),
  '{}'::jsonb,
  'the configured owner is admitted'
);

INSERT INTO public.project_invitations (
  id, company_id, project_id, person_id, email, token_hash,
  idempotency_key, expires_at, created_by
) VALUES (
  'f5000000-0000-4000-8000-000000000016',
  'e2000000-0000-4000-8000-000000000001',
  'e4000000-0000-4000-8000-000000000001',
  'e3000000-0000-4000-8000-000000000001',
  'new.invited.client@gmail.com',
  repeat('f', 64),
  'auth-hook-live-invitation',
  now() + interval '7 days',
  'e1000000-0000-4000-8000-000000000001'
);

SELECT is(
  public.before_user_created_invite_only(
    jsonb_build_object(
      'user', jsonb_build_object(
        'email', 'NEW.INVITED.CLIENT@gmail.com',
        'app_metadata', jsonb_build_object('provider', 'google')
      )
    )
  ),
  '{}'::jsonb,
  'a live pending invitation admits the normalized Gmail address'
);

SELECT is(
  public.before_user_created_invite_only(
    jsonb_build_object(
      'user', jsonb_build_object(
        'email', 'not.invited@gmail.com',
        'app_metadata', jsonb_build_object('provider', 'google')
      )
    )
  )->'error'->>'http_code',
  '403',
  'an uninvited Google identity is rejected before creation'
);

UPDATE public.project_invitations
SET status = 'revoked', revoked_at = now()
WHERE id = 'f5000000-0000-4000-8000-000000000016';

SELECT is(
  public.before_user_created_invite_only(
    jsonb_build_object(
      'user', jsonb_build_object(
        'email', 'new.invited.client@gmail.com',
        'app_metadata', jsonb_build_object('provider', 'google')
      )
    )
  )->'error'->>'http_code',
  '403',
  'a revoked invitation no longer admits the identity'
);

SELECT is(
  public.before_user_created_invite_only(
    jsonb_build_object(
      'user', jsonb_build_object(
        'email', 'not.invited@gmail.com',
        'app_metadata', jsonb_build_object('provider', 'email')
      )
    )
  )->'error'->>'http_code',
  '403',
  'non-Google account creation is rejected'
);

SELECT is(
  public.before_user_created_invite_only(
    jsonb_build_object(
      'user', jsonb_build_object(
        'email', 'not-a-gmail-address',
        'app_metadata', jsonb_build_object('provider', 'google')
      )
    )
  )->'error'->>'http_code',
  '403',
  'malformed account data fails closed'
);

SELECT * FROM finish();
ROLLBACK;
