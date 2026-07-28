/**
 * A visual preview of the client workspace in its two useful states.
 *
 * This is deliberately not a dashboard screenshot or a table. The visitor needs to
 * understand the relationship between the commercial decision and the build, not inspect
 * imaginary software chrome. The two cards therefore show what becomes available before
 * approval and what opens after it.
 *
 * A Server Component.
 */

import "../workspace.css";

const beforeApproval = [
  {
    index: "01",
    title: "חוזה ברור",
    description: "היקף העבודה, האחריות ותנאי ההתקשרות בשפה שאפשר להבין.",
  },
  {
    index: "02",
    title: "שאלון והעדפות",
    description: "שאלות מסודרות על המשתמשים, המסכים, ההרשאות, ההטמעה והשירות.",
  },
  {
    index: "03",
    title: "אפשרויות לבחירה",
    description: "מספר מסלולי ביצוע, ולכל אחד היקף, זמן, מחיר ותנאי תשלום.",
  },
] as const;

const projectUpdates = [
  {
    status: "הושלם",
    title: "אפיון ודרישות",
    description: "הגרסה שאישרתם נשמרת וזמינה תמיד.",
  },
  {
    status: "בתהליך",
    title: "בניית המערכת",
    description: "רואים מה בעבודה ומה צפוי להגיע לבדיקה.",
  },
  {
    status: "פתוח",
    title: "הערות ועדכונים",
    description: "כל שינוי מתועד, ואפשר להגיב בדיוק במקום הרלוונטי.",
  },
] as const;

export function DiagnosticOffer() {
  return (
    <section
      id="diagnostic"
      className="workspace-section"
      aria-labelledby="diagnostic-heading"
    >
      <div className="workspace-inner">
        <header className="workspace-intro">
          <p className="workspace-kicker">הכול במקום אחד</p>
          <h2 id="diagnostic-heading">האזור האישי מתחיל עוד לפני הפיתוח.</h2>
          <p>
            אחרי שיחת ההיכרות לא תקבלו שרשור מיילים ורשימת קבצים לחפש. תקבלו
            הזמנה למקום אחד שבו בוחרים איך להתקדם — ואחר כך עוקבים אחרי המערכת
            עד שהיא עובדת אצלכם.
          </p>
        </header>

        <div className="workspace-journey">
          <article className="workspace-card workspace-card-choice">
            <div className="workspace-card-header">
              <div>
                <p className="workspace-step">אחרי שיחת ההיכרות</p>
                <h3>מבינים, בוחרים ומאשרים</h3>
              </div>
              <span className="workspace-state">לפני התחלה</span>
            </div>

            <ol className="workspace-choice-list">
              {beforeApproval.map((item) => (
                <li key={item.index}>
                  <span className="workspace-index" aria-hidden="true">
                    {item.index}
                  </span>
                  <div>
                    <h4>{item.title}</h4>
                    <p>{item.description}</p>
                  </div>
                </li>
              ))}
            </ol>

            <p className="workspace-card-note">
              רק אחרי שבחרתם אפשרות, אישרתם את החוזה והשלמתם את התשלום — הפרויקט
              נפתח.
            </p>
          </article>

          <div className="workspace-transition" aria-hidden="true">
            <span />
            <strong>אישור</strong>
            <span />
          </div>

          <article className="workspace-card workspace-card-project">
            <div className="workspace-card-header">
              <div>
                <p className="workspace-step">אחרי האישור והתשלום</p>
                <h3>רואים את הפרויקט מתקדם</h3>
              </div>
              <span className="workspace-state workspace-state-active">פעיל</span>
            </div>

            <div className="workspace-project-overview">
              <div>
                <span>השלב הנוכחי</span>
                <strong>פיתוח המערכת</strong>
              </div>
              <p>העדכון הבא וכל החלטה שמחכה לכם מופיעים כאן, בלי לרדוף אחרי אף אחד.</p>
            </div>

            <ul className="workspace-update-list">
              {projectUpdates.map((update) => (
                <li key={update.title}>
                  <span className="workspace-update-status">{update.status}</span>
                  <div>
                    <h4>{update.title}</h4>
                    <p>{update.description}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="workspace-contact">
              <span aria-hidden="true">↗</span>
              <p>
                כותבים הערה על עדכון, שולחים בקשת שירות — או פשוט מתקשרים.
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
