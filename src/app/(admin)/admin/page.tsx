import Link from "next/link";
import { projectStageLabels } from "@/features/portal/project-stage";
import { derivePortalActionsForProjects } from "@/features/portal/workflow/action-inputs";
import { countRequiredActions } from "@/features/portal/workflow/pending-actions";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listOwnerProjects } from "@/server/repositories/portal.repository";
import { listProjectWorkflows } from "@/server/repositories/workflow.repository";
import { listProjectDocuments } from "@/server/repositories/document.repository";

const integrationNotices: Record<string, string> = {
  "google-calendar-connected":
    "Google Calendar חובר בהצלחה. זימוני הפגישות יישלחו אוטומטית.",
  "google-calendar-account-mismatch":
    "יש לחבר את אותו חשבון Gmail שמוגדר כבעלים של SYSTEMIZE.",
  "google-calendar-state-invalid":
    "בקשת החיבור פגה או אינה תקינה. אפשר להתחיל את החיבור מחדש.",
  "google-calendar-connect-failed":
    "חיבור Google Calendar לא הושלם. אפשר לנסות שוב.",
  "google-calendar-store-failed":
    "ההרשאה התקבלה אך לא נשמרה. אפשר לנסות שוב.",
  "google-calendar-forbidden": "רק חשבון הבעלים יכול לחבר את היומן.",
};

interface AdminHomePageProps {
  readonly searchParams: Promise<{ notice?: string }>;
}

export default async function AdminHomePage({ searchParams }: AdminHomePageProps) {
  const query = await searchParams;
  const supabase = await createServerSupabaseClient();
  const projects = await listOwnerProjects(supabase);
  const projectIds = projects.map((project) => project.id);
  const [workflows, documents] = await Promise.all([
    listProjectWorkflows(supabase, projectIds),
    listProjectDocuments(supabase, projectIds),
  ]);

  /*
   * The operator's "what needs me" and the client's "what needs you" are two readings of
   * one derivation. Computing them separately is how the two surfaces start disagreeing
   * about whose move it is, which is precisely the confusion this portal exists to end.
   */
  const actions = derivePortalActionsForProjects(
    projects,
    workflows,
    new Date(),
    documents
  );
  const waitingOnMe = countRequiredActions(actions, "systemize");
  const waitingOnClients = countRequiredActions(actions, "client");
  const upcomingMeetings = [...workflows.values()].filter((workflow) =>
    workflow.meetingSlots.some((slot) => slot.status === "booked")
  ).length;

  /*
   * Every tile links to where the work is done. A count an operator cannot follow is a
   * count they have to locate again by hand, which is the cost this screen exists to
   * remove. `attention` is reserved for "this is waiting on you", never for "this number
   * is large": an alarm that fires on volume stops being read.
   */
  const metrics = [
    {
      label: "פרויקטים פעילים",
      value: projects.length,
      note: "בכל שלבי התהליך",
      attention: false,
    },
    {
      label: "ממתין לך",
      value: waitingOnMe,
      note: waitingOnMe ? "פעולות שדורשות החלטה שלך" : "אין פעולה פתוחה מצדך",
      attention: waitingOnMe > 0,
    },
    {
      label: "פגישות שנקבעו",
      value: upcomingMeetings,
      note: upcomingMeetings ? "מועדים ששוריינו" : "אין מועדים פתוחים",
      attention: false,
    },
    {
      label: "ממתין ללקוחות",
      value: waitingOnClients,
      note: waitingOnClients ? "פעולות בצד הלקוח" : "אין פעולות פתוחות בצד הלקוח",
      attention: false,
    },
  ] as const;

  return (
    <main id="main-content" className="admin-page">
      <div className="admin-page-head">
        <div>
          <p className="admin-eyebrow">סקירה</p>
          <h1>מה דורש ממך פעולה</h1>
          <p>
            תמונת מצב של כל תהליכי הלקוחות הפעילים, מסודרת לפי מה שממתין לך.
          </p>
        </div>
        <Link href="/admin/companies" className="admin-button">
          יצירת לקוח ופרויקט
        </Link>
      </div>

      {query.notice && integrationNotices[query.notice] && (
        <p className="workflow-notice" role="status">
          {integrationNotices[query.notice]}
        </p>
      )}

      <p>
        <a
          href="/api/integrations/google/connect"
          className="admin-button"
          data-variant="secondary"
        >
          חיבור או רענון Google Calendar
        </a>
      </p>

      <section className="admin-stats" aria-label="מדדי תפעול">
        {metrics.map((metric) => (
          <Link
            key={metric.label}
            href="#projects"
            className="admin-stat"
            data-attention={metric.attention || undefined}
          >
            <span className="admin-stat-label">
              {metric.label}
              {/*
                A status colour must never be the only thing carrying the meaning, so the
                amber arrives with a glyph and with the note underneath naming what is
                waiting. A coloured dot on its own is neither of those.
              */}
              {metric.attention && (
                <svg
                  className="admin-stat-flag"
                  viewBox="0 0 16 16"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path
                    d="M8 1.8 14.6 13H1.4L8 1.8Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8 6.2v3.1"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <circle cx="8" cy="11.1" r="0.85" fill="currentColor" />
                </svg>
              )}
            </span>
            <strong className="admin-stat-value">{metric.value}</strong>
            <span className="admin-stat-note">{metric.note}</span>
          </Link>
        ))}
      </section>

      {projects.length === 0 ? (
        <section className="admin-section">
          <div className="admin-empty">
            <h2>מתחילים מהזמנה אחת מסודרת</h2>
            <p>
              צור לקוח פוטנציאלי ופרויקט. המערכת תפיק קישור הזמנה אישי, תוביל את
              הלקוח בשאלון ההיכרות, ותחזיר אותך לכאן כשיהיה משהו להחליט.
            </p>
            <Link href="/admin/companies" className="admin-button">
              יצירת הלקוח הראשון
            </Link>
          </div>
        </section>
      ) : (
        <section
          id="projects"
          className="admin-section"
          aria-labelledby="projects-title"
        >
          <div className="admin-section-head">
            <h2 id="projects-title">תהליכי לקוחות</h2>
            <p>{projects.length} פרויקטים · ממוינים לפי סדר יצירה</p>
          </div>

          {/*
            A table, not a stack of cards. The rows differ only in their values, which is
            exactly the case where shared column headers explain once instead of every row
            repeating its own labels. `tabIndex` plus the region role make the horizontal
            overflow reachable from the keyboard on a narrow window.
          */}
          <div
            className="admin-table-scroll"
            role="region"
            aria-labelledby="projects-title"
            tabIndex={0}
          >
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">לקוח</th>
                  <th scope="col">שלב</th>
                  <th scope="col">הפעולה הבאה</th>
                  <th scope="col">התקדמות</th>
                  <th scope="col">
                    <span className="admin-sr-only">פעולות</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => {
                  const projectActions = actions.filter(
                    (item) => item.projectId === project.id
                  );

                  /*
                   * Who owns the next move. That ownership is the only thing an operator
                   * is really scanning this column for, so an action of theirs wins the
                   * row even when the client also has one open.
                   */
                  const mine = projectActions.find(
                    (item) => item.owner === "systemize" && item.urgency === "now"
                  );
                  const theirs = projectActions.find(
                    (item) => item.owner === "client"
                  );
                  const needsOwner = Boolean(mine);
                  const next = mine ?? theirs;
                  const action = next
                    ? {
                        title: next.title,
                        detail: needsOwner
                          ? next.detail
                          : `ממתין ללקוח · ${next.cta}`,
                      }
                    : {
                        title: "ממתין לכניסת הלקוח",
                        detail: "ההזמנה נשלחה, טרם נעשה בה שימוש",
                      };

                  return (
                    <tr key={project.id} data-attention={needsOwner || undefined}>
                      <td>
                        <div className="admin-cell-client">
                          <span className="admin-avatar" aria-hidden="true">
                            {project.companyName.charAt(0)}
                          </span>
                          <div>
                            <strong>{project.companyName}</strong>
                            <small>{project.name}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="admin-chip">
                          {projectStageLabels[project.stage]}
                        </span>
                      </td>
                      <td>
                        <div
                          className="admin-cell-action"
                          data-attention={needsOwner || undefined}
                        >
                          <strong>{action.title}</strong>
                          <small>{action.detail}</small>
                        </div>
                      </td>
                      <td>
                        <div className="admin-progress">
                          <span>{project.progressPercent}%</span>
                          <div
                            role="progressbar"
                            aria-label={`התקדמות ${project.name}`}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={project.progressPercent}
                          >
                            <span
                              style={{
                                inlineSize: `${project.progressPercent}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="admin-cell-end">
                        <Link
                          href={`/admin/projects/${project.id}`}
                          className="admin-button"
                          data-variant="secondary"
                        >
                          פתיחה
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
