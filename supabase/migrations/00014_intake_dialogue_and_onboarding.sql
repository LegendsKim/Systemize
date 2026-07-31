-- Slice 5: the intake stops being a one-way form.
--
-- Three gaps this closes. A client who saved a draft after SYSTEMIZE asked for changes
-- lost the request itself, because every save reset the row to 'draft' and nulled the
-- review note. A client who wanted to answer that note had nowhere to write. And a client
-- who typed for ten minutes and then closed the tab lost everything, because the only
-- persistence was an explicit button.

ALTER TABLE public.profiles
  ADD COLUMN portal_onboarded_at TIMESTAMPTZ;

COMMENT ON COLUMN public.profiles.portal_onboarded_at IS
  'When the client finished the one-time portal orientation. NULL means it is still owed.';

ALTER TABLE public.client_intakes
  ADD COLUMN client_reply TEXT
    CONSTRAINT client_intakes_client_reply_length
    CHECK (client_reply IS NULL OR char_length(client_reply) <= 2000);

COMMENT ON COLUMN public.client_intakes.client_reply IS
  'The client''s answer to the review note, written next to it and re-sent with the intake.';

-- The signature gains the reply, so the old five-argument function must go rather than
-- sit alongside it: two overloads reachable by named arguments is an ambiguity waiting
-- for a caller to trip over.
DROP FUNCTION public.save_client_intake(UUID, JSONB, SMALLINT, BOOLEAN, UUID);

CREATE FUNCTION public.save_client_intake(
  p_project_id UUID,
  p_answers JSONB,
  p_current_step SMALLINT,
  p_submit BOOLEAN,
  p_idempotency_key UUID,
  p_client_reply TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_existing private.workflow_mutations;
  v_intake public.client_intakes;
  v_status public.intake_status;
  v_reply TEXT;
  v_revision BOOLEAN;
BEGIN
  IF auth.uid() IS NULL OR NOT private.is_active_project_member(p_project_id) THEN
    RAISE EXCEPTION 'active_project_membership_required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_existing
  FROM private.workflow_mutations mutation
  WHERE mutation.idempotency_key = p_idempotency_key;

  IF v_existing.idempotency_key IS NOT NULL THEN
    RETURN v_existing.result;
  END IF;

  IF jsonb_typeof(p_answers) <> 'object'
    OR octet_length(p_answers::text) > 50000
    OR p_current_step NOT BETWEEN 1 AND 5
    OR char_length(coalesce(p_client_reply, '')) > 2000 THEN
    RAISE EXCEPTION 'invalid_intake_input' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_intake
  FROM public.client_intakes intake
  WHERE intake.project_id = p_project_id
  FOR UPDATE;

  IF v_intake.id IS NOT NULL
    AND v_intake.submitted_by <> auth.uid() THEN
    RAISE EXCEPTION 'intake_owner_mismatch' USING ERRCODE = '42501';
  END IF;

  IF v_intake.status IN ('submitted', 'approved') THEN
    RAISE EXCEPTION 'intake_locked' USING ERRCODE = '55000';
  END IF;

  v_reply := nullif(btrim(coalesce(p_client_reply, '')), '');
  v_revision := v_intake.status = 'changes_requested';

  /*
   * A saved draft no longer erases the change request. Until the client actually
   * re-submits, the note stands and both screens keep saying the same thing about
   * whose turn it is.
   */
  v_status := CASE
    WHEN p_submit THEN 'submitted'::public.intake_status
    WHEN v_revision THEN 'changes_requested'::public.intake_status
    ELSE 'draft'::public.intake_status
  END;

  /*
   * Insert and update are written out separately rather than as one upsert.
   *
   * `client_intakes_status_consistency` requires a reviewed status to carry its review
   * timestamps, and PostgreSQL checks the proposed row before it ever reaches the
   * ON CONFLICT branch — so an upsert that means "keep the existing timestamps" is
   * rejected on a tuple that was never going to be stored.
   */
  IF v_intake.id IS NULL THEN
    INSERT INTO public.client_intakes (
      project_id,
      submitted_by,
      status,
      answers,
      current_step,
      client_reply,
      submitted_at
    ) VALUES (
      p_project_id,
      auth.uid(),
      v_status,
      p_answers,
      p_current_step,
      v_reply,
      CASE WHEN p_submit THEN now() ELSE NULL END
    )
    RETURNING * INTO v_intake;
  ELSE
    UPDATE public.client_intakes
    SET
      status = v_status,
      answers = p_answers,
      current_step = p_current_step,
      client_reply = v_reply,
      submitted_at = CASE WHEN p_submit THEN now() ELSE submitted_at END,
      reviewed_at = CASE WHEN p_submit THEN NULL ELSE reviewed_at END,
      reviewed_by = CASE WHEN p_submit THEN NULL ELSE reviewed_by END,
      review_note = CASE WHEN p_submit THEN NULL ELSE review_note END
    WHERE id = v_intake.id
    RETURNING * INTO v_intake;
  END IF;

  IF p_submit THEN
    INSERT INTO public.project_events (
      project_id,
      event_type,
      actor_user_id,
      idempotency_key,
      payload
    ) VALUES (
      p_project_id,
      'client_intake_submitted',
      auth.uid(),
      'client-intake-submitted:' || p_idempotency_key::text,
      jsonb_build_object(
        'intake_id', v_intake.id,
        'revision', v_revision,
        'has_reply', v_reply IS NOT NULL
      )
    );

    PERFORM private.notify_systemize_owner(
      p_project_id,
      'client_intake_submitted',
      CASE WHEN v_revision
        THEN 'הלקוח השלים את התיקונים'
        ELSE 'שאלון היכרות חדש נשלח' END,
      CASE WHEN v_revision
        THEN 'השאלון נשלח שוב לבדיקה, יחד עם תגובת הלקוח להערה.'
        ELSE 'הלקוח סיים את השאלון העסקי והוא ממתין לבדיקה שלך.' END,
      '/admin/projects/' || p_project_id::text
    );
  END IF;

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
    CASE WHEN p_submit THEN 'submit_client_intake' ELSE 'save_client_intake' END,
    jsonb_build_object('intake_id', v_intake.id, 'status', v_intake.status)
  );

  RETURN jsonb_build_object('intake_id', v_intake.id, 'status', v_intake.status);
END;
$$;

/*
 * Autosave is deliberately not the same call.
 *
 * It carries no idempotency key because it needs none: a draft upsert is last-write-wins
 * and replaying it changes nothing. Routing it through save_client_intake would instead
 * write one durable mutation row every few seconds of typing, which is a table that grows
 * without bound for no benefit. It also raises no event and sends no notification —
 * nobody should be paged because a client paused mid-sentence.
 */
CREATE FUNCTION public.autosave_client_intake(
  p_project_id UUID,
  p_answers JSONB,
  p_current_step SMALLINT,
  p_client_reply TEXT
)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_intake public.client_intakes;
  v_reply TEXT;
  v_saved_at TIMESTAMPTZ;
BEGIN
  IF auth.uid() IS NULL OR NOT private.is_active_project_member(p_project_id) THEN
    RAISE EXCEPTION 'active_project_membership_required' USING ERRCODE = '42501';
  END IF;

  IF jsonb_typeof(p_answers) <> 'object'
    OR octet_length(p_answers::text) > 50000
    OR p_current_step NOT BETWEEN 1 AND 5
    OR char_length(coalesce(p_client_reply, '')) > 2000 THEN
    RAISE EXCEPTION 'invalid_intake_input' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_intake
  FROM public.client_intakes intake
  WHERE intake.project_id = p_project_id
  FOR UPDATE;

  IF v_intake.id IS NOT NULL
    AND v_intake.submitted_by <> auth.uid() THEN
    RAISE EXCEPTION 'intake_owner_mismatch' USING ERRCODE = '42501';
  END IF;

  IF v_intake.status IN ('submitted', 'approved') THEN
    RAISE EXCEPTION 'intake_locked' USING ERRCODE = '55000';
  END IF;

  v_reply := nullif(btrim(coalesce(p_client_reply, '')), '');

  -- Status is never touched here, so an open change request stays open while the client
  -- works on it. A first autosave opens the row as a plain draft.
  IF v_intake.id IS NULL THEN
    INSERT INTO public.client_intakes (
      project_id,
      submitted_by,
      status,
      answers,
      current_step,
      client_reply
    ) VALUES (
      p_project_id,
      auth.uid(),
      'draft',
      p_answers,
      p_current_step,
      v_reply
    )
    RETURNING updated_at INTO v_saved_at;
  ELSE
    UPDATE public.client_intakes
    SET
      answers = p_answers,
      current_step = p_current_step,
      client_reply = v_reply
    WHERE id = v_intake.id
    RETURNING updated_at INTO v_saved_at;
  END IF;

  RETURN v_saved_at;
END;
$$;

CREATE FUNCTION public.complete_portal_onboarding()
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_completed_at TIMESTAMPTZ;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;

  -- Idempotent: finishing the orientation twice keeps the first timestamp.
  UPDATE public.profiles
  SET
    portal_onboarded_at = coalesce(portal_onboarded_at, now()),
    updated_at = now()
  WHERE id = auth.uid()
  RETURNING portal_onboarded_at INTO v_completed_at;

  RETURN v_completed_at;
END;
$$;

/*
 * "Did my client actually turn notifications on?" — answerable without the operator
 * reading anyone's subscription rows. Counts only; endpoints and keys never leave the
 * table, and the owner check is inside the function rather than trusted from the caller.
 */
CREATE FUNCTION public.project_push_readiness(p_project_id UUID)
RETURNS TABLE (members INTEGER, members_with_push INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT private.is_systemize_owner() THEN
    RAISE EXCEPTION 'systemize_owner_required' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    count(*)::INTEGER,
    count(*) FILTER (
      WHERE EXISTS (
        SELECT 1
        FROM public.push_subscriptions subscription
        WHERE subscription.user_id = membership.user_id
      )
    )::INTEGER
  FROM public.project_memberships membership
  WHERE membership.project_id = p_project_id
    AND membership.status = 'active';
END;
$$;

REVOKE ALL ON FUNCTION public.save_client_intake(UUID, JSONB, SMALLINT, BOOLEAN, UUID, TEXT)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.autosave_client_intake(UUID, JSONB, SMALLINT, TEXT)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.complete_portal_onboarding() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.project_push_readiness(UUID) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.save_client_intake(UUID, JSONB, SMALLINT, BOOLEAN, UUID, TEXT)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.autosave_client_intake(UUID, JSONB, SMALLINT, TEXT)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_portal_onboarding() TO authenticated;
GRANT EXECUTE ON FUNCTION public.project_push_readiness(UUID) TO authenticated;

COMMENT ON FUNCTION public.autosave_client_intake(UUID, JSONB, SMALLINT, TEXT) IS
  'Last-write-wins draft persistence. Never transitions status, raises no event, notifies nobody.';
COMMENT ON FUNCTION public.project_push_readiness(UUID) IS
  'Owner-only counts of project members reachable by Web Push. Exposes no endpoint or identity.';
