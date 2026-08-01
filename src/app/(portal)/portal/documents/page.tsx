import Link from "next/link";
import { requirePortalIdentity } from "@/features/portal/auth/session";
import { formatPortalDateTime } from "@/features/portal/workflow/format";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listClientProjects } from "@/server/repositories/portal.repository";
import { listProjectDocuments } from "@/server/repositories/document.repository";
import type { DocumentVersionSnapshot } from "@/server/repositories/document.repository";

export default async function PortalDocumentsPage() {
  const identity = await requirePortalIdentity();
  const supabase = await createServerSupabaseClient();
  const projects = await listClientProjects(supabase, identity.userId);
  const documents = await listProjectDocuments(
    supabase,
    projects.map((project) => project.id)
  );
  const projectNames = new Map(
    projects.map((project) => [project.id, project.name])
  );
  const publishedVersions = documents
    .flatMap((document): DocumentVersionSnapshot[] => [...document.versions])
    .filter((version) => version.status === "published")
    .sort(
      (left, right) =>
        Date.parse(right.publishedAt ?? right.createdAt) -
        Date.parse(left.publishedAt ?? left.createdAt)
    );

  return (
    <main id="main-content" className="portal-main">
      <div className="portal-page-heading">
        <p className="portal-eyebrow">מסמכים</p>
        <h1>מסמכי הפרויקט</h1>
        <p>
          כאן נשמרת הגרסה המדויקת שפורסמה עבורך. קובץ ה־PDF והתצוגה באתר
          מופקים מאותו תוכן.
        </p>
      </div>

      {publishedVersions.length === 0 ? (
        <section className="portal-empty-state" aria-labelledby="documents-empty-title">
          <p className="portal-eyebrow">עדיין אין מסמך לצפייה</p>
          <h2 id="documents-empty-title">המסמך הראשון נמצא בהכנה</h2>
          <p>
            לאחר ש־SYSTEMIZE יפרסמו סיכום או הצעה, הם יופיעו כאן עם מספר
            גרסה וקובץ PDF תואם.
          </p>
        </section>
      ) : (
        <ul className="portal-document-list" aria-label="מסמכים שפורסמו">
          {publishedVersions.map((version) => (
            <li key={version.id}>
              <div>
                <p className="portal-eyebrow">
                  {projectNames.get(version.projectId) ?? "פרויקט"}
                </p>
                <h2>{version.content.title}</h2>
                <p>
                  גרסה {version.versionNumber} · פורסמה{" "}
                  {version.publishedAt
                    ? formatPortalDateTime(version.publishedAt)
                    : ""}
                </p>
              </div>
              <div className="portal-document-actions">
                <Link
                  href={`/portal/documents/${version.id}`}
                  className="portal-primary-action"
                >
                  צפייה במסמך
                </Link>
                <a
                  href={`/api/documents/${version.id}/pdf`}
                  className="portal-secondary-action"
                >
                  הורדת PDF
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
