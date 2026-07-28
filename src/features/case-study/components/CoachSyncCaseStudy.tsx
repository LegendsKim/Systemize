import "../case-study.css";

/**
 * One concrete proof point instead of a catalogue of generic capabilities.
 *
 * The miniature interface is illustrative, but every product decision described here is
 * grounded in the real CoachSync project. No athlete names, club data, performance data,
 * or other private information is shown.
 *
 * A Server Component.
 */
export function CoachSyncCaseStudy() {
  return (
    <section
      id="case-study"
      className="case-study"
      aria-labelledby="case-study-heading"
    >
      <div className="case-study-inner">
        <header className="case-study-intro">
          <p className="case-study-kicker">מערכת אחת. עסק אחד.</p>
          <h2 id="case-study-heading">
            CoachSync נבנתה סביב הדרך שבה מועדון ג׳ודו באמת עובד.
          </h2>
          <p>
            לא לקחנו מערכת מדף והחלפנו לה צבעים. בנינו שתי חוויות שונות שמחוברות
            לאותו מידע: אחת לספורטאים צעירים, ואחת למאמן שמנהל את המועדון.
          </p>
        </header>

        <div className="case-study-proof">
          <div className="case-study-decisions">
            <article>
              <span aria-hidden="true">01</span>
              <div>
                <h3>לספורטאי — פעולה יומית קצרה</h3>
                <p>
                  עדכון אימון, תחושה ומשקל בחוויה מהירה שמותאמת לטלפון, במקום טפסים
                  שאף אחד לא רוצה למלא.
                </p>
              </div>
            </article>

            <article>
              <span aria-hidden="true">02</span>
              <div>
                <h3>למאמן — החלטה, לא עוד נתונים</h3>
                <p>
                  הספורטאים שדורשים תשומת לב עולים ראשונים, יחד עם אימונים, תוכניות
                  ותחרויות שרלוונטיים לעבודה באותו יום.
                </p>
              </div>
            </article>

            <article>
              <span aria-hidden="true">03</span>
              <div>
                <h3>למועדון — כל התהליך במקום אחד</h3>
                <p>
                  הזמנות, הרשאות, אישורי הורים, תוכניות אימון, מעקב תחרויות והיסטוריה
                  נבנו כחלק מאותה מערכת — לפי מי שעובד בה.
                </p>
              </div>
            </article>
          </div>

          <div className="case-study-product" aria-label="המחשה של מערכת CoachSync">
            <div className="case-study-product-bar">
              <div>
                <span className="case-study-product-mark" aria-hidden="true" />
                <strong dir="ltr">COACHSYNC</strong>
              </div>
              <span>מערכת מותאמת למועדון</span>
            </div>

            <div className="case-study-screens">
              <section className="case-study-screen case-study-screen-athlete">
                <p>חוויית הספורטאי</p>
                <h3>מה עשית היום?</h3>
                <div className="case-study-story-progress" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
                <div className="case-study-choice-row">
                  <span>אימון אישי</span>
                  <strong>הושלם</strong>
                </div>
                <div className="case-study-choice-row">
                  <span>איך הגוף מרגיש?</span>
                  <strong>טוב</strong>
                </div>
              </section>

              <section className="case-study-screen case-study-screen-coach">
                <p>תמונת המאמן</p>
                <h3>מי צריך תשומת לב היום?</h3>
                <div className="case-study-athlete-row">
                  <span className="case-study-avatar">א</span>
                  <div>
                    <strong>דורש בדיקה</strong>
                    <small>עומס גבוה לפני תחרות</small>
                  </div>
                  <b>01</b>
                </div>
                <div className="case-study-athlete-row">
                  <span className="case-study-avatar">ב</span>
                  <div>
                    <strong>הכול תקין</strong>
                    <small>עדכון יומי הושלם</small>
                  </div>
                  <b>✓</b>
                </div>
              </section>
            </div>

            <p className="case-study-product-caption">
              אותה מערכת. ממשק אחר לכל מי שעובד בה.
            </p>
          </div>
        </div>

        <footer className="case-study-footer">
          <p>
            זאת המשמעות של מערכת תפורה לעסק: לא “איזה פיצ׳רים יש”, אלא איך האנשים
            בעסק צריכים לעבוד.
          </p>
          <a href="#process">לראות איך בונים מערכת כזאת</a>
        </footer>
      </div>
    </section>
  );
}
