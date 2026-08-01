import Link from "next/link";
import { requirePortalIdentity } from "@/features/portal/auth/session";
import { PortalArrival } from "@/features/portal/components/PortalArrival";
import { PortalOnboarding } from "@/features/portal/components/PortalOnboarding";
import { portalStageGuidance } from "@/features/portal/onboarding";
import { clientProjectStageLabels } from "@/features/portal/project-stage";
import { derivePortalActionsForProjects } from "@/features/portal/workflow/action-inputs";
import { actionsFor } from "@/features/portal/workflow/pending-actions";
import { getPublicEnv } from "@/lib/env/client";
import { contact } from "@/lib/site-config";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listClientProjects } from "@/server/repositories/portal.repository";
import { getPushSettingsSnapshot } from "@/server/repositories/push.repository";
import { listProjectWorkflows } from "@/server/repositories/workflow.repository";
import { listProjectDocuments } from "@/server/repositories/document.repository";

type PortalHomePageProps = {
  /** `welcome=1` is set by the OAuth callback on a fresh sign-in, and only then. */
  searchParams: Promise<{ welcome?: string }>;
};

export default async function PortalHomePage({
  searchParams,
}: PortalHomePageProps) {
  const identity = await requirePortalIdentity();
  const supabase = await createServerSupabaseClient();
  const { welcome: welcomeParam } = await searchParams;

  /*
   * The orientation takes the whole screen rather than sitting above the dashboard. A
   * client who has never seen the product does not need a project card and an explanation
   * competing for the same first glance, and it is shown exactly once — the profile
   * records that it was read.
   */
  if (!identity.onboardedAt && identity.appRole === "client") {
    const pushSnapshot = await getPushSettingsSnapshot(supabase, identity.userId);
    return (
      <main id="main-content" className="portal-main">
        {welcomeParam === "1" && (
          <PortalArrival
            firstName={identity.fullName.trim().split(" ")[0] ?? ""}
          />
        )}
        <PortalOnboarding
          firstName={identity.fullName.trim().split(" ")[0] ?? ""}
          publicKey={getPublicEnv().NEXT_PUBLIC_VAPID_PUBLIC_KEY}
          alreadySubscribed={pushSnapshot.devices.length > 0}
        />
      </main>
    );
  }

  const projects = await listClientProjects(supabase, identity.userId);
  const projectIds = projects.map((project) => project.id);
  const [workflows, documents] = await Promise.all([
    listProjectWorkflows(supabase, projectIds),
    listProjectDocuments(supabase, projectIds),
  ]);
  const welcome = welcomeParam;
  const supportHref = `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(
    "היי, נכנסתי לאזור האישי והפרויקט עדיין לא מופיע"
  )}`;

  /*
   * The home screen used to describe a project purely by its stage, which is coarse: a
   * request to complete the intake changes the intake's status and leaves the stage
   * exactly where it was. So the one screen the client actually opens stayed silent about
   * the one thing that needed them, and the request lived only on /portal/actions. Both
   * screens now read the same derivation.
   */
  const clientActions = actionsFor(
    derivePortalActionsForProjects(projects, workflows, new Date(), documents),
    "client"
  );
  const requiredNow = clientActions.filter((action) => action.urgency === "now");
  const requiredByProject = new Set(
    requiredNow.map((action) => action.projectId)
  );

  return (
    <main id="main-content" className="portal-main">
      {welcome === "1" && (
        <PortalArrival firstName={identity.fullName.trim().split(" ")[0] ?? ""} />
      )}
      <section className="portal-welcome" aria-labelledby="portal-welcome-title">
        <div className="portal-welcome-copy">
          <p className="portal-eyebrow">ברוך הבא ל־SYSTEMIZE</p>
          <h1 id="portal-welcome-title">טוב לראות אותך, {identity.fullName}</h1>
          <p>
            זה המקום שבו כל מה שקשור לפרויקט נשאר ברור: מה קורה עכשיו,
            מה מחכה לך ומה אנחנו עושים בהמשך.
          </p>
        </div>
        <aside className="portal-confidence-card" aria-label="המידע שלך במקום בטוח">
          <span className="portal-confidence-icon" aria-hidden="true">✓</span>
          <div>
            <strong>הגעת למקום הנכון</strong>
            <p>המידע כאן אישי, מאובטח וזמין רק למי ששויך לפרויקט.</p>
          </div>
        </aside>
      </section>

      {requiredNow.length > 0 && (
        <section
          className="portal-action-section portal-home-actions"
          aria-labelledby="home-required-title"
        >
          <div className="portal-section-heading">
            <div>
              <p className="portal-eyebrow">ממתין לך</p>
              <h2 id="home-required-title">
                {requiredNow.length === 1
                  ? "פעולה אחת ממתינה לך"
                  : `${requiredNow.length} פעולות ממתינות לך`}
              </h2>
            </div>
            <Link href="/portal/actions" className="portal-text-link">
              לכל הפעולות
            </Link>
          </div>
          <ul className="portal-action-list">
            {requiredNow.map((action) => (
              <li
                key={action.id}
                className="portal-action-card portal-action-card-featured"
              >
                <div className="portal-action-card-head">
                  <span className="portal-status-chip">ממתין לך</span>
                  <p className="portal-card-company">{action.projectName}</p>
                </div>
                <h3>{action.title}</h3>
                <p>{action.detail}</p>
                <Link href={action.clientHref} className="portal-primary-action">
                  {action.cta}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {projects.length === 0 ? (
        <section className="portal-empty-state">
          <p className="portal-card-company">החשבון הופעל בהצלחה</p>
          <h2>אנחנו מחברים את הפרויקט שלך</h2>
          <p>
            אין צורך להירשם שוב או למלא פרטים. ברגע שהשיוך יושלם, תמונת המצב
            תופיע כאן באופן אוטומטי.
          </p>
          <a
            href={supportHref}
            className="portal-secondary-action"
            target="_blank"
            rel="noopener noreferrer"
          >
            צריך עזרה? כתבו לנו
          </a>
        </section>
      ) : (
        <section id="projects" className="portal-projects-section" aria-labelledby="projects-title">
          <div className="portal-section-heading">
            <div>
              <p className="portal-eyebrow">תמונת מצב</p>
              <h2 id="projects-title">הפרויקטים שלך</h2>
            </div>
            <Link href="/portal/actions" className="portal-text-link">
              לכל הפעולות
            </Link>
          </div>
          <div className="portal-project-grid">
          {projects.map((project) => (
            <article key={project.id} className="portal-project-card">
              <div className="portal-card-topline">
                <span className="portal-status-chip">
                  {requiredByProject.has(project.id) ||
                  portalStageGuidance[project.stage].clientActionRequired
                    ? "ממתין לך"
                    : "בטיפול שלנו"}
                </span>
                <p className="portal-card-company">{project.companyName}</p>
              </div>
              <div>
                <h2>{project.name}</h2>
                <p className="portal-stage-label">
                  {clientProjectStageLabels[project.stage]}
                </p>
              </div>
              <div className="portal-next-step">
                <span>מה קורה עכשיו</span>
                <strong>{portalStageGuidance[project.stage].headline}</strong>
              </div>
              <div className="portal-project-status">
                <span>התקדמות מאושרת</span>
                <strong>{project.progressPercent}%</strong>
              </div>
              <div
                className="portal-progress-track"
                role="progressbar"
                aria-label={`התקדמות ${project.name}`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={project.progressPercent}
              >
                <span style={{ inlineSize: `${project.progressPercent}%` }} />
              </div>
              <Link
                href={`/portal/projects/${project.id}`}
                className="portal-primary-action"
              >
                לצפייה בתמונת המצב
              </Link>
            </article>
          ))}
          </div>
        </section>
      )}

      <section className="portal-orientation" aria-labelledby="orientation-title">
        <div className="portal-section-heading">
          <div>
            <p className="portal-eyebrow">איך עובדים כאן</p>
            <h2 id="orientation-title">שלושה דברים שכדאי להכיר</h2>
          </div>
        </div>
        <ol className="portal-orientation-grid">
          <li>
            <span aria-hidden="true">01</span>
            <strong>פעולות לפני הכול</strong>
            <p>אם נצטרך ממך אישור, תשובה או חתימה — זה תמיד יופיע במקום בולט.</p>
          </li>
          <li>
            <span aria-hidden="true">02</span>
            <strong>גרסה אחת מחייבת</strong>
            <p>מסמכים, החלטות ועדכונים נשמרים כאן, כדי שלא יהיה צורך לחפש בהודעות.</p>
          </li>
          <li>
            <span aria-hidden="true">03</span>
            <strong>תמיד ברור מי עושה מה</strong>
            <p>בכל שלב אפשר לראות מה בטיפול שלנו ומה דורש פעולה מצדך.</p>
          </li>
        </ol>
      </section>
    </main>
  );
}
