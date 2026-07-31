-- ============================================================================
-- 00008_versioned_documents.sql
--
-- Versioned project documents. Draft creation and publication are owner-only,
-- published snapshots are immutable, and clients can read only published versions
-- belonging to projects where they hold an active membership.
-- ============================================================================

CREATE TYPE public.project_document_kind AS ENUM (
  'introductory_summary',
  'contract',
  'discovery_plan'
);

CREATE TYPE public.document_version_status AS ENUM (
  'draft',
  'published'
);

CREATE TABLE public.project_documents (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE RESTRICT,
  kind public.project_document_kind NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT project_documents_project_kind_key UNIQUE (project_id, kind)
);

CREATE TABLE public.document_versions (
  id UUID PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.project_documents(id) ON DELETE RESTRICT,
  version_number INTEGER NOT NULL
    CONSTRAINT document_versions_number_positive CHECK (version_number > 0),
  status public.document_version_status NOT NULL DEFAULT 'draft',
  content JSONB NOT NULL
    CONSTRAINT document_versions_content_object CHECK (jsonb_typeof(content) = 'object')
    CONSTRAINT document_versions_content_size CHECK (octet_length(content::text) <= 100000)
    CONSTRAINT document_versions_schema_v1 CHECK (content ->> 'schemaVersion' = '1'),
  content_hash TEXT NOT NULL
    CONSTRAINT document_versions_hash_sha256 CHECK (content_hash ~ '^[0-9a-f]{64}$'),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_by UUID REFERENCES auth.users(id) ON DELETE RESTRICT,
  published_at TIMESTAMPTZ,
  CONSTRAINT document_versions_publish_consistency CHECK (
    (status = 'draft' AND published_by IS NULL AND published_at IS NULL)
    OR (status = 'published' AND published_by IS NOT NULL AND published_at IS NOT NULL)
  ),
  CONSTRAINT document_versions_document_number_key UNIQUE (document_id, version_number)
);

CREATE INDEX document_versions_document_status_idx
  ON public.document_versions(document_id, status, version_number DESC);

CREATE OR REPLACE FUNCTION private.protect_published_document_version()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF OLD.status = 'published' THEN
    RAISE EXCEPTION 'published_document_version_immutable' USING ERRCODE = '55000';
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

REVOKE ALL ON FUNCTION private.protect_published_document_version()
  FROM PUBLIC, anon, authenticated;

CREATE TRIGGER document_versions_protect_published
BEFORE UPDATE OR DELETE ON public.document_versions
FOR EACH ROW EXECUTE FUNCTION private.protect_published_document_version();

CREATE OR REPLACE FUNCTION private.require_discovery_document_before_payment()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.kind = 'discovery'
    AND NOT EXISTS (
      SELECT 1
      FROM public.project_documents document
      JOIN public.document_versions version
        ON version.document_id = document.id
      WHERE document.project_id = NEW.project_id
        AND document.kind = 'introductory_summary'
        AND version.status = 'published'
    ) THEN
    RAISE EXCEPTION 'published_introductory_summary_required'
      USING ERRCODE = '55000';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.require_discovery_document_before_payment()
  FROM PUBLIC, anon, authenticated;

CREATE TRIGGER payment_requests_require_discovery_document
BEFORE INSERT ON public.payment_requests
FOR EACH ROW EXECUTE FUNCTION private.require_discovery_document_before_payment();

ALTER TABLE public.project_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE
  public.project_documents,
  public.document_versions
FROM PUBLIC, anon, authenticated;

GRANT SELECT ON TABLE
  public.project_documents,
  public.document_versions
TO authenticated;

CREATE OR REPLACE FUNCTION private.document_has_published_version(
  p_document_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.document_versions version
    WHERE version.document_id = p_document_id
      AND version.status = 'published'
  );
$$;

CREATE OR REPLACE FUNCTION private.document_project_id(
  p_document_id UUID
)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT document.project_id
  FROM public.project_documents document
  WHERE document.id = p_document_id;
$$;

REVOKE ALL ON FUNCTION private.document_has_published_version(UUID)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.document_project_id(UUID)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.document_has_published_version(UUID)
  TO authenticated;
GRANT EXECUTE ON FUNCTION private.document_project_id(UUID)
  TO authenticated;

CREATE POLICY project_documents_authorized_read
ON public.project_documents
FOR SELECT
TO authenticated
USING (
  private.is_systemize_owner()
  OR (
    private.is_active_project_member(project_id)
    AND private.document_has_published_version(id)
  )
);

CREATE POLICY document_versions_authorized_read
ON public.document_versions
FOR SELECT
TO authenticated
USING (
  private.is_systemize_owner()
  OR (
    status = 'published'
    AND private.is_active_project_member(
      private.document_project_id(document_id)
    )
  )
);

CREATE OR REPLACE FUNCTION public.create_document_draft(
  p_document_id UUID,
  p_version_id UUID,
  p_project_id UUID,
  p_kind public.project_document_kind,
  p_content JSONB,
  p_idempotency_key UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_existing private.workflow_mutations;
  v_document public.project_documents;
  v_version_number INTEGER;
  v_content_hash TEXT;
  v_result JSONB;
BEGIN
  IF auth.uid() IS NULL OR NOT private.is_systemize_owner() THEN
    RAISE EXCEPTION 'systemize_owner_required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_existing
  FROM private.workflow_mutations mutation
  WHERE mutation.idempotency_key = p_idempotency_key;

  IF v_existing.idempotency_key IS NOT NULL THEN
    RETURN v_existing.result;
  END IF;

  IF p_content IS NULL
    OR jsonb_typeof(p_content) <> 'object'
    OR p_content ->> 'schemaVersion' <> '1'
    OR octet_length(p_content::text) > 100000 THEN
    RAISE EXCEPTION 'invalid_document_content' USING ERRCODE = '22023';
  END IF;

  PERFORM 1 FROM public.projects project WHERE project.id = p_project_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'project_not_found' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO public.project_documents (
    id,
    project_id,
    kind,
    created_by
  ) VALUES (
    p_document_id,
    p_project_id,
    p_kind,
    auth.uid()
  )
  ON CONFLICT (project_id, kind) DO NOTHING;

  SELECT * INTO v_document
  FROM public.project_documents document
  WHERE document.project_id = p_project_id
    AND document.kind = p_kind
  FOR UPDATE;

  SELECT COALESCE(max(version.version_number), 0) + 1
  INTO v_version_number
  FROM public.document_versions version
  WHERE version.document_id = v_document.id;

  v_content_hash := encode(
    extensions.digest(convert_to(p_content::text, 'UTF8'), 'sha256'),
    'hex'
  );

  INSERT INTO public.document_versions (
    id,
    document_id,
    version_number,
    content,
    content_hash,
    created_by
  ) VALUES (
    p_version_id,
    v_document.id,
    v_version_number,
    p_content,
    v_content_hash,
    auth.uid()
  );

  INSERT INTO public.project_events (
    project_id,
    event_type,
    actor_user_id,
    idempotency_key,
    payload
  ) VALUES (
    p_project_id,
    'document_draft_created',
    auth.uid(),
    'document-draft-created:' || p_idempotency_key::text,
    jsonb_build_object(
      'document_id', v_document.id,
      'version_id', p_version_id,
      'kind', p_kind,
      'version_number', v_version_number,
      'content_hash', v_content_hash
    )
  );

  v_result := jsonb_build_object(
    'document_id', v_document.id,
    'version_id', p_version_id,
    'version_number', v_version_number,
    'content_hash', v_content_hash,
    'status', 'draft',
    'replayed', false
  );

  INSERT INTO private.workflow_mutations (
    idempotency_key,
    actor_user_id,
    project_id,
    action,
    result
  ) VALUES (
    p_idempotency_key,
    auth.uid(),
    p_project_id,
    'create_document_draft',
    v_result
  );

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.publish_document_version(
  p_project_id UUID,
  p_version_id UUID,
  p_idempotency_key UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_existing private.workflow_mutations;
  v_version public.document_versions;
  v_document public.project_documents;
  v_result JSONB;
BEGIN
  IF auth.uid() IS NULL OR NOT private.is_systemize_owner() THEN
    RAISE EXCEPTION 'systemize_owner_required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_existing
  FROM private.workflow_mutations mutation
  WHERE mutation.idempotency_key = p_idempotency_key;

  IF v_existing.idempotency_key IS NOT NULL THEN
    RETURN v_existing.result;
  END IF;

  SELECT * INTO v_version
  FROM public.document_versions version
  WHERE version.id = p_version_id
  FOR UPDATE;

  IF v_version.id IS NULL THEN
    RAISE EXCEPTION 'document_version_not_found' USING ERRCODE = 'P0002';
  END IF;

  SELECT * INTO v_document
  FROM public.project_documents document
  WHERE document.id = v_version.document_id
    AND document.project_id = p_project_id;

  IF v_document.id IS NULL THEN
    RAISE EXCEPTION 'document_project_mismatch' USING ERRCODE = '42501';
  END IF;

  IF v_version.status <> 'draft' THEN
    RAISE EXCEPTION 'document_version_already_published' USING ERRCODE = '55000';
  END IF;

  UPDATE public.document_versions
  SET
    status = 'published',
    published_by = auth.uid(),
    published_at = now()
  WHERE id = p_version_id;

  UPDATE public.projects
  SET stage = CASE
    WHEN v_document.kind = 'introductory_summary'
      THEN 'discovery_offer_awaiting_client'::public.project_stage
    ELSE stage
  END
  WHERE id = p_project_id;

  INSERT INTO public.project_events (
    project_id,
    event_type,
    actor_user_id,
    idempotency_key,
    payload
  ) VALUES (
    p_project_id,
    'document_published',
    auth.uid(),
    'document-published:' || p_idempotency_key::text,
    jsonb_build_object(
      'document_id', v_document.id,
      'version_id', v_version.id,
      'kind', v_document.kind,
      'version_number', v_version.version_number,
      'content_hash', v_version.content_hash
    )
  );

  PERFORM private.notify_project_members(
    p_project_id,
    'document_published',
    'מסמך חדש פורסם',
    'סיכום הפגישה וההצעה לשלב האפיון מחכים לך באזור האישי.',
    '/portal/documents',
    auth.uid()
  );

  v_result := jsonb_build_object(
    'document_id', v_document.id,
    'version_id', v_version.id,
    'version_number', v_version.version_number,
    'content_hash', v_version.content_hash,
    'status', 'published',
    'replayed', false
  );

  INSERT INTO private.workflow_mutations (
    idempotency_key,
    actor_user_id,
    project_id,
    action,
    result
  ) VALUES (
    p_idempotency_key,
    auth.uid(),
    p_project_id,
    'publish_document_version',
    v_result
  );

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.create_document_draft(
  UUID,
  UUID,
  UUID,
  public.project_document_kind,
  JSONB,
  UUID
) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.publish_document_version(UUID, UUID, UUID)
  FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.create_document_draft(
  UUID,
  UUID,
  UUID,
  public.project_document_kind,
  JSONB,
  UUID
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.publish_document_version(UUID, UUID, UUID)
  TO authenticated;
