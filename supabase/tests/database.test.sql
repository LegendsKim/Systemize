BEGIN;
SELECT plan(8);

SELECT has_table('public', 'contact_requests', 'contact_requests exists');
SELECT has_table('public', 'rate_limit_buckets', 'rate_limit_buckets exists');

SELECT ok(
  (SELECT relrowsecurity FROM pg_class
   WHERE oid = 'public.contact_requests'::regclass),
  'contact_requests has RLS enabled'
);

SELECT ok(
  (SELECT relrowsecurity FROM pg_class
   WHERE oid = 'public.rate_limit_buckets'::regclass),
  'rate_limit_buckets has RLS enabled'
);

SELECT is(
  (SELECT count(*) FROM pg_policies
   WHERE schemaname = 'public' AND tablename = 'contact_requests'),
  2::bigint,
  'contact_requests exposes exactly two owner policies'
);

SET LOCAL ROLE anon;
SELECT throws_ok(
  $$INSERT INTO public.contact_requests
    (name, email, message, idempotency_key)
    VALUES ('Anonymous', 'anonymous@example.test', 'Denied', 'anon-key')$$,
  '42501',
  'permission denied for table contact_requests',
  'anonymous inserts are denied'
);
RESET ROLE;

SET LOCAL ROLE authenticated;
SELECT set_config(
  'request.jwt.claim.sub',
  '11111111-1111-4111-8111-111111111111',
  true
);
SELECT lives_ok(
  $$INSERT INTO public.contact_requests
    (name, email, message, idempotency_key, user_id)
    VALUES (
      'Owner',
      'owner@example.test',
      'Allowed',
      'owner-key',
      auth.uid()
    )$$,
  'authenticated owners can insert their own request'
);
SELECT is(
  (SELECT count(*) FROM public.contact_requests),
  1::bigint,
  'authenticated owners can read only their own request'
);
RESET ROLE;

SELECT * FROM finish();
ROLLBACK;
