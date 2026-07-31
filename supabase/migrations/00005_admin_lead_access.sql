-- ============================================================================
-- 00005_admin_lead_access.sql
--
-- Opens `public.leads` to exactly one reader: the signed-in SYSTEMIZE owner.
--
-- 00002 deliberately left `leads` deny-by-default with no policies and no grant
-- to `authenticated`, because at that time the site had no authentication at all
-- and the Supabase dashboard was the only lead-reading surface that existed. The
-- portal has since introduced an authenticated owner role
-- (00003_portal_foundation.sql), so the console can now hold the leads screen
-- and the dashboard stops being the only way to see who asked to be contacted.
--
-- What does NOT change:
--   * The write path stays service-role only, through
--     src/server/repositories/lead.repository.ts. `authenticated` gets SELECT and
--     nothing else, so the console cannot edit or destroy a lead.
--   * No role is granted UPDATE or DELETE. Retention remains a manual owner
--     action performed by the table owner.
--   * `anon` remains revoked and unpolicied. A public visitor's reach into this
--     table is still limited to inserting their own submission via the server.
-- ============================================================================

GRANT SELECT ON TABLE public.leads TO authenticated;

-- The predicate is the same owner check the rest of the console authorizes on, so
-- there is one definition of "is this the SYSTEMIZE owner" rather than a second
-- one that can drift. A client with a portal session matches no rows here.
CREATE POLICY leads_owner_read
ON public.leads
FOR SELECT
TO authenticated
USING (private.is_systemize_owner());

COMMENT ON TABLE public.leads IS
    'Lead submissions from the public Blueprint form. Contains PII (name, business name, phone, email, free text). Readable by the SYSTEMIZE owner only, through the authenticated console or the Supabase dashboard. Inserted by service_role; no application role may update or delete a row.';
