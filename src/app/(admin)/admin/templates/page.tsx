import { requireSystemizeOwner } from "@/features/portal/auth/session";

export default async function TemplatesPage() {
  await requireSystemizeOwner();

  return (
    <main id="main-content" className="admin-page">
      <div className="admin-page-head">
        <div>
          <p className="admin-eyebrow">מסמכים</p>
          <h1>תבניות</h1>
          <p>תבניות סיכום שיחת ההיכרות והחוזה, לשימוש חוזר בכל פרויקט.</p>
        </div>
      </div>

      <section className="admin-section">
        <div className="admin-empty">
          <span className="admin-empty-index">בפיתוח</span>
          <h2>התבניות עוד לא זמינות</h2>
          <p>
            תבנית סיכום שיחת ההיכרות ותבנית החוזה עדיין בבנייה. עד שיהיו כאן,
            המסמכים מנוהלים ידנית בכל פרויקט בנפרד.
          </p>
        </div>
      </section>
    </main>
  );
}
