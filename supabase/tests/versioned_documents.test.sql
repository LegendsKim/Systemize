-- Versioned project document, publication, immutability, and cross-project RLS contract.

BEGIN;
SET LOCAL search_path = public, extensions;
SELECT plan(19);

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'e1000000-0000-4000-8000-000000000002', true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);

SELECT is(
  (SELECT count(*) FROM public.project_documents),
  0::bigint,
  'a client sees no document before publication'
);

SELECT throws_ok(
  $$
    SELECT public.create_document_draft(
      'e8000000-0000-4000-8000-000000000001',
      'e8100000-0000-4000-8000-000000000001',
      'e4000000-0000-4000-8000-000000000001',
      'introductory_summary',
      '{"schemaVersion":1,"title":"Forbidden"}'::jsonb,
      'e8200000-0000-4000-8000-000000000001'
    )
  $$,
  '42501',
  'systemize_owner_required',
  'a client cannot create a document draft'
);

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'e1000000-0000-4000-8000-000000000001', true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);

CREATE TEMP TABLE first_draft_result AS
SELECT public.create_document_draft(
  'e8000000-0000-4000-8000-000000000001',
  'e8100000-0000-4000-8000-000000000001',
  'e4000000-0000-4000-8000-000000000001',
  'introductory_summary',
  '{"schemaVersion":1,"title":"Initial summary","currentSituation":"First immutable snapshot"}'::jsonb,
  'e8200000-0000-4000-8000-000000000001'
) AS result;

SELECT is(
  (SELECT result ->> 'status' FROM first_draft_result),
  'draft',
  'the owner creates a draft'
);
SELECT is(
  (SELECT (result ->> 'version_number')::integer FROM first_draft_result),
  1,
  'the first draft receives version one'
);
SELECT is(
  (SELECT char_length(result ->> 'content_hash') FROM first_draft_result),
  64,
  'the draft receives a SHA-256 content hash'
);
SELECT is(
  (
    SELECT count(*)
    FROM public.document_versions
    WHERE document_id = 'e8000000-0000-4000-8000-000000000001'
  ),
  1::bigint,
  'the owner can read the draft'
);

SELECT lives_ok(
  $$
    SELECT public.create_document_draft(
      'e8000000-0000-4000-8000-000000000001',
      'e8100000-0000-4000-8000-000000000001',
      'e4000000-0000-4000-8000-000000000001',
      'introductory_summary',
      '{"schemaVersion":1,"title":"Ignored replay"}'::jsonb,
      'e8200000-0000-4000-8000-000000000001'
    )
  $$,
  'replaying a draft mutation succeeds'
);
SELECT is(
  (
    SELECT count(*)
    FROM public.document_versions
    WHERE document_id = 'e8000000-0000-4000-8000-000000000001'
  ),
  1::bigint,
  'replaying the same mutation creates no duplicate version'
);

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'e1000000-0000-4000-8000-000000000002', true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SELECT is(
  (SELECT count(*) FROM public.document_versions),
  0::bigint,
  'a project member cannot read an owner draft'
);

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'e1000000-0000-4000-8000-000000000001', true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SELECT is(
  (
    SELECT public.publish_document_version(
      'e4000000-0000-4000-8000-000000000001',
      'e8100000-0000-4000-8000-000000000001',
      'e8200000-0000-4000-8000-000000000002'
    ) ->> 'status'
  ),
  'published',
  'the owner publishes the selected immutable version'
);
SELECT is(
  (
    SELECT stage::text
    FROM public.projects
    WHERE id = 'e4000000-0000-4000-8000-000000000001'
  ),
  'discovery_offer_awaiting_client',
  'publishing the introductory summary advances the project stage'
);

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'e1000000-0000-4000-8000-000000000002', true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SELECT is(
  (SELECT count(*) FROM public.project_documents),
  1::bigint,
  'the project member sees the document after publication'
);
SELECT is(
  (SELECT count(*) FROM public.document_versions),
  1::bigint,
  'the project member sees the published version'
);
SELECT is(
  (
    SELECT content ->> 'currentSituation'
    FROM public.document_versions
    WHERE id = 'e8100000-0000-4000-8000-000000000001'
  ),
  'First immutable snapshot',
  'the client reads the exact published content snapshot'
);

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'e1000000-0000-4000-8000-000000000003', true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SELECT is(
  (SELECT count(*) FROM public.project_documents),
  0::bigint,
  'a member of another project cannot read the published document'
);

RESET ROLE;
SELECT throws_ok(
  $$
    UPDATE public.document_versions
    SET content = '{"schemaVersion":1,"title":"Tampered"}'::jsonb
    WHERE id = 'e8100000-0000-4000-8000-000000000001'
  $$,
  '55000',
  'published_document_version_immutable',
  'even a direct privileged update cannot alter published content'
);

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'e1000000-0000-4000-8000-000000000001', true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SELECT lives_ok(
  $$
    SELECT public.create_document_draft(
      'e8000000-0000-4000-8000-000000000009',
      'e8100000-0000-4000-8000-000000000002',
      'e4000000-0000-4000-8000-000000000001',
      'introductory_summary',
      '{"schemaVersion":1,"title":"Initial summary","currentSituation":"Second snapshot"}'::jsonb,
      'e8200000-0000-4000-8000-000000000003'
    )
  $$,
  'creating a new draft version succeeds'
);
SELECT is(
  (
    SELECT version_number
    FROM public.document_versions
    WHERE id = 'e8100000-0000-4000-8000-000000000002'
  ),
  2,
  'new content creates a second version under the existing document'
);
SELECT is(
  (
    SELECT content ->> 'currentSituation'
    FROM public.document_versions
    WHERE id = 'e8100000-0000-4000-8000-000000000001'
  ),
  'First immutable snapshot',
  'creating a new version leaves the published snapshot unchanged'
);

RESET ROLE;
SELECT * FROM finish();
ROLLBACK;
