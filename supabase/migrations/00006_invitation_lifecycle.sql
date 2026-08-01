-- ============================================================================
-- 00006_invitation_lifecycle.sql
--
-- Owner-controlled invitation revocation and reissue. Both mutations are
-- transactional, idempotent, and append an audit event before returning.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.revoke_project_invitation(
  p_invitation_id UUID,
  p_idempotency_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_invitation public.project_invitations;
  v_existing_event public.project_events;
BEGIN
  IF auth.uid() IS NULL OR NOT private.is_systemize_owner() THEN
    RAISE EXCEPTION 'systemize_owner_required' USING ERRCODE = '42501';
  END IF;

  IF p_invitation_id IS NULL
    OR char_length(p_idempotency_key) NOT BETWEEN 8 AND 128 THEN
    RAISE EXCEPTION 'invalid_invitation_input' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_existing_event
  FROM public.project_events event
  WHERE event.idempotency_key = 'invitation-revoked:' || p_idempotency_key;

  IF v_existing_event.id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'invitation_id', v_existing_event.payload->>'invitation_id',
      'project_id', v_existing_event.project_id,
      'replayed', true
    );
  END IF;

  SELECT * INTO v_invitation
  FROM public.project_invitations invitation
  WHERE invitation.id = p_invitation_id
  FOR UPDATE;

  IF v_invitation.id IS NULL THEN
    RAISE EXCEPTION 'invitation_not_found' USING ERRCODE = 'P0002';
  END IF;

  IF v_invitation.status = 'accepted' THEN
    RAISE EXCEPTION 'accepted_invitation_cannot_be_revoked'
      USING ERRCODE = '22023';
  END IF;

  IF v_invitation.status = 'revoked' THEN
    RETURN jsonb_build_object(
      'invitation_id', v_invitation.id,
      'project_id', v_invitation.project_id,
      'replayed', true
    );
  END IF;

  UPDATE public.project_invitations
  SET
    status = 'revoked',
    revoked_at = now()
  WHERE id = v_invitation.id;

  INSERT INTO public.project_events (
    project_id,
    event_type,
    actor_user_id,
    idempotency_key,
    payload
  ) VALUES (
    v_invitation.project_id,
    'invitation_revoked',
    auth.uid(),
    'invitation-revoked:' || p_idempotency_key,
    jsonb_build_object('invitation_id', v_invitation.id)
  );

  RETURN jsonb_build_object(
    'invitation_id', v_invitation.id,
    'project_id', v_invitation.project_id,
    'replayed', false
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.reissue_project_invitation(
  p_source_invitation_id UUID,
  p_invitation_id UUID,
  p_token_hash TEXT,
  p_idempotency_key TEXT,
  p_expires_at TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_source public.project_invitations;
  v_existing public.project_invitations;
  v_person public.company_people;
BEGIN
  IF auth.uid() IS NULL OR NOT private.is_systemize_owner() THEN
    RAISE EXCEPTION 'systemize_owner_required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_existing
  FROM public.project_invitations invitation
  WHERE invitation.idempotency_key = p_idempotency_key;

  IF v_existing.id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'invitation_id', v_existing.id,
      'project_id', v_existing.project_id,
      'expires_at', v_existing.expires_at,
      'replayed', true
    );
  END IF;

  IF p_source_invitation_id IS NULL
    OR p_invitation_id IS NULL
    OR p_token_hash !~ '^[0-9a-f]{64}$'
    OR char_length(p_idempotency_key) NOT BETWEEN 8 AND 128
    OR p_expires_at <= now()
    OR p_expires_at > now() + interval '30 days' THEN
    RAISE EXCEPTION 'invalid_invitation_input' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_source
  FROM public.project_invitations invitation
  WHERE invitation.id = p_source_invitation_id
  FOR UPDATE;

  IF v_source.id IS NULL THEN
    RAISE EXCEPTION 'invitation_not_found' USING ERRCODE = 'P0002';
  END IF;

  IF v_source.status = 'accepted' THEN
    RAISE EXCEPTION 'accepted_invitation_cannot_be_reissued'
      USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_person
  FROM public.company_people person
  WHERE person.id = v_source.person_id;

  IF v_person.id IS NULL THEN
    RAISE EXCEPTION 'invitation_person_not_found' USING ERRCODE = 'P0002';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.project_memberships membership
    JOIN public.profiles profile ON profile.id = membership.user_id
    WHERE membership.project_id = v_source.project_id
      AND profile.email = v_person.email
      AND membership.status = 'active'
  ) THEN
    RAISE EXCEPTION 'active_membership_exists' USING ERRCODE = '23505';
  END IF;

  UPDATE public.project_invitations
  SET
    status = 'revoked',
    revoked_at = now()
  WHERE project_id = v_source.project_id
    AND person_id = v_source.person_id
    AND status = 'pending';

  INSERT INTO public.project_invitations (
    id,
    company_id,
    project_id,
    person_id,
    email,
    role,
    token_hash,
    idempotency_key,
    expires_at,
    created_by
  ) VALUES (
    p_invitation_id,
    v_source.company_id,
    v_source.project_id,
    v_source.person_id,
    v_person.email,
    v_source.role,
    p_token_hash,
    p_idempotency_key,
    p_expires_at,
    auth.uid()
  );

  INSERT INTO public.project_events (
    project_id,
    event_type,
    actor_user_id,
    idempotency_key,
    payload
  ) VALUES (
    v_source.project_id,
    'invitation_reissued',
    auth.uid(),
    'invitation-reissued:' || p_invitation_id::text,
    jsonb_build_object(
      'source_invitation_id', v_source.id,
      'invitation_id', p_invitation_id
    )
  );

  RETURN jsonb_build_object(
    'invitation_id', p_invitation_id,
    'project_id', v_source.project_id,
    'expires_at', p_expires_at,
    'replayed', false
  );
END;
$$;

REVOKE ALL ON FUNCTION public.revoke_project_invitation(UUID, TEXT)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.revoke_project_invitation(UUID, TEXT)
  TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.reissue_project_invitation(
  UUID,
  UUID,
  TEXT,
  TEXT,
  TIMESTAMPTZ
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reissue_project_invitation(
  UUID,
  UUID,
  TEXT,
  TEXT,
  TIMESTAMPTZ
) TO authenticated, service_role;

COMMENT ON FUNCTION public.revoke_project_invitation(UUID, TEXT) IS
  'Owner-only, idempotent invitation revocation with an append-only audit event.';
COMMENT ON FUNCTION public.reissue_project_invitation(
  UUID,
  UUID,
  TEXT,
  TEXT,
  TIMESTAMPTZ
) IS
  'Owner-only, idempotent replacement of a pending, revoked, or expired invitation.';
