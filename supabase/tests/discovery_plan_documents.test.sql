BEGIN;
SET LOCAL search_path = public, extensions;
SELECT plan(6);

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'e1000000-0000-4000-8000-000000000001', true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);

UPDATE public.projects
SET stage = 'full_discovery_and_planning'
WHERE id = 'e4000000-0000-4000-8000-000000000001';

SELECT is(
  public.create_document_draft(
    'e8000000-0000-4000-8000-000000000019',
    'e8100000-0000-4000-8000-000000000019',
    'e4000000-0000-4000-8000-000000000001',
    'discovery_plan',
    '{"schemaVersion":1,"title":"System plan"}'::jsonb,
    'e8200000-0000-4000-8000-000000000019'
  ) ->> 'status',
  'draft',
  'the owner creates a versioned discovery-plan draft'
);

SELECT is(
  (SELECT stage::text FROM public.projects WHERE id = 'e4000000-0000-4000-8000-000000000001'),
  'solution_options_preparation',
  'the first plan draft advances the project to solution preparation'
);

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'e1000000-0000-4000-8000-000000000002', true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SELECT is(
  (SELECT count(*) FROM public.project_documents WHERE kind = 'discovery_plan'),
  0::bigint,
  'a client cannot read the plan draft'
);

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'e1000000-0000-4000-8000-000000000001', true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SELECT is(
  public.publish_document_version(
    'e4000000-0000-4000-8000-000000000001',
    'e8100000-0000-4000-8000-000000000019',
    'e8200000-0000-4000-8000-000000000020'
  ) ->> 'status',
  'published',
  'the owner publishes the full plan'
);

SELECT is(
  (SELECT stage::text FROM public.projects WHERE id = 'e4000000-0000-4000-8000-000000000001'),
  'proposal_and_contract_awaiting_client',
  'publishing the plan advances the project to client decision'
);

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'e1000000-0000-4000-8000-000000000002', true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SELECT is(
  (SELECT count(*) FROM public.document_versions WHERE id = 'e8100000-0000-4000-8000-000000000019'),
  1::bigint,
  'the project member can read the published plan'
);

RESET ROLE;
SELECT * FROM finish();
ROLLBACK;
