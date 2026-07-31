-- pgTAP powers `supabase test db --linked`. Hosted projects do not enable it
-- automatically, so keep the test runner in the conventional extensions schema.
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

COMMENT ON EXTENSION pgtap IS
  'Database contract test runner used by local, CI, and linked-project verification.';
