import Link from "next/link";
import { requirePortalIdentity } from "@/features/portal/auth/session";
import { derivePortalActionsForProjects } from "@/features/portal/workflow/action-inputs";
import {
  actionsFor,
  countRequiredActions,
} from "@/features/portal/workflow/pending-actions";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listClientProjects } from "@/server/repositories/portal.repository";
import { listProjectWorkflows } from "@/server/repositories/workflow.repository";
import { listProjectDocuments } from "@/server/repositories/document.repository";

export default async function PortalActionsPage() {
  const identity = await requirePortalIdentity();
  const supabase = await createServerSupabaseClient();
  const projects = await listClientProjects(supabase, identity.userId);
  const projectIds = projects.map((project) => project.id);
  const [workflows, documents] = await Promise.all([
    listProjectWorkflows(supabase, projectIds),
    listProjectDocuments(supabase, projectIds),
  ]);

  /*
   * `now` is read once and threaded through the derivation, so every row on this page
   * agrees about which meeting slots are still in the future. Reading the clock per
   * comparison would let a slot expire mid-render.
   */
  const actions = derivePortalActionsForProjects(
    projects,
    workflows,
    new Date(),
    documents
  );
  const clientActions = actionsFor(actions, "client");
  const requiredNow = clientActions.filter((action) => action.urgency === "now");
  const inProgress = clientActions.filter(
    (action) => action.urgency !== "now"
  );
  const ourActions = actionsFor(actions, "systemize");
  const requiredCount = countRequiredActions(actions, "client");

  return (
    <main id="main-content" className="portal-main">
      <div className="portal-page-heading">
        <p className="portal-eyebrow">פעולות</p>
        <h1>מה מחכה לך עכשיו</h1>
        <p>
          {requiredCount === 0
            ? "אין כרגע אישורים, שאלות או חתימות שממתינים לפעולה שלך."
            : requiredCount === 1
              ? "פעולה אחת ממתינה לך. אחריה נמשיך מכאן."
              : `${requiredCount} פעולות ממתינות לך.`}
        </p>
      </div>

      {projects.length === 0 ? (
        <section className="portal-empty-state">
          <p className="portal-card-company">החשבון פעיל</p>
          <h2>הפרויקט עדיין בהקמה</h2>
          <p>
            ברגע שהשיוך יושלם, כל פעולה שתידרש ממך תופיע כאן ובדף הבית.
          </p>
          <Link href="/portal" className="portal-secondary-action">
            חזרה לדף הבית
          </Link>
        </section>
      ) : (
        <>
          <section
            className="portal-action-section"
            aria-labelledby="required-actions-title"
          >
            <div className="portal-section-heading">
              <div>
                <p className="portal-eyebrow">ממתין לך</p>
                <h2 id="required-actions-title">פעולות שדורשות אותך</h2>
              </div>
            </div>

            {requiredNow.length === 0 ? (
              <p className="portal-action-empty">
                אין פעולה פתוחה מצדך. אנחנו נעדכן כאן ברגע שיהיה צורך במשהו.
              </p>
            ) : (
              <ul className="portal-action-list">
                {requiredNow.map((action) => (
                  <li
                    key={action.id}
                    className="portal-action-card portal-action-card-featured"
                  >
                    <div className="portal-action-card-head">
                      <span className="portal-status-chip">ממתין לך</span>
                      <p className="portal-card-company">
                        {action.companyName} · {action.projectName}
                      </p>
                    </div>
                    <h3>{action.title}</h3>
                    <p>{action.detail}</p>
                    <Link
                      href={action.clientHref}
                      className="portal-primary-action"
                    >
                      {action.cta}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {(inProgress.length > 0 || ourActions.length > 0) && (
            <section
              className="portal-action-section"
              aria-labelledby="waiting-actions-title"
            >
              <div className="portal-section-heading">
                <div>
                  <p className="portal-eyebrow">בטיפול שלנו</p>
                  <h2 id="waiting-actions-title">מה קורה במקביל</h2>
                </div>
              </div>
              <ul className="portal-action-list">
                {[...inProgress, ...ourActions].map((action) => (
                  <li key={action.id} className="portal-action-card">
                    <div className="portal-action-card-head">
                      <span className="portal-status-chip" data-tone="calm">
                        {action.owner === "client" ? "מתקדם" : "בטיפול SYSTEMIZE"}
                      </span>
                      <p className="portal-card-company">
                        {action.companyName} · {action.projectName}
                      </p>
                    </div>
                    <h3>{action.title}</h3>
                    <p>
                      {action.owner === "client"
                        ? action.detail
                        : "אין צורך בפעולה מצדך. נעדכן אותך כאן כשנתקדם."}
                    </p>
                    <Link href={action.clientHref} className="portal-text-link">
                      צפייה בתמונת המצב
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </main>
  );
}
