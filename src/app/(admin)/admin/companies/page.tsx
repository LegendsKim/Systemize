import { randomUUID } from "node:crypto";
import { CompanyProjectForm } from "@/features/portal/admin/CompanyProjectForm";
import { requireSystemizeOwner } from "@/features/portal/auth/session";

export default async function CompaniesPage() {
  await requireSystemizeOwner();

  return (
    <main id="main-content" className="admin-page">
      <div className="admin-page-head">
        <div>
          <p className="admin-eyebrow">חברות</p>
          <h1>לקוח ופרויקט חדשים</h1>
          <p>
            החברה והפרויקט הראשון נוצרים כפעולה אטומית אחת: או ששניהם נשמרים,
            או שאף אחד מהם לא. אין מצב ביניים של חברה בלי פרויקט.
          </p>
        </div>
      </div>

      <section className="admin-section" aria-labelledby="new-company-title">
        <div className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <h2 id="new-company-title">פרטי הלקוח</h2>
              <p>
                שני השדות מופיעים ללקוח באזור האישי שלו, אז כדאי לכתוב אותם
                כפי שהוא מזהה את עצמו.
              </p>
            </div>
          </div>
          <CompanyProjectForm idempotencyKey={randomUUID()} />
        </div>
      </section>
    </main>
  );
}
