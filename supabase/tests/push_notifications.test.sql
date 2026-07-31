BEGIN;
SET LOCAL search_path = public, extensions;
SELECT plan(14);

SELECT has_table('public', 'push_subscriptions', 'push subscriptions exist');
SELECT has_table('public', 'notification_preferences', 'notification preferences exist');
SELECT has_table('private', 'push_outbox', 'durable private push outbox exists');

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.push_subscriptions'::regclass),
  'push subscriptions have RLS'
);

SELECT is(
  (
    SELECT count(*)
    FROM information_schema.role_table_grants
    WHERE table_schema = 'private'
      AND table_name = 'push_outbox'
      AND grantee IN ('anon', 'authenticated')
  ),
  0::bigint,
  'browser roles cannot access the private outbox'
);

SELECT is(
  (
    SELECT count(*)
    FROM information_schema.role_table_grants
    WHERE table_schema = 'public'
      AND table_name = 'push_subscriptions'
      AND grantee = 'service_role'
      AND privilege_type IN ('SELECT', 'UPDATE', 'DELETE')
  ),
  3::bigint,
  'the dispatcher has only the required subscription delivery privileges'
);

SELECT is(
  (
    SELECT count(*)
    FROM information_schema.role_table_grants
    WHERE table_schema = 'public'
      AND table_name = 'notification_preferences'
      AND grantee = 'service_role'
      AND privilege_type = 'SELECT'
  ),
  1::bigint,
  'the dispatcher can read notification preferences'
);

SELECT throws_ok(
  $$INSERT INTO public.notification_preferences (user_id, muted_categories)
    VALUES ('e1000000-0000-4000-8000-000000000001', ARRAY['payment_requested'])$$,
  '23514',
  NULL,
  'protected payment categories cannot be muted'
);

SELECT throws_ok(
  $$INSERT INTO public.notification_preferences (user_id, muted_categories)
    VALUES ('e1000000-0000-4000-8000-000000000001', ARRAY['contract_ready'])$$,
  '23514',
  NULL,
  'protected contract categories cannot be muted'
);

SELECT lives_ok(
  $$INSERT INTO public.notification_preferences (user_id, muted_categories)
    VALUES ('e1000000-0000-4000-8000-000000000001', ARRAY['meeting_slots_opened'])$$,
  'a non-critical category may be muted'
);

SET LOCAL ROLE authenticated;
SELECT set_config(
  'request.jwt.claims',
  '{"sub":"e1000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);

INSERT INTO public.push_subscriptions (
  user_id, endpoint, p256dh, auth, user_agent
) VALUES (
  'e1000000-0000-4000-8000-000000000001',
  'https://push.example.test/device-a',
  repeat('p', 64),
  repeat('a', 24),
  'Test browser'
);

SELECT is(
  (SELECT count(*) FROM public.push_subscriptions),
  1::bigint,
  'a user sees their own subscription'
);

SELECT set_config(
  'request.jwt.claims',
  '{"sub":"e1000000-0000-4000-8000-000000000002","role":"authenticated"}',
  true
);

SELECT is(
  (SELECT count(*) FROM public.push_subscriptions),
  0::bigint,
  'another user cannot see the subscription'
);

RESET ROLE;

SELECT private.notify_project_members(
  'e4000000-0000-4000-8000-000000000001',
  'test_push_event',
  'עדכון חדש לבדיקה',
  'נוצר עדכון בדיקה במערכת.',
  '/portal/notifications',
  NULL
);

SELECT ok(
  EXISTS (
    SELECT 1
    FROM private.push_outbox outbox
    JOIN public.notifications notification
      ON notification.id = outbox.notification_id
    WHERE notification.kind = 'test_push_event'
  ),
  'business notification and push work are committed together'
);

SELECT function_privs_are(
  'public',
  'claim_push_batch',
  ARRAY['integer'],
  'service_role',
  ARRAY['EXECUTE'],
  'only service_role can claim push work'
);

SELECT * FROM finish();
ROLLBACK;
