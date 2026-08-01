-- ============================================================================
-- 00009_internal_project_notes.sql
--
-- The operator's private read on a project: impression, budget signal,
-- readiness, risks, and red flags.
--
-- This is the second of the two layers the delivery model needs after an
-- introductory call. The first — `introductory_summary` in
-- 00008_versioned_documents.sql — is written *for* the client and proves they
-- were heard. This one is written *about* the engagement and must never reach
-- them: it is where "the budget they named is half of what this costs" and "the
-- decision maker was not in the room" get recorded honestly.
--
-- The separation is enforced by the database, not by discipline. A client owner
-- with an active membership matches no row here, so there is no query, no view,
-- and no future page that can surface it to them by accident.
--
-- These notes are deliberately NOT a document version:
--   * They are working memory, revised freely as the relationship develops.
--     Versioned documents are immutable evidence, which is the opposite need.
--   * A document version is readable by project members once published. Making
--     internal notes a document kind would put owner-only content one policy
--     mistake away from the client's screen.
-- ============================================================================

CREATE TYPE public.project_readiness AS ENUM (
  'unknown',
  'low',
  'medium',
  'high'
);

CREATE TABLE public.project_internal_notes (
  -- The project is the key: one living note per engagement, not an append-only log.
  project_id UUID PRIMARY KEY REFERENCES public.projects(id) ON DELETE RESTRICT,
  impression TEXT NOT NULL DEFAULT ''
    CONSTRAINT project_internal_notes_impression_length
    CHECK (char_length(impression) <= 4000),
  budget_signal TEXT NOT NULL DEFAULT ''
    CONSTRAINT project_internal_notes_budget_length
    CHECK (char_length(budget_signal) <= 2000),
  readiness public.project_readiness NOT NULL DEFAULT 'unknown',
  risks TEXT NOT NULL DEFAULT ''
    CONSTRAINT project_internal_notes_risks_length
    CHECK (char_length(risks) <= 4000),
  flags TEXT NOT NULL DEFAULT ''
    CONSTRAINT project_internal_notes_flags_length
    CHECK (char_length(flags) <= 4000),
  updated_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER project_internal_notes_touch_updated_at
BEFORE UPDATE ON public.project_internal_notes
FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

ALTER TABLE public.project_internal_notes ENABLE ROW LEVEL SECURITY;

-- `service_role` is in the revoke for the reason 00002_leads.sql documents: Supabase's
-- default privileges hand every new public table to it in full, TRUNCATE included, and
-- it is BYPASSRLS. Nothing in the application reads or writes these notes on the
-- service-role client, so leaving that grant in place would be standing permission to
-- destroy the table for no feature's benefit.
REVOKE ALL ON TABLE public.project_internal_notes
  FROM PUBLIC, anon, authenticated, service_role;

-- No DELETE. A note that recorded a risk is worth keeping even after the risk
-- passed, and nothing in the console offers to destroy one.
GRANT SELECT, INSERT, UPDATE ON TABLE public.project_internal_notes
  TO authenticated;

CREATE POLICY project_internal_notes_owner_all
ON public.project_internal_notes
FOR ALL
TO authenticated
USING (private.is_systemize_owner())
WITH CHECK (private.is_systemize_owner() AND updated_by = auth.uid());

COMMENT ON TABLE public.project_internal_notes IS
  'Owner-only working notes about an engagement: impression, budget signal, readiness, risks, flags. Never rendered to a client, never copied into a document version, a PDF, or a notification body.';
COMMENT ON COLUMN public.project_internal_notes.readiness IS
  'How ready the prospect looks to commit. A scannable signal for the console, not a client-facing score.';
