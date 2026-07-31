-- Passwordless linked CLI commands use Supabase's managed login role rather
-- than the database owner. Grant only schema discovery so pg_prove can execute
-- the pgTAP functions; no application/browser role receives this privilege.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'cli_login_postgres') THEN
    GRANT USAGE ON SCHEMA extensions TO cli_login_postgres;
  END IF;
END;
$$;
