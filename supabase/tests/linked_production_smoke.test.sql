BEGIN;
SET LOCAL search_path = public, extensions;
SELECT plan(17);

SELECT has_table(
  'public',
  'push_subscriptions',
  'production has per-device push subscriptions'
);

SELECT has_table(
  'public',
  'notification_preferences',
  'production has notification preferences'
);

SELECT has_table(
  'private',
  'push_outbox',
  'production has the durable private push outbox'
);

SELECT ok(
  (SELECT relrowsecurity
   FROM pg_class
   WHERE oid = 'public.push_subscriptions'::regclass),
  'production push subscriptions have RLS enabled'
);

SELECT ok(
  (SELECT relrowsecurity
   FROM pg_class
   WHERE oid = 'public.notification_preferences'::regclass),
  'production notification preferences have RLS enabled'
);

SELECT has_function(
  'public',
  'claim_push_batch',
  ARRAY['integer'],
  'production has the bounded push claim RPC'
);

SELECT has_function(
  'public',
  'settle_push_delivery',
  ARRAY['uuid', 'text', 'text'],
  'production has the push settlement RPC'
);

SELECT has_column(
  'public',
  'profiles',
  'portal_onboarded_at',
  'production has the portal onboarding marker'
);

SELECT has_column(
  'public',
  'client_intakes',
  'client_reply',
  'production has client replies to review notes'
);

SELECT has_function(
  'public',
  'save_client_intake',
  ARRAY['uuid', 'jsonb', 'smallint', 'boolean', 'uuid', 'text'],
  'production has the dialogue-aware intake save RPC'
);

SELECT has_function(
  'public',
  'autosave_client_intake',
  ARRAY['uuid', 'jsonb', 'smallint', 'text'],
  'production has the intake autosave RPC'
);

SELECT has_function(
  'public',
  'complete_portal_onboarding',
  ARRAY[]::text[],
  'production has the onboarding completion RPC'
);

SELECT has_function(
  'public',
  'project_push_readiness',
  ARRAY['uuid'],
  'production has the owner push-readiness RPC'
);

SELECT ok(
  EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'private'
      AND tablename = 'push_outbox'
      AND indexname = 'push_outbox_due_idx'
  ),
  'production has the due-work outbox index'
);

SELECT has_function(
  'public',
  'before_user_created_invite_only',
  ARRAY['jsonb'],
  'production has the invite-only Auth admission hook'
);

SELECT ok(
  has_function_privilege(
    'supabase_auth_admin',
    'public.before_user_created_invite_only(jsonb)',
    'EXECUTE'
  ),
  'Supabase Auth can execute the invite-only hook'
);

SELECT ok(
  NOT has_function_privilege(
    'anon',
    'public.before_user_created_invite_only(jsonb)',
    'EXECUTE'
  ),
  'the invite-only hook is not exposed through the anonymous API'
);

SELECT * FROM finish();
ROLLBACK;
