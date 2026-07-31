-- Structural security tests for the confidential guest workflow.
-- Transactional behavior is exercised through application integration tests.

BEGIN;
SET LOCAL search_path = public, extensions;
SELECT no_plan();

SELECT has_table('public', 'client_intakes', 'client intake documents exist');
SELECT has_table('public', 'meeting_slots', 'meeting slots exist');
SELECT has_table('public', 'payment_requests', 'payment requests exist');
SELECT has_table('public', 'notifications', 'durable notifications exist');

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.client_intakes'::regclass),
  'client intake documents have RLS'
);
SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.meeting_slots'::regclass),
  'meeting slots have RLS'
);
SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.payment_requests'::regclass),
  'payment requests have RLS'
);
SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.notifications'::regclass),
  'notifications have RLS'
);

SELECT has_function(
  'public',
  'save_client_intake',
  ARRAY['uuid', 'jsonb', 'smallint', 'boolean', 'uuid', 'text'],
  'intake save and submission use one transactional RPC that carries the reply'
);
SELECT hasnt_function(
  'public',
  'save_client_intake',
  ARRAY['uuid', 'jsonb', 'smallint', 'boolean', 'uuid'],
  'the pre-reply signature is gone rather than left as an ambiguous overload'
);
SELECT has_function(
  'public',
  'autosave_client_intake',
  ARRAY['uuid', 'jsonb', 'smallint', 'text'],
  'background draft persistence has its own RPC'
);
SELECT has_function(
  'public',
  'review_client_intake',
  ARRAY['uuid', 'text', 'text', 'uuid'],
  'owner review uses one transactional RPC'
);
SELECT has_function(
  'public',
  'book_meeting_slot',
  ARRAY['uuid', 'uuid', 'uuid'],
  'meeting booking uses one transactional RPC'
);
SELECT has_function(
  'public',
  'create_payment_request',
  ARRAY['uuid', 'payment_request_kind', 'text', 'integer', 'text', 'uuid'],
  'payment request creation uses one transactional RPC'
);
SELECT has_function(
  'public',
  'mark_payment_received',
  ARRAY['uuid', 'uuid', 'uuid'],
  'authoritative payment receipt uses one transactional RPC'
);

SELECT is(
  (
    SELECT count(*)
    FROM information_schema.role_table_grants
    WHERE table_schema = 'public'
      AND table_name IN (
        'client_intakes',
        'meeting_slots',
        'payment_requests',
        'notifications'
      )
      AND grantee = 'anon'
  ),
  0::bigint,
  'anonymous users have no workflow table grants'
);

SELECT is(
  (
    SELECT count(*)
    FROM information_schema.role_table_grants
    WHERE table_schema = 'public'
      AND table_name IN (
        'client_intakes',
        'meeting_slots',
        'payment_requests'
      )
      AND grantee = 'authenticated'
      AND privilege_type IN ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE')
  ),
  0::bigint,
  'browser roles mutate confidential workflow data only through authorized RPCs'
);

SELECT * FROM finish();
ROLLBACK;
