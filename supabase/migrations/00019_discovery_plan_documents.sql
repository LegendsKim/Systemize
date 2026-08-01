-- Full discovery plan lifecycle. Drafting and publication reuse the immutable
-- document infrastructure while advancing the project beyond the paid discovery gate.

CREATE OR REPLACE FUNCTION private.advance_discovery_plan_on_draft()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_project_id UUID;
BEGIN
  SELECT document.project_id INTO v_project_id
  FROM public.project_documents document
  WHERE document.id = NEW.document_id
    AND document.kind = 'discovery_plan';

  IF v_project_id IS NOT NULL THEN
    UPDATE public.projects
    SET stage = 'solution_options_preparation'
    WHERE id = v_project_id
      AND stage = 'full_discovery_and_planning';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.advance_discovery_plan_on_draft()
  FROM PUBLIC, anon, authenticated;

CREATE TRIGGER document_versions_advance_discovery_plan_draft
AFTER INSERT ON public.document_versions
FOR EACH ROW EXECUTE FUNCTION private.advance_discovery_plan_on_draft();

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
  v_notification_title TEXT;
  v_notification_body TEXT;
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
    WHEN v_document.kind = 'discovery_plan'
      THEN 'proposal_and_contract_awaiting_client'::public.project_stage
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

  IF v_document.kind = 'discovery_plan' THEN
    v_notification_title := 'תוכנית המערכת והצעת הפיתוח מוכנות';
    v_notification_body := 'המסמך המלא, חלופות הפיתוח, השלבים והעלויות מחכים לך באזור המסמכים.';
  ELSE
    v_notification_title := 'מסמך חדש פורסם';
    v_notification_body := 'סיכום הפגישה וההצעה לשלב האפיון מחכים לך באזור האישי.';
  END IF;

  PERFORM private.notify_project_members(
    p_project_id,
    'document_published',
    v_notification_title,
    v_notification_body,
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

REVOKE ALL ON FUNCTION public.publish_document_version(UUID, UUID, UUID)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.publish_document_version(UUID, UUID, UUID)
  TO authenticated;

COMMENT ON FUNCTION private.advance_discovery_plan_on_draft() IS
  'Advances a paid discovery project when its first full system-plan draft is created.';
