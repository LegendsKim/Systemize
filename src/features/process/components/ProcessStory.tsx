import type { CSSProperties } from "react";
import { processStages } from "../process-content";

/**
 * The four delivery stages, told at full height.
 *
 * The section continues the hero's trail rather than restating it: the rule down the
 * marker column is the same line, and it fills as each stage passes. That gives a reader
 * a sense of position, how far along the process they are, without a progress widget.
 *
 * The first three stages end with a link to the next, so the section can be walked
 * deliberately instead of only scrolled past. The final stage closes the sequence.
 *
 * A Server Component. All of the motion is CSS scroll-driven animation behind a
 * `@supports` guard, so nothing here reaches the client bundle and an unsupporting
 * browser simply gets the finished layout.
 */
export function ProcessStory() {
  return (
    <section id="process" className="process-story" aria-labelledby="process-heading">
      <header className="process-intro">
        <p className="process-kicker">איך זה עובד</p>
        <h2 id="process-heading">מהשיחה הראשונה ועד מערכת שעובדת בעסק.</h2>
        <p>
          לא מקבלים הצעת מחיר מעורפלת ונעלמים לחודשים. מתחילים בהיכרות, עוברים
          לבחירה מסודרת באזור האישי, ובונים את המערכת בשקיפות עד שהצוות עובד בה
          בפועל.
        </p>
      </header>

      <ol className="process-stages">
        {processStages.map((stage, index) => {
          const next = processStages[index + 1];

          return (
            <li id={stage.id} key={stage.id} className="process-stage">
              <article className="process-stage-inner" aria-labelledby={`${stage.id}-title`}>
                <div className="process-stage-marker" aria-hidden="true">
                  <span>{stage.number}</span>
                </div>

                <div className="process-stage-copy">
                  <p className="process-stage-eyebrow">{stage.eyebrow}</p>
                  <h3 id={`${stage.id}-title`}>{stage.title}</h3>
                  <p className="process-stage-description">{stage.description}</p>
                </div>

                <div className="process-stage-details">
                  <p className="process-stage-details-title">מה קורה בשלב הזה</p>
                  <ul>
                    {stage.activities.map((activity, activityIndex) => (
                      // The index drives the stagger: each item's reveal starts a little
                      // later than the one above it, so the list checks in rather than
                      // appearing all at once.
                      <li
                        key={activity}
                        style={{ "--process-item": activityIndex } as CSSProperties}
                      >
                        {activity}
                      </li>
                    ))}
                  </ul>
                </div>

                <aside
                  className="process-stage-outcome"
                  aria-label={`התוצר של שלב ${stage.title}`}
                >
                  <span>התוצר</span>
                  <p>{stage.outcome}</p>
                  {next && (
                    <a
                      className="process-stage-next"
                      href={`#${next.id}`}
                      aria-label={`לשלב הבא: ${next.title}`}
                    >
                      <span>{`לשלב הבא · ${next.title}`}</span>
                      <svg
                        viewBox="0 0 16 16"
                        width="15"
                        height="15"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                        focusable="false"
                      >
                        <path d="M8 2.5v11M3.5 9l4.5 4.5L12.5 9" />
                      </svg>
                    </a>
                  )}
                </aside>
              </article>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
