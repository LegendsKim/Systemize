-- ============================================================================
-- 00004_guest_intake_workflow.sql
--
-- Confidential guest intake, owner review, meeting scheduling, payment requests,
-- durable notifications, and idempotent workflow transitions.
-- ============================================================================

CREATE TYPE public.intake_status AS ENUM (
  'draft',
  'submitted',
  'changes_requested',
  'approved'
);

CREATE TYPE public.meeting_slot_status AS ENUM (
  'available',
  'booked',
  'cancelled',
  'completed'
);

CREATE TYPE public.payment_request_kind AS ENUM (
  'discovery',
  'initial_deposit',
  'balance'
);

CREATE TYPE public.payment_request_status AS ENUM (
  'pending',
  'paid',
  'cancelled'
);

CREATE TABLE public.client_intakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL UNIQUE REFERENCES public.projects(id) ON DELETE RESTRICT,
  submitted_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  status public.intake_status NOT NULL DEFAULT 'draft',
  answers JSONB NOT NULL DEFAULT '{}'::jsonb
    CONSTRAINT client_intakes_answers_object CHECK (jsonb_typeof(answers) = 'object')
    CONSTRAINT client_intakes_answers_size CHECK (octet_length(answers::text) <= 50000),
  current_step SMALLINT NOT NULL DEFAULT 1
    CONSTRAINT client_intakes_step_range CHECK (current_step BETWEEN 1 AND 5),
  review_note TEXT
    CONSTRAINT client_intakes_review_note_length
    CHECK (review_note IS NULL OR char_length(review_note) <= 2000),
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT client_intakes_status_consistency CHECK (
    (status = 'draft' AND submitted_at IS NULL AND reviewed_at IS NULL)
    OR (status = 'submitted' AND submitted_at IS NOT NULL AND reviewed_at IS NULL)
    OR (
      status IN ('changes_requested', 'approved')
      AND submitted_at IS NOT NULL
      AND reviewed_at IS NOT NULL
      AND reviewed_by IS NOT NULL
    )
  )
);

CREATE TABLE public.meeting_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE RESTRICT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status public.meeting_slot_status NOT NULL DEFAULT 'available',
  booked_by UUID REFERENCES auth.users(id) ON DELETE RESTRICT,
  booked_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT meeting_slots_duration CHECK (
    ends_at > starts_at AND ends_at <= starts_at + interval '3 hours'
  ),
  CONSTRAINT meeting_slots_booking_consistency CHECK (
    (status = 'available' AND booked_by IS NULL AND booked_at IS NULL)
    OR (
      status IN ('booked', 'completed')
      AND booked_by IS NOT NULL
      AND booked_at IS NOT NULL
    )
    OR (status = 'cancelled')
  )
);

CREATE INDEX meeting_slots_project_time_idx
  ON public.meeting_slots(project_id, starts_at);

CREATE UNIQUE INDEX meeting_slots_one_active_booking_per_project
  ON public.meeting_slots(project_id)
  WHERE status = 'booked';

CREATE TABLE public.payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE RESTRICT,
  kind public.payment_request_kind NOT NULL,
  title TEXT NOT NULL
    CONSTRAINT payment_requests_title_length
    CHECK (char_length(btrim(title)) BETWEEN 3 AND 160),
  amount_agorot INTEGER NOT NULL
    CONSTRAINT payment_requests_amount_positive CHECK (amount_agorot > 0),
  currency TEXT NOT NULL DEFAULT 'ILS'
    CONSTRAINT payment_requests_currency_ils CHECK (currency = 'ILS'),
  payment_url TEXT NOT NULL
    CONSTRAINT payment_requests_https_url
    CHECK (payment_url ~ '^https://[^[:space:]]+$' AND char_length(payment_url) <= 2000),
  status public.payment_request_status NOT NULL DEFAULT 'pending',
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ,
  CONSTRAINT payment_requests_paid_consistency CHECK (
    (status = 'paid' AND paid_at IS NOT NULL)
    OR (status <> 'paid' AND paid_at IS NULL)
  )
);

CREATE UNIQUE INDEX payment_requests_one_pending_kind
  ON public.payment_requests(project_id, kind)
  WHERE status = 'pending';

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  project_id UUID REFERENCES public.projects(id) ON DELETE RESTRICT,
  kind TEXT NOT NULL
    CONSTRAINT notifications_kind_length CHECK (char_length(kind) BETWEEN 3 AND 80),
  title TEXT NOT NULL
    CONSTRAINT notifications_title_length CHECK (char_length(title) BETWEEN 3 AND 160),
  body TEXT NOT NULL
    CONSTRAINT notifications_body_length CHECK (char_length(body) BETWEEN 3 AND 500),
  href TEXT NOT NULL
    CONSTRAINT notifications_href_local CHECK (
      href ~ '^/(admin|portal)(/|$)' AND char_length(href) <= 500
    ),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX notifications_recipient_unread_idx
  ON public.notifications(recipient_user_id, created_at DESC)
  WHERE read_at IS NULL;

CREATE TABLE private.workflow_mutations (
  idempotency_key UUID PRIMARY KEY,
  actor_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE RESTRICT,
  action TEXT NOT NULL
    CONSTRAINT workflow_mutations_action_length CHECK (char_length(action) BETWEEN 3 AND 80),
  result JSONB NOT NULL DEFAULT '{}'::jsonb
    CONSTRAINT workflow_mutations_result_object CHECK (jsonb_typeof(result) = 'object'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER client_intakes_touch_updated_at
BEFORE UPDATE ON public.client_intakes
FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

ALTER TABLE public.client_intakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE
  public.client_intakes,
  public.meeting_slots,
  public.payment_requests,
  public.notifications
FROM PUBLIC, anon, authenticated;

GRANT SELECT ON TABLE
  public.client_intakes,
  public.meeting_slots,
  public.payment_requests,
  public.notifications
TO authenticated;

GRANT UPDATE (read_at) ON public.notifications TO authenticated;

CREATE POLICY client_intakes_project_read
ON public.client_intakes
FOR SELECT
TO authenticated
USING (
  private.is_systemize_owner()
  OR private.is_active_project_member(project_id)
);

CREATE POLICY meeting_slots_project_read
ON public.meeting_slots
FOR SELECT
TO authenticated
USING (
  private.is_systemize_owner()
  OR private.is_active_project_member(project_id)
);

CREATE POLICY payment_requests_project_read
ON public.payment_requests
FOR SELECT
TO authenticated
USING (
  private.is_systemize_owner()
  OR private.is_active_project_member(project_id)
);

CREATE POLICY notifications_recipient_read
ON public.notifications
FOR SELECT
TO authenticated
USING (recipient_user_id = auth.uid());

CREATE POLICY notifications_recipient_mark_read
ON public.notifications
FOR UPDATE
TO authenticated
USING (recipient_user_id = auth.uid())
WITH CHECK (recipient_user_id = auth.uid());

CREATE OR REPLACE FUNCTION private.notify_project_members(
  p_project_id UUID,
  p_kind TEXT,
  p_title TEXT,
  p_body TEXT,
  p_href TEXT,
  p_exclude_user_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  INSERT INTO public.notifications (
    recipient_user_id,
    project_id,
    kind,
    title,
    body,
    href
  )
  SELECT
    membership.user_id,
    p_project_id,
    p_kind,
    p_title,
    p_body,
    p_href
  FROM public.project_memberships membership
  WHERE membership.project_id = p_project_id
    AND membership.status = 'active'
    AND (p_exclude_user_id IS NULL OR membership.user_id <> p_exclude_user_id);
$$;

CREATE OR REPLACE FUNCTION private.notify_systemize_owner(
  p_project_id UUID,
  p_kind TEXT,
  p_title TEXT,
  p_body TEXT,
  p_href TEXT
)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  INSERT INTO public.notifications (
    recipient_user_id,
    project_id,
    kind,
    title,
    body,
    href
  )
  SELECT
    profile.id,
    p_project_id,
    p_kind,
    p_title,
    p_body,
    p_href
  FROM public.profiles profile
  WHERE profile.app_role = 'systemize_owner';
$$;

REVOKE ALL ON FUNCTION private.notify_project_members(UUID, TEXT, TEXT, TEXT, TEXT, UUID)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.notify_systemize_owner(UUID, TEXT, TEXT, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.save_client_intake(
  p_project_id UUID,
  p_answers JSONB,
  p_current_step SMALLINT,
  p_submit BOOLEAN,
  p_idempotency_key UUID
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
    OR p_current_step NOT BETWEEN 1 AND 5 THEN
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

  v_status := CASE WHEN p_submit THEN 'submitted'::public.intake_status
    ELSE 'draft'::public.intake_status END;

  INSERT INTO public.client_intakes (
    project_id,
    submitted_by,
    status,
    answers,
    current_step,
    submitted_at,
    reviewed_at,
    reviewed_by,
    review_note
  ) VALUES (
    p_project_id,
    auth.uid(),
    v_status,
    p_answers,
    p_current_step,
    CASE WHEN p_submit THEN now() ELSE NULL END,
    NULL,
    NULL,
    NULL
  )
  ON CONFLICT (project_id) DO UPDATE
  SET
    status = EXCLUDED.status,
    answers = EXCLUDED.answers,
    current_step = EXCLUDED.current_step,
    submitted_at = EXCLUDED.submitted_at,
    reviewed_at = NULL,
    reviewed_by = NULL,
    review_note = NULL
  RETURNING * INTO v_intake;

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
      jsonb_build_object('intake_id', v_intake.id)
    );

    PERFORM private.notify_systemize_owner(
      p_project_id,
      'client_intake_submitted',
      'שאלון היכרות חדש נשלח',
      'הלקוח סיים את השאלון העסקי והוא ממתין לבדיקה שלך.',
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

CREATE OR REPLACE FUNCTION public.review_client_intake(
  p_project_id UUID,
  p_decision TEXT,
  p_review_note TEXT,
  p_idempotency_key UUID
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

  IF p_decision NOT IN ('approve', 'request_changes')
    OR char_length(coalesce(p_review_note, '')) > 2000 THEN
    RAISE EXCEPTION 'invalid_review_input' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_intake
  FROM public.client_intakes intake
  WHERE intake.project_id = p_project_id
  FOR UPDATE;

  IF v_intake.id IS NULL OR v_intake.status <> 'submitted' THEN
    RAISE EXCEPTION 'submitted_intake_required' USING ERRCODE = '55000';
  END IF;

  v_status := CASE WHEN p_decision = 'approve'
    THEN 'approved'::public.intake_status
    ELSE 'changes_requested'::public.intake_status END;

  UPDATE public.client_intakes
  SET
    status = v_status,
    review_note = nullif(btrim(coalesce(p_review_note, '')), ''),
    reviewed_at = now(),
    reviewed_by = auth.uid()
  WHERE id = v_intake.id;

  INSERT INTO public.project_events (
    project_id,
    event_type,
    actor_user_id,
    idempotency_key,
    payload
  ) VALUES (
    p_project_id,
    CASE WHEN p_decision = 'approve'
      THEN 'client_intake_approved'
      ELSE 'client_intake_changes_requested' END,
    auth.uid(),
    'client-intake-reviewed:' || p_idempotency_key::text,
    jsonb_build_object('intake_id', v_intake.id, 'decision', p_decision)
  );

  PERFORM private.notify_project_members(
    p_project_id,
    CASE WHEN p_decision = 'approve'
      THEN 'client_intake_approved'
      ELSE 'client_intake_changes_requested' END,
    CASE WHEN p_decision = 'approve'
      THEN 'השאלון אושר'
      ELSE 'נדרש עדכון קצר בשאלון' END,
    CASE WHEN p_decision = 'approve'
      THEN 'עברנו על הפרטים והכול ברור. אפשר להתקדם לבחירת מועד לפגישה.'
      ELSE 'עברנו על השאלון ויש כמה פרטים שכדאי להשלים לפני שמתקדמים.' END,
    '/portal/projects/' || p_project_id::text,
    auth.uid()
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
    'review_client_intake',
    jsonb_build_object('intake_id', v_intake.id, 'status', v_status)
  );

  RETURN jsonb_build_object('intake_id', v_intake.id, 'status', v_status);
END;
$$;

CREATE OR REPLACE FUNCTION public.create_meeting_slot(
  p_project_id UUID,
  p_starts_at TIMESTAMPTZ,
  p_ends_at TIMESTAMPTZ,
  p_idempotency_key UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_existing private.workflow_mutations;
  v_slot public.meeting_slots;
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

  IF p_starts_at <= now()
    OR p_ends_at <= p_starts_at
    OR p_ends_at > p_starts_at + interval '3 hours' THEN
    RAISE EXCEPTION 'invalid_meeting_slot' USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.client_intakes intake
    WHERE intake.project_id = p_project_id AND intake.status = 'approved'
  ) THEN
    RAISE EXCEPTION 'approved_intake_required' USING ERRCODE = '55000';
  END IF;

  INSERT INTO public.meeting_slots (
    project_id,
    starts_at,
    ends_at,
    created_by
  ) VALUES (
    p_project_id,
    p_starts_at,
    p_ends_at,
    auth.uid()
  )
  RETURNING * INTO v_slot;

  PERFORM private.notify_project_members(
    p_project_id,
    'meeting_slots_opened',
    'נפתחו מועדים לפגישה',
    'אפשר לבחור עכשיו את המועד שנוח לך לפגישת המיקוד.',
    '/portal/projects/' || p_project_id::text,
    auth.uid()
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
    'create_meeting_slot',
    jsonb_build_object('slot_id', v_slot.id)
  );

  RETURN jsonb_build_object('slot_id', v_slot.id);
END;
$$;

CREATE OR REPLACE FUNCTION public.book_meeting_slot(
  p_project_id UUID,
  p_slot_id UUID,
  p_idempotency_key UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_existing private.workflow_mutations;
  v_slot public.meeting_slots;
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

  IF NOT EXISTS (
    SELECT 1 FROM public.client_intakes intake
    WHERE intake.project_id = p_project_id AND intake.status = 'approved'
  ) THEN
    RAISE EXCEPTION 'approved_intake_required' USING ERRCODE = '55000';
  END IF;

  SELECT * INTO v_slot
  FROM public.meeting_slots slot
  WHERE slot.id = p_slot_id
    AND slot.project_id = p_project_id
  FOR UPDATE;

  IF v_slot.id IS NULL OR v_slot.status <> 'available' OR v_slot.starts_at <= now() THEN
    RAISE EXCEPTION 'meeting_slot_unavailable' USING ERRCODE = '55000';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.meeting_slots slot
    WHERE slot.project_id = p_project_id AND slot.status = 'booked'
  ) THEN
    RAISE EXCEPTION 'project_meeting_already_booked' USING ERRCODE = '23505';
  END IF;

  UPDATE public.meeting_slots
  SET
    status = 'booked',
    booked_by = auth.uid(),
    booked_at = now()
  WHERE id = p_slot_id;

  UPDATE public.projects
  SET stage = 'intro_call_scheduled'
  WHERE id = p_project_id;

  INSERT INTO public.project_events (
    project_id,
    event_type,
    actor_user_id,
    idempotency_key,
    payload
  ) VALUES (
    p_project_id,
    'meeting_booked',
    auth.uid(),
    'meeting-booked:' || p_idempotency_key::text,
    jsonb_build_object('slot_id', p_slot_id, 'starts_at', v_slot.starts_at)
  );

  PERFORM private.notify_systemize_owner(
    p_project_id,
    'meeting_booked',
    'הלקוח קבע פגישה',
    'נבחר מועד לפגישת המיקוד. הפרטים מופיעים בכרטיס הפרויקט.',
    '/admin/projects/' || p_project_id::text
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
    'book_meeting_slot',
    jsonb_build_object('slot_id', p_slot_id, 'status', 'booked')
  );

  RETURN jsonb_build_object('slot_id', p_slot_id, 'status', 'booked');
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_project_meeting(
  p_project_id UUID,
  p_slot_id UUID,
  p_idempotency_key UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_existing private.workflow_mutations;
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

  UPDATE public.meeting_slots
  SET status = 'completed'
  WHERE id = p_slot_id
    AND project_id = p_project_id
    AND status = 'booked';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'booked_meeting_required' USING ERRCODE = '55000';
  END IF;

  UPDATE public.projects
  SET stage = 'initial_summary_preparation'
  WHERE id = p_project_id;

  INSERT INTO public.project_events (
    project_id,
    event_type,
    actor_user_id,
    idempotency_key,
    payload
  ) VALUES (
    p_project_id,
    'meeting_completed',
    auth.uid(),
    'meeting-completed:' || p_idempotency_key::text,
    jsonb_build_object('slot_id', p_slot_id)
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
    'complete_project_meeting',
    jsonb_build_object('slot_id', p_slot_id, 'status', 'completed')
  );

  RETURN jsonb_build_object('slot_id', p_slot_id, 'status', 'completed');
END;
$$;

CREATE OR REPLACE FUNCTION public.create_payment_request(
  p_project_id UUID,
  p_kind public.payment_request_kind,
  p_title TEXT,
  p_amount_agorot INTEGER,
  p_payment_url TEXT,
  p_idempotency_key UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_existing private.workflow_mutations;
  v_payment public.payment_requests;
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

  IF char_length(btrim(p_title)) NOT BETWEEN 3 AND 160
    OR p_amount_agorot <= 0
    OR p_payment_url !~ '^https://[^[:space:]]+$'
    OR char_length(p_payment_url) > 2000 THEN
    RAISE EXCEPTION 'invalid_payment_request' USING ERRCODE = '22023';
  END IF;

  UPDATE public.payment_requests
  SET status = 'cancelled'
  WHERE project_id = p_project_id
    AND kind = p_kind
    AND status = 'pending';

  INSERT INTO public.payment_requests (
    project_id,
    kind,
    title,
    amount_agorot,
    payment_url,
    created_by
  ) VALUES (
    p_project_id,
    p_kind,
    btrim(p_title),
    p_amount_agorot,
    p_payment_url,
    auth.uid()
  )
  RETURNING * INTO v_payment;

  UPDATE public.projects
  SET stage = CASE
    WHEN p_kind = 'discovery' THEN 'discovery_payment_pending'::public.project_stage
    WHEN p_kind = 'initial_deposit' THEN 'initial_payment_pending'::public.project_stage
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
    'payment_requested',
    auth.uid(),
    'payment-requested:' || p_idempotency_key::text,
    jsonb_build_object(
      'payment_request_id', v_payment.id,
      'kind', p_kind,
      'amount_agorot', p_amount_agorot,
      'currency', 'ILS'
    )
  );

  PERFORM private.notify_project_members(
    p_project_id,
    'payment_requested',
    'בקשת תשלום חדשה',
    'פרטי התשלום והקישור המאובטח מחכים לך באזור האישי.',
    '/portal/projects/' || p_project_id::text,
    auth.uid()
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
    'create_payment_request',
    jsonb_build_object('payment_request_id', v_payment.id, 'status', 'pending')
  );

  RETURN jsonb_build_object('payment_request_id', v_payment.id, 'status', 'pending');
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_payment_received(
  p_project_id UUID,
  p_payment_request_id UUID,
  p_idempotency_key UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_existing private.workflow_mutations;
  v_payment public.payment_requests;
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

  SELECT * INTO v_payment
  FROM public.payment_requests payment
  WHERE payment.id = p_payment_request_id
    AND payment.project_id = p_project_id
  FOR UPDATE;

  IF v_payment.id IS NULL OR v_payment.status <> 'pending' THEN
    RAISE EXCEPTION 'pending_payment_required' USING ERRCODE = '55000';
  END IF;

  UPDATE public.payment_requests
  SET status = 'paid', paid_at = now()
  WHERE id = p_payment_request_id;

  UPDATE public.projects
  SET stage = CASE
    WHEN v_payment.kind = 'discovery'
      THEN 'full_discovery_and_planning'::public.project_stage
    WHEN v_payment.kind = 'initial_deposit'
      THEN 'delivery'::public.project_stage
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
    'payment_received',
    auth.uid(),
    'payment-received:' || p_idempotency_key::text,
    jsonb_build_object(
      'payment_request_id', v_payment.id,
      'kind', v_payment.kind,
      'amount_agorot', v_payment.amount_agorot,
      'currency', v_payment.currency
    )
  );

  PERFORM private.notify_project_members(
    p_project_id,
    'payment_received',
    'התשלום התקבל',
    'התשלום אושר והשלב הבא בתהליך נפתח.',
    '/portal/projects/' || p_project_id::text,
    auth.uid()
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
    'mark_payment_received',
    jsonb_build_object('payment_request_id', v_payment.id, 'status', 'paid')
  );

  RETURN jsonb_build_object('payment_request_id', v_payment.id, 'status', 'paid');
END;
$$;

REVOKE ALL ON FUNCTION public.save_client_intake(UUID, JSONB, SMALLINT, BOOLEAN, UUID)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.review_client_intake(UUID, TEXT, TEXT, UUID)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_meeting_slot(UUID, TIMESTAMPTZ, TIMESTAMPTZ, UUID)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.book_meeting_slot(UUID, UUID, UUID)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.complete_project_meeting(UUID, UUID, UUID)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_payment_request(
  UUID,
  public.payment_request_kind,
  TEXT,
  INTEGER,
  TEXT,
  UUID
) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.mark_payment_received(UUID, UUID, UUID)
  FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.save_client_intake(UUID, JSONB, SMALLINT, BOOLEAN, UUID)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_client_intake(UUID, TEXT, TEXT, UUID)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_meeting_slot(UUID, TIMESTAMPTZ, TIMESTAMPTZ, UUID)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.book_meeting_slot(UUID, UUID, UUID)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_project_meeting(UUID, UUID, UUID)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_payment_request(
  UUID,
  public.payment_request_kind,
  TEXT,
  INTEGER,
  TEXT,
  UUID
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_payment_received(UUID, UUID, UUID)
  TO authenticated;
