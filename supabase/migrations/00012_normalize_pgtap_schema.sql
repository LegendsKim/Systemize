-- Older hosted projects may already have pgTAP in `public`. Normalize it to the
-- schema used by the repository test search_path without guessing its current home.
DO $$
DECLARE
  current_schema TEXT;
BEGIN
  SELECT namespace.nspname
  INTO current_schema
  FROM pg_extension extension
  JOIN pg_namespace namespace ON namespace.oid = extension.extnamespace
  WHERE extension.extname = 'pgtap';

  IF current_schema IS DISTINCT FROM 'extensions' THEN
    ALTER EXTENSION pgtap SET SCHEMA extensions;
  END IF;
END;
$$;
