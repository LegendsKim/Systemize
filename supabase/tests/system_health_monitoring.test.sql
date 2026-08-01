BEGIN;
SET LOCAL search_path = public, extensions;
SELECT plan(13);

SELECT has_table('public', 'system_health_checks', 'system health state exists');
SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.system_health_checks'::regclass),
  'system health state has RLS'
);
SELECT function_privs_are(
  'public',
  'record_system_health_snapshot',
  ARRAY['jsonb'],
  'service_role',
  ARRAY['EXECUTE'],
  'only service role can record health snapshots'
);

SET LOCAL ROLE authenticated;
SELECT set_config(
  'request.jwt.claims',
  '{"sub":"e1000000-0000-4000-8000-000000000002","role":"authenticated"}',
  true
);
SELECT throws_ok(
  $$SELECT public.record_system_health_snapshot('[{"component":"zoom","status":"healthy","error_code":null}]'::jsonb)$$,
  '42501',
  NULL,
  'browser roles cannot invoke the recorder'
);
RESET ROLE;

SET LOCAL ROLE service_role;
SELECT throws_ok(
  $$SELECT public.record_system_health_snapshot('[
    {"component":"database","status":"healthy","error_code":null},
    {"component":"zoom","status":"healthy","error_code":null},
    {"component":"google_calendar","status":"healthy","error_code":null},
    {"component":"push_notifications","status":"healthy","error_code":null},
    {"component":"database","status":"healthy","error_code":null}
  ]'::jsonb)$$,
  '22023',
  NULL,
  'a complete snapshot cannot repeat one component and omit another'
);
RESET ROLE;

SET LOCAL ROLE service_role;
SELECT lives_ok(
  $$SELECT public.record_system_health_snapshot('[
    {"component":"database","status":"healthy","error_code":null},
    {"component":"zoom","status":"unhealthy","error_code":"zoom_token_invalid_client"},
    {"component":"google_calendar","status":"healthy","error_code":null},
    {"component":"push_notifications","status":"healthy","error_code":null},
    {"component":"meeting_automation","status":"healthy","error_code":null}
  ]'::jsonb)$$,
  'service role records a complete bounded snapshot'
);
RESET ROLE;

SELECT is(
  (SELECT status FROM public.system_health_checks WHERE component = 'zoom'),
  'unhealthy',
  'failed component is persisted'
);
SELECT is(
  (SELECT count(*) FROM public.notifications WHERE kind = 'system_health_failed'),
  1::bigint,
  'first failure creates one owner notification'
);
SELECT is(
  (
    SELECT count(*)
    FROM private.push_outbox outbox
    JOIN public.notifications notification ON notification.id = outbox.notification_id
    WHERE notification.kind = 'system_health_failed'
  ),
  1::bigint,
  'failure notification and Push work are committed together'
);

SET LOCAL ROLE service_role;
SELECT public.record_system_health_snapshot('[
  {"component":"database","status":"healthy","error_code":null},
  {"component":"zoom","status":"unhealthy","error_code":"zoom_token_invalid_client"},
  {"component":"google_calendar","status":"healthy","error_code":null},
  {"component":"push_notifications","status":"healthy","error_code":null},
  {"component":"meeting_automation","status":"healthy","error_code":null}
]'::jsonb);
RESET ROLE;

SELECT is(
  (SELECT count(*) FROM public.notifications WHERE kind = 'system_health_failed'),
  1::bigint,
  'repeated unhealthy checks do not alert again'
);

SET LOCAL ROLE service_role;
SELECT public.record_system_health_snapshot('[
  {"component":"database","status":"healthy","error_code":null},
  {"component":"zoom","status":"healthy","error_code":null},
  {"component":"google_calendar","status":"healthy","error_code":null},
  {"component":"push_notifications","status":"healthy","error_code":null},
  {"component":"meeting_automation","status":"healthy","error_code":null}
]'::jsonb);
RESET ROLE;

SELECT is(
  (SELECT count(*) FROM public.notifications WHERE kind = 'system_health_recovered'),
  1::bigint,
  'recovery creates one owner notification'
);

SELECT throws_ok(
  $$INSERT INTO public.notification_preferences (user_id, muted_categories)
    VALUES ('e1000000-0000-4000-8000-000000000001', ARRAY['system_health_failed'])$$,
  '23514',
  NULL,
  'system health alerts cannot be muted'
);

SET LOCAL ROLE authenticated;
SELECT set_config(
  'request.jwt.claims',
  '{"sub":"e1000000-0000-4000-8000-000000000002","role":"authenticated"}',
  true
);
SELECT is(
  (SELECT count(*) FROM public.system_health_checks),
  0::bigint,
  'clients cannot read infrastructure health'
);
RESET ROLE;

SELECT * FROM finish();
ROLLBACK;
