-- ============================================================================
-- 00003_portal_foundation.sql
--
-- SYSTEMIZE PORTAL foundation:
-- companies, people, projects, project memberships, single-use invitations,
-- project events, and the RLS/transaction boundaries that protect them.
-- ============================================================================

CREATE TYPE public.portal_app_role AS ENUM (
  'systemize_owner',
  'client'
);

CREATE TYPE public.project_member_role AS ENUM (
  'client_owner'
);

CREATE TYPE public.project_membership_status AS ENUM (
  'active',
  'revoked'
);

CREATE TYPE public.project_invitation_status AS ENUM (
  'pending',
  'accepted',
  'revoked'
);

CREATE TYPE public.project_stage AS ENUM (
  'lead',
  'intro_call_scheduled',
  'initial_summary_preparation',
  'discovery_offer_awaiting_client',
  'discovery_payment_pending',
  'full_discovery_and_planning',
  'solution_options_preparation',
  'proposal_and_contract_awaiting_client',
  'initial_payment_pending',
  'delivery',
  'client_review',
  'rollout',
  'support',
  'completed',
  'cancelled'
);

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE RESTRICT,
  email TEXT NOT NULL UNIQUE
    CONSTRAINT profiles_email_canonical
    CHECK (
      email = lower(btrim(email))
      AND email ~ '^[^@[:space:]]+@gmail\.com$'
      AND char_length(email) BETWEEN 11 AND 320
    ),
  full_name TEXT NOT NULL
    CONSTRAINT profiles_full_name_length
    CHECK (char_length(btrim(full_name)) BETWEEN 2 AND 120),
  app_role public.portal_app_role NOT NULL DEFAULT 'client',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL
    CONSTRAINT companies_name_length
    CHECK (char_length(btrim(name)) BETWEEN 2 AND 160),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.company_people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE RESTRICT,
  full_name TEXT NOT NULL
    CONSTRAINT company_people_full_name_length
    CHECK (char_length(btrim(full_name)) BETWEEN 2 AND 120),
  email TEXT NOT NULL
    CONSTRAINT company_people_email_canonical
    CHECK (
      email = lower(btrim(email))
      AND email ~ '^[^@[:space:]]+@gmail\.com$'
      AND char_length(email) BETWEEN 11 AND 320
    ),
  phone TEXT NOT NULL
    CONSTRAINT company_people_phone_length
    CHECK (char_length(btrim(phone)) BETWEEN 8 AND 32),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT company_people_company_email_key UNIQUE (company_id, email)
);

CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  name TEXT NOT NULL
    CONSTRAINT projects_name_length
    CHECK (char_length(btrim(name)) BETWEEN 2 AND 160),
  stage public.project_stage NOT NULL DEFAULT 'lead',
  progress_percent SMALLINT NOT NULL DEFAULT 0
    CONSTRAINT projects_progress_range
    CHECK (progress_percent BETWEEN 0 AND 100),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX projects_company_id_idx ON public.projects(company_id);

CREATE TABLE public.project_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  person_id UUID NOT NULL REFERENCES public.company_people(id) ON DELETE RESTRICT,
  role public.project_member_role NOT NULL DEFAULT 'client_owner',
  status public.project_membership_status NOT NULL DEFAULT 'active',
  added_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  CONSTRAINT project_memberships_project_user_key UNIQUE (project_id, user_id),
  CONSTRAINT project_memberships_revocation_consistency CHECK (
    (status = 'active' AND revoked_at IS NULL)
    OR (status = 'revoked' AND revoked_at IS NOT NULL)
  )
);

CREATE INDEX project_memberships_user_active_idx
  ON public.project_memberships(user_id, project_id)
  WHERE status = 'active';

CREATE TABLE public.project_invitations (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE RESTRICT,
  person_id UUID NOT NULL REFERENCES public.company_people(id) ON DELETE RESTRICT,
  email TEXT NOT NULL
    CONSTRAINT project_invitations_email_canonical
    CHECK (
      email = lower(btrim(email))
      AND email ~ '^[^@[:space:]]+@gmail\.com$'
      AND char_length(email) BETWEEN 11 AND 320
    ),
  role public.project_member_role NOT NULL DEFAULT 'client_owner',
  token_hash TEXT NOT NULL UNIQUE
    CONSTRAINT project_invitations_token_hash_shape
    CHECK (token_hash ~ '^[0-9a-f]{64}$'),
  idempotency_key TEXT NOT NULL UNIQUE
    CONSTRAINT project_invitations_idempotency_length
    CHECK (char_length(idempotency_key) BETWEEN 8 AND 128),
  status public.project_invitation_status NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_by UUID REFERENCES auth.users(id) ON DELETE RESTRICT,
  accepted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  CONSTRAINT project_invitations_expiry_after_creation
    CHECK (expires_at > created_at),
  CONSTRAINT project_invitations_status_consistency CHECK (
    (
      status = 'pending'
      AND accepted_by IS NULL
      AND accepted_at IS NULL
      AND revoked_at IS NULL
    )
    OR (
      status = 'accepted'
      AND accepted_by IS NOT NULL
      AND accepted_at IS NOT NULL
      AND revoked_at IS NULL
    )
    OR (
      status = 'revoked'
      AND accepted_by IS NULL
      AND accepted_at IS NULL
      AND revoked_at IS NOT NULL
    )
  )
);

CREATE UNIQUE INDEX project_invitations_one_pending_email
  ON public.project_invitations(project_id, email)
  WHERE status = 'pending';

CREATE INDEX project_invitations_project_created_idx
  ON public.project_invitations(project_id, created_at DESC);

CREATE TABLE public.project_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE RESTRICT,
  event_type TEXT NOT NULL
    CONSTRAINT project_events_type_length
    CHECK (char_length(event_type) BETWEEN 3 AND 80),
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE RESTRICT,
  idempotency_key TEXT NOT NULL UNIQUE
    CONSTRAINT project_events_idempotency_length
    CHECK (char_length(idempotency_key) BETWEEN 8 AND 160),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb
    CONSTRAINT project_events_payload_object
    CHECK (jsonb_typeof(payload) = 'object'),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX project_events_project_time_idx
  ON public.project_events(project_id, occurred_at DESC);

CREATE OR REPLACE FUNCTION private.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.touch_updated_at() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER profiles_touch_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

CREATE TRIGGER companies_touch_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

CREATE TRIGGER company_people_touch_updated_at
BEFORE UPDATE ON public.company_people
FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

CREATE TRIGGER projects_touch_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

CREATE OR REPLACE FUNCTION private.is_systemize_owner()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles profile
    WHERE profile.id = auth.uid()
      AND profile.app_role = 'systemize_owner'
  );
$$;

CREATE OR REPLACE FUNCTION private.is_active_project_member(p_project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.project_memberships membership
    WHERE membership.project_id = p_project_id
      AND membership.user_id = auth.uid()
      AND membership.status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION private.can_access_company(p_company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT private.is_systemize_owner()
    OR EXISTS (
      SELECT 1
      FROM public.projects project
      JOIN public.project_memberships membership
        ON membership.project_id = project.id
      WHERE project.company_id = p_company_id
        AND membership.user_id = auth.uid()
        AND membership.status = 'active'
    );
$$;

REVOKE ALL ON FUNCTION private.is_systemize_owner()
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.is_active_project_member(UUID)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.can_access_company(UUID)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_systemize_owner()
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_active_project_member(UUID)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.can_access_company(UUID)
  TO authenticated, service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE
  public.profiles,
  public.companies,
  public.company_people,
  public.projects,
  public.project_memberships,
  public.project_invitations,
  public.project_events
FROM PUBLIC, anon, authenticated;

GRANT SELECT ON TABLE
  public.profiles,
  public.companies,
  public.company_people,
  public.projects,
  public.project_memberships,
  public.project_invitations,
  public.project_events
TO authenticated;

GRANT INSERT, UPDATE ON TABLE
  public.companies,
  public.company_people,
  public.projects,
  public.project_memberships,
  public.project_invitations
TO authenticated;

CREATE POLICY profiles_read_self_or_owner
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid() OR private.is_systemize_owner());

CREATE POLICY companies_owner_all
ON public.companies
FOR ALL
TO authenticated
USING (private.is_systemize_owner())
WITH CHECK (private.is_systemize_owner() AND created_by = auth.uid());

CREATE POLICY companies_member_read
ON public.companies
FOR SELECT
TO authenticated
USING (private.can_access_company(id));

CREATE POLICY company_people_owner_all
ON public.company_people
FOR ALL
TO authenticated
USING (private.is_systemize_owner())
WITH CHECK (private.is_systemize_owner() AND created_by = auth.uid());

CREATE POLICY company_people_member_read
ON public.company_people
FOR SELECT
TO authenticated
USING (private.can_access_company(company_id));

CREATE POLICY projects_owner_all
ON public.projects
FOR ALL
TO authenticated
USING (private.is_systemize_owner())
WITH CHECK (private.is_systemize_owner() AND created_by = auth.uid());

CREATE POLICY projects_member_read
ON public.projects
FOR SELECT
TO authenticated
USING (private.is_active_project_member(id));

CREATE POLICY project_memberships_owner_all
ON public.project_memberships
FOR ALL
TO authenticated
USING (private.is_systemize_owner())
WITH CHECK (private.is_systemize_owner() AND added_by = auth.uid());

CREATE POLICY project_memberships_member_read
ON public.project_memberships
FOR SELECT
TO authenticated
USING (private.is_active_project_member(project_id));

CREATE POLICY project_invitations_owner_all
ON public.project_invitations
FOR ALL
TO authenticated
USING (private.is_systemize_owner())
WITH CHECK (private.is_systemize_owner() AND created_by = auth.uid());

CREATE POLICY project_events_owner_read
ON public.project_events
FOR SELECT
TO authenticated
USING (
  private.is_systemize_owner()
  OR private.is_active_project_member(project_id)
);

CREATE OR REPLACE FUNCTION public.create_project_invitation(
  p_invitation_id UUID,
  p_project_id UUID,
  p_full_name TEXT,
  p_email TEXT,
  p_phone TEXT,
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
  v_project public.projects;
  v_person_id UUID;
  v_existing public.project_invitations;
  v_email TEXT := lower(btrim(p_email));
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

  IF p_invitation_id IS NULL
    OR p_token_hash !~ '^[0-9a-f]{64}$'
    OR char_length(p_idempotency_key) NOT BETWEEN 8 AND 128
    OR v_email !~ '^[^@[:space:]]+@gmail\.com$'
    OR char_length(btrim(p_full_name)) NOT BETWEEN 2 AND 120
    OR char_length(btrim(p_phone)) NOT BETWEEN 8 AND 32
    OR p_expires_at <= now()
    OR p_expires_at > now() + interval '30 days' THEN
    RAISE EXCEPTION 'invalid_invitation_input' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_project
  FROM public.projects project
  WHERE project.id = p_project_id;

  IF v_project.id IS NULL THEN
    RAISE EXCEPTION 'project_not_found' USING ERRCODE = 'P0002';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.project_memberships membership
    JOIN public.profiles profile ON profile.id = membership.user_id
    WHERE membership.project_id = p_project_id
      AND profile.email = v_email
      AND membership.status = 'active'
  ) THEN
    RAISE EXCEPTION 'active_membership_exists' USING ERRCODE = '23505';
  END IF;

  INSERT INTO public.company_people (
    company_id,
    full_name,
    email,
    phone,
    created_by
  ) VALUES (
    v_project.company_id,
    btrim(p_full_name),
    v_email,
    btrim(p_phone),
    auth.uid()
  )
  ON CONFLICT (company_id, email) DO UPDATE
  SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    updated_at = now()
  RETURNING id INTO v_person_id;

  UPDATE public.project_invitations
  SET
    status = 'revoked',
    revoked_at = now()
  WHERE project_id = p_project_id
    AND email = v_email
    AND status = 'pending';

  INSERT INTO public.project_invitations (
    id,
    company_id,
    project_id,
    person_id,
    email,
    token_hash,
    idempotency_key,
    expires_at,
    created_by
  ) VALUES (
    p_invitation_id,
    v_project.company_id,
    p_project_id,
    v_person_id,
    v_email,
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
    p_project_id,
    'invitation_created',
    auth.uid(),
    'invitation-created:' || p_invitation_id::text,
    jsonb_build_object('invitation_id', p_invitation_id)
  );

  RETURN jsonb_build_object(
    'invitation_id', p_invitation_id,
    'project_id', p_project_id,
    'expires_at', p_expires_at,
    'replayed', false
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.create_company_project(
  p_company_id UUID,
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
  v_existing public.project_events;
BEGIN
  IF auth.uid() IS NULL OR NOT private.is_systemize_owner() THEN
    RAISE EXCEPTION 'systemize_owner_required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_existing
  FROM public.project_events event
  WHERE event.idempotency_key = 'project-created:' || p_idempotency_key;

  IF v_existing.id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'company_id', v_existing.payload->>'company_id',
      'project_id', v_existing.project_id,
      'replayed', true
    );
  END IF;

  IF p_company_id IS NULL
    OR p_project_id IS NULL
    OR char_length(btrim(p_company_name)) NOT BETWEEN 2 AND 160
    OR char_length(btrim(p_project_name)) NOT BETWEEN 2 AND 160
    OR char_length(p_idempotency_key) NOT BETWEEN 8 AND 128 THEN
    RAISE EXCEPTION 'invalid_project_input' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.companies (id, name, created_by)
  VALUES (p_company_id, btrim(p_company_name), auth.uid());

  INSERT INTO public.projects (id, company_id, name, created_by)
  VALUES (p_project_id, p_company_id, btrim(p_project_name), auth.uid());

  INSERT INTO public.project_events (
    project_id,
    event_type,
    actor_user_id,
    idempotency_key,
    payload
  ) VALUES (
    p_project_id,
    'project_created',
    auth.uid(),
    'project-created:' || p_idempotency_key,
    jsonb_build_object('company_id', p_company_id)
  );

  RETURN jsonb_build_object(
    'company_id', p_company_id,
    'project_id', p_project_id,
    'replayed', false
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_project_invitation(
  p_token_hash TEXT,
  p_user_id UUID,
  p_verified_email TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_invitation public.project_invitations;
  v_auth_email TEXT;
  v_email TEXT := lower(btrim(p_verified_email));
  v_full_name TEXT;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'service_role_required' USING ERRCODE = '42501';
  END IF;

  IF p_token_hash !~ '^[0-9a-f]{64}$'
    OR v_email !~ '^[^@[:space:]]+@gmail\.com$' THEN
    RAISE EXCEPTION 'invalid_invitation_credentials' USING ERRCODE = '22023';
  END IF;

  SELECT lower(btrim(user_record.email))
  INTO v_auth_email
  FROM auth.users user_record
  WHERE user_record.id = p_user_id;

  IF v_auth_email IS NULL OR v_auth_email <> v_email THEN
    RAISE EXCEPTION 'verified_identity_mismatch' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_invitation
  FROM public.project_invitations invitation
  WHERE invitation.token_hash = p_token_hash
  FOR UPDATE;

  IF v_invitation.id IS NULL
    OR v_invitation.status <> 'pending'
    OR v_invitation.expires_at <= now()
    OR v_invitation.email <> v_email THEN
    RAISE EXCEPTION 'invalid_or_expired_invitation' USING ERRCODE = '42501';
  END IF;

  SELECT person.full_name
  INTO v_full_name
  FROM public.company_people person
  WHERE person.id = v_invitation.person_id;

  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    app_role
  ) VALUES (
    p_user_id,
    v_email,
    v_full_name,
    'client'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    updated_at = now();

  UPDATE public.company_people
  SET
    user_id = p_user_id,
    updated_at = now()
  WHERE id = v_invitation.person_id
    AND (user_id IS NULL OR user_id = p_user_id);

  IF NOT FOUND THEN
    RAISE EXCEPTION 'person_already_linked' USING ERRCODE = '23505';
  END IF;

  INSERT INTO public.project_memberships (
    project_id,
    user_id,
    person_id,
    role,
    status,
    added_by
  ) VALUES (
    v_invitation.project_id,
    p_user_id,
    v_invitation.person_id,
    v_invitation.role,
    'active',
    v_invitation.created_by
  )
  ON CONFLICT (project_id, user_id) DO UPDATE
  SET
    person_id = EXCLUDED.person_id,
    role = EXCLUDED.role,
    status = 'active',
    revoked_at = NULL;

  UPDATE public.project_invitations
  SET
    status = 'accepted',
    accepted_by = p_user_id,
    accepted_at = now()
  WHERE id = v_invitation.id;

  INSERT INTO public.project_events (
    project_id,
    event_type,
    actor_user_id,
    idempotency_key,
    payload
  ) VALUES (
    v_invitation.project_id,
    'invitation_accepted',
    p_user_id,
    'invitation-accepted:' || v_invitation.id::text,
    jsonb_build_object('invitation_id', v_invitation.id)
  );

  RETURN jsonb_build_object(
    'invitation_id', v_invitation.id,
    'company_id', v_invitation.company_id,
    'project_id', v_invitation.project_id,
    'role', v_invitation.role
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_project_invitation(
  UUID, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ
) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.create_project_invitation(
  UUID, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ
) TO authenticated;

REVOKE ALL ON FUNCTION public.create_company_project(
  UUID, UUID, TEXT, TEXT, TEXT
) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.create_company_project(
  UUID, UUID, TEXT, TEXT, TEXT
) TO authenticated;

REVOKE ALL ON FUNCTION public.accept_project_invitation(
  TEXT, UUID, TEXT
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.accept_project_invitation(
  TEXT, UUID, TEXT
) TO service_role;

COMMENT ON TABLE public.project_invitations IS
  'Single-use project invitations. Only SHA-256 token hashes are stored.';
COMMENT ON TABLE public.project_events IS
  'Append-only audit events. Browser-facing roles have read-only access.';
