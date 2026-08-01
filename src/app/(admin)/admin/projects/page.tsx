import Link from "next/link";
import { requireSystemizeOwner } from "@/features/portal/auth/session";
import { projectStageLabels } from "@/features/portal/project-stage";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listOwnerProjects } from "@/server/repositories/portal.repository";

export default async function AdminProjectsPage() {
  await requireSystemizeOwner();
  const supabase = await createServerSupabaseClient();
  const projects = await listOwnerProjects(supabase);

  return (
    <main id="main-content" className="admin-page">
      <div className="admin-page-head">
        <div>
          <p className="admin-eyebrow">תפעול</p>
          <h1>פרויקטים</h1>
          <p>כל פרויקט, השלב הנוכחי והגישה הישירה למרחב העבודה שלו.</p>
        </div>
      </div>

      {projects.length === 0 ? (
        <section className="admin-section">
          <h2>עדיין אין פרויקטים</h2>
          <p>פרויקט חדש נוצר מתוך מסך החברות.</p>
          <Link href="/admin/companies" className="admin-button">
            מעבר לחברות
          </Link>
        </section>
      ) : (
        <section className="admin-section" aria-labelledby="all-projects-title">
          <div className="admin-section-head">
            <div>
              <h2 id="all-projects-title">כל הפרויקטים</h2>
              <p>{projects.length} פרויקטים פעילים ומועמדים.</p>
            </div>
          </div>
          <ul className="admin-project-directory">
            {projects.map((project) => (
              <li key={project.id}>
                <div>
                  <p className="admin-eyebrow">{project.companyName}</p>
                  <h3>{project.name}</h3>
                  <span>{projectStageLabels[project.stage]}</span>
                </div>
                <div className="admin-project-directory-progress">
                  <strong>{project.progressPercent}%</strong>
                  <span>התקדמות מאושרת</span>
                </div>
                <Link
                  href={`/admin/projects/${project.id}`}
                  className="admin-button"
                  data-variant="secondary"
                >
                  פתיחת הפרויקט
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
