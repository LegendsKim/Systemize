-- ============================================================================
-- 00016_invite_only_auth_admission.sql
--
-- Reject uninvited identities before Supabase Auth inserts auth.users.
-- Existing Auth users are intentionally left untouched for owner-managed cleanup.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.before_user_created_invite_only(event JSONB)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_email TEXT := lower(btrim(event->'user'->>'email'));
  v_provider TEXT := event->'user'->'app_metadata'->>'provider';
  v_allowed BOOLEAN := false;
BEGIN
  IF v_email IS NULL
    OR v_email !~ '^[^@[:space:]]+@gmail\.com$'
    OR char_length(v_email) NOT BETWEEN 11 AND 320
    OR v_provider IS DISTINCT FROM 'google' THEN
    RETURN jsonb_build_object(
      'error', jsonb_build_object(
        'http_code', 403,
        'message', 'This account is not eligible for access.'
      )
    );
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.profiles profile
    WHERE profile.email = v_email
      AND profile.app_role = 'systemize_owner'

    UNION ALL

    SELECT 1
    FROM public.project_invitations invitation
    WHERE invitation.email = v_email
      AND invitation.status = 'pending'
      AND invitation.expires_at > now()
  ) INTO v_allowed;

  IF v_allowed THEN
    RETURN '{}'::jsonb;
  END IF;

  RETURN jsonb_build_object(
    'error', jsonb_build_object(
      'http_code', 403,
      'message', 'This account is not eligible for access.'
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.before_user_created_invite_only(JSONB)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.before_user_created_invite_only(JSONB)
  TO supabase_auth_admin;

COMMENT ON FUNCTION public.before_user_created_invite_only(JSONB) IS
  'Supabase Before User Created hook: permits only the owner or a live invited Gmail identity.';
