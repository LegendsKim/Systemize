BEGIN;
SET LOCAL search_path = public, extensions;
SELECT no_plan();

SELECT has_table('public', 'meeting_integrations', 'safe meeting integration state exists');
SELECT has_table('private', 'meeting_integration_outbox', 'durable meeting outbox exists');
SELECT has_table('private', 'google_calendar_connections', 'calendar credential store exists');

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.meeting_integrations'::regclass),
  'meeting integrations have RLS'
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
  'browser roles cannot read provider work or OAuth credentials'
);

INSERT INTO public.meeting_slots (
  id, project_id, starts_at, ends_at, status, created_by
) VALUES (
  'e7000000-0000-4000-8000-000000000015',
  'e4000000-0000-4000-8000-000000000001',
  now() + interval '2 days',
  now() + interval '2 days 1 hour',
  'available',
  'e1000000-0000-4000-8000-000000000001'
);

UPDATE public.meeting_slots
SET
  status = 'booked',
  booked_by = 'e1000000-0000-4000-8000-000000000002',
  booked_at = now()
WHERE id = 'e7000000-0000-4000-8000-000000000015';

SELECT ok(
  EXISTS (
    SELECT 1 FROM public.meeting_integrations
    WHERE meeting_slot_id = 'e7000000-0000-4000-8000-000000000015'
      AND status = 'pending'
  ),
  'booking atomically creates client-visible integration state'
);

SELECT ok(
  EXISTS (
    SELECT 1 FROM private.meeting_integration_outbox
    WHERE meeting_slot_id = 'e7000000-0000-4000-8000-000000000015'
  ),
  'booking atomically creates durable provider work'
);

SET LOCAL ROLE authenticated;
SELECT set_config(
  'request.jwt.claims',
  '{"sub":"e1000000-0000-4000-8000-000000000002","role":"authenticated"}',
  true
);
SELECT is(
  (SELECT count(*) FROM public.meeting_integrations),
  1::bigint,
  'the booked client can read safe conference state for their project'
);

SELECT set_config(
  'request.jwt.claims',
  '{"sub":"e1000000-0000-4000-8000-000000000003","role":"authenticated"}',
  true
);
SELECT is(
  (SELECT count(*) FROM public.meeting_integrations),
  0::bigint,
  'a client from another project cannot read conference state'
);
RESET ROLE;

SET LOCAL ROLE service_role;
SELECT set_config(
  'request.jwt.claims',
  '{"sub":"e1000000-0000-4000-8000-000000000001","role":"service_role"}',
  true
);

SELECT lives_ok(
  $$SELECT public.store_google_calendar_connection(
    repeat('r', 80),
    'e1000000-0000-4000-8000-000000000001',
    'e2e.owner@gmail.com',
    ARRAY['openid', 'email', 'https://www.googleapis.com/auth/calendar.events.owned']
  )$$,
  'service role can store the owner calendar connection'
);

SELECT is(
  (SELECT connected_email FROM public.get_google_calendar_connection()),
  'e2e.owner@gmail.com',
  'the dispatcher can retrieve the connected calendar without browser exposure'
);

SELECT is(
  (
    SELECT count(*)
    FROM public.claim_meeting_integration_batch(5)
    WHERE meeting_slot_id = 'e7000000-0000-4000-8000-000000000015'
  ),
  1::bigint,
  'service role can claim the due meeting job once'
);

SELECT is(
  public.requeue_meeting_integrations(),
  1,
  'an explicit owner retry requeues the existing booked meeting'
);

SELECT ok(
  EXISTS (
    SELECT 1
    FROM public.meeting_integrations
    WHERE meeting_slot_id = 'e7000000-0000-4000-8000-000000000015'
      AND status = 'pending'
  ),
  'manual retry returns unfinished integration state to pending'
);

SELECT throws_ok(
  $$SELECT public.record_meeting_zoom(
    'e7000000-0000-4000-8000-000000000015',
    '123456789',
    'https://example.test/not-zoom'
  )$$,
  '22023',
  NULL,
  'an untrusted conference URL is rejected'
);
RESET ROLE;

SELECT function_privs_are(
  'public',
  'claim_meeting_integration_batch',
  ARRAY['integer'],
  'service_role',
  ARRAY['EXECUTE'],
  'only service_role can claim meeting integration work'
);

SELECT function_privs_are(
  'public',
  'get_google_calendar_connection',
  ARRAY[]::text[],
  'service_role',
  ARRAY['EXECUTE'],
  'only service_role can read the calendar credential'
);

SELECT function_privs_are(
  'public',
  'requeue_meeting_integrations',
  ARRAY[]::text[],
  'service_role',
  ARRAY['EXECUTE'],
  'only service_role can manually requeue meeting integration work'
);

SELECT * FROM finish();
ROLLBACK;
