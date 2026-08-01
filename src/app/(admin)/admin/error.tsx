"use client";
// This boundary provides recovery interaction for authenticated provider failures.

export default function AdminError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main id="main-content" className="admin-page">
      <div className="admin-page-head">
        <div>
          <p className="admin-eyebrow">שגיאה</p>
          <h1>לא הצלחנו לטעון את סביבת הניהול</h1>
        </div>
      </div>
      <section className="admin-section">
        <div className="admin-empty">
          <p role="alert">
            השירות לא הגיב כמצופה. לא בוצע שינוי במידע ולא נשלחה הודעה לאף לקוח.
          </p>
          <button type="button" className="admin-button" onClick={reset}>
            ניסיון נוסף
          </button>
        </div>
      </section>
    </main>
  );
}
