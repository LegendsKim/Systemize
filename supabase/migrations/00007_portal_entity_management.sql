-- ============================================================================
-- 00007_portal_entity_management.sql
--
-- Owner-only editing of project identity and company contacts. Contact Gmail
-- changes revoke pending invitations so no stale link remains valid.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_project_details(
  p_project_id UUID,
  p_company_name TEXT,
  p_project_name TEXT,
  p_idempotency_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_project public.projects;
  v_existing_event public.project_events;
BEGIN
  IF auth.uid() IS NULL OR NOT private.is_systemize_owner() THEN
    RAISE EXCEPTION 'systemize_owner_required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_existing_event
  FROM public.project_events event
  WHERE event.idempotency_key = 'project-details-updated:' || p_idempotency_key;

  IF v_existing_event.id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'project_id', v_existing_event.project_id,
      'replayed', true
    );
  END IF;

  IF p_project_id IS NULL
    OR char_length(btrim(p_company_name)) NOT BETWEEN 2 AND 160
    OR char_length(btrim(p_project_name)) NOT BETWEEN 2 AND 160
    OR char_length(p_idempotency_key) NOT BETWEEN 8 AND 128 THEN
    RAISE EXCEPTION 'invalid_project_input' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_project
  FROM public.projects project
  WHERE project.id = p_project_id
  FOR UPDATE;

  IF v_project.id IS NULL THEN
    RAISE EXCEPTION 'project_not_found' USING ERRCODE = 'P0002';
  END IF;

  UPDATE public.companies
  SET name = btrim(p_company_name)
  WHERE id = v_project.company_id;

  UPDATE public.projects
  SET name = btrim(p_project_name)
  WHERE id = v_project.id;

  INSERT INTO public.project_events (
    project_id,
    event_type,
    actor_user_id,
    idempotency_key,
    payload
  ) VALUES (
    v_project.id,
    'project_details_updated',
    auth.uid(),
    'project-details-updated:' || p_idempotency_key,
    '{}'::jsonb
  );

  RETURN jsonb_build_object(
    'project_id', v_project.id,
    'replayed', false
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.update_company_person(
  p_project_id UUID,
  p_person_id UUID,
  p_full_name TEXT,
  p_email TEXT,
  p_phone TEXT,
  p_idempotency_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_project public.projects;
  v_person public.company_people;
  v_existing_event public.project_events;
  v_email TEXT := lower(btrim(p_email));
  v_email_changed BOOLEAN;
  v_revoked_count INTEGER := 0;
BEGIN
  IF auth.uid() IS NULL OR NOT private.is_systemize_owner() THEN
    RAISE EXCEPTION 'systemize_owner_required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_existing_event
  FROM public.project_events event
  WHERE event.idempotency_key = 'contact-updated:' || p_idempotency_key;

  IF v_existing_event.id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'project_id', v_existing_event.project_id,
      'person_id', v_existing_event.payload->>'person_id',
      'email_changed', (v_existing_event.payload->>'email_changed')::boolean,
      'replayed', true
    );
  END IF;

  IF p_project_id IS NULL
    OR p_person_id IS NULL
    OR char_length(btrim(p_full_name)) NOT BETWEEN 2 AND 120
    OR v_email !~ '^[^@[:space:]]+@gmail\.com$'
    OR char_length(v_email) NOT BETWEEN 11 AND 320
    OR char_length(btrim(p_phone)) NOT BETWEEN 8 AND 32
    OR char_length(p_idempotency_key) NOT BETWEEN 8 AND 128 THEN
    RAISE EXCEPTION 'invalid_contact_input' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_project
  FROM public.projects project
  WHERE project.id = p_project_id;

  IF v_project.id IS NULL THEN
    RAISE EXCEPTION 'project_not_found' USING ERRCODE = 'P0002';
  END IF;

  SELECT * INTO v_person
  FROM public.company_people person
  WHERE person.id = p_person_id
    AND person.company_id = v_project.company_id
  FOR UPDATE;

  IF v_person.id IS NULL THEN
    RAISE EXCEPTION 'contact_not_found' USING ERRCODE = 'P0002';
  END IF;

  v_email_changed := v_person.email <> v_email;

  IF v_email_changed AND v_person.user_id IS NOT NULL THEN
    RAISE EXCEPTION 'activated_contact_email_immutable'
      USING ERRCODE = '22023';
  END IF;

  UPDATE public.company_people
  SET
    full_name = btrim(p_full_name),
    email = v_email,
    phone = btrim(p_phone)
  WHERE id = v_person.id;

  IF v_email_changed THEN
    UPDATE public.project_invitations
    SET
      status = 'revoked',
      revoked_at = now()
    WHERE person_id = v_person.id
      AND status = 'pending';
    GET DIAGNOSTICS v_revoked_count = ROW_COUNT;
  END IF;

  INSERT INTO public.project_events (
    project_id,
    event_type,
    actor_user_id,
    idempotency_key,
    payload
  ) VALUES (
    v_project.id,
    'contact_updated',
    auth.uid(),
    'contact-updated:' || p_idempotency_key,
    jsonb_build_object(
      'person_id', v_person.id,
      'email_changed', v_email_changed,
      'revoked_invitation_count', v_revoked_count
    )
  );

  RETURN jsonb_build_object(
    'project_id', v_project.id,
    'person_id', v_person.id,
    'email_changed', v_email_changed,
    'replayed', false
  );
END;
$$;

REVOKE ALL ON FUNCTION public.update_project_details(
  UUID,
  TEXT,
  TEXT,
  TEXT
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_project_details(
  UUID,
  TEXT,
  TEXT,
  TEXT
) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.update_company_person(
  UUID,
  UUID,
  TEXT,
  TEXT,
  TEXT,
  TEXT
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_company_person(
  UUID,
  UUID,
  TEXT,
  TEXT,
  TEXT,
  TEXT
) TO authenticated, service_role;

COMMENT ON FUNCTION public.update_project_details(UUID, TEXT, TEXT, TEXT) IS
  'Owner-only, idempotent update of company and project display names.';
COMMENT ON FUNCTION public.update_company_person(
  UUID,
  UUID,
  TEXT,
  TEXT,
  TEXT,
  TEXT
) IS
  'Owner-only, idempotent contact update; Gmail changes revoke pending invitations.';
