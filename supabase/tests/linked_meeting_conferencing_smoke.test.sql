-- Read-only structural smoke that is safe against the linked production database.
BEGIN;
SET LOCAL search_path = public, extensions;
SELECT plan(8);

SELECT has_table('public', 'meeting_integrations', 'meeting integration state exists');
SELECT has_table('private', 'meeting_integration_outbox', 'meeting outbox exists');
SELECT has_table('private', 'google_calendar_connections', 'calendar credential store exists');

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.meeting_integrations'::regclass),
  'client-visible integration state has RLS'
);

SELECT is(
  (
    SELECT count(*)
    FROM information_schema.role_table_grants
    WHERE table_schema = 'private'
      AND table_name IN ('meeting_integration_outbox', 'google_calendar_connections')
      AND grantee IN ('anon', 'authenticated')
  ),
  0::bigint,
  'browser roles have no grants on private provider state'
);

SELECT has_function(
  'public',
  'claim_meeting_integration_batch',
  ARRAY['integer'],
  'dispatcher claim function exists'
);
SELECT has_function(
  'public',
  'store_google_calendar_connection',
  ARRAY['text', 'uuid', 'text', 'text[]'],
  'server-only calendar connection function exists'
);
SELECT has_function(
  'public',
  'get_google_calendar_connection',
  ARRAY[]::text[],
  'server-only calendar credential function exists'
);

SELECT * FROM finish();
ROLLBACK;
