BEGIN;
SET LOCAL search_path = public, extensions;
SELECT plan(8);

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

SELECT * FROM finish();
ROLLBACK;
