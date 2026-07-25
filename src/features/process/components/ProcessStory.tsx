import type { CSSProperties } from "react";
import { processStages } from "../process-content";

/**
 * The four delivery stages, told at full height.
 *
 * The section continues the hero's trail rather than restating it: the rule down the
 * marker column is the same line, and it fills as each stage passes. That gives a reader
 * a sense of position — how far along the process they are — without a progress widget.
 *
 * Every stage ends with a link to the next, so the section can be walked deliberately
 * instead of only scrolled past, and the last one hands off to the lead form.
 *
 * A Server Component. All of the motion is CSS scroll-driven animation behind a
 * `@supports` guard, so nothing here reaches the client bundle and an unsupporting
 * browser simply gets the finished layout.
 */
export function ProcessStory() {
  return (
    <section id="process" className="process-story" aria-labelledby="process-heading">
      <header className="process-intro">
        <p className="process-kicker">איך אנחנו עובדים</p>
        <h2 id="process-heading">מתהליך עמום למערכת שעובדת</h2>
        <p>
          ארבעה שלבים, קו אחד ברור: להבין את העסק, לתכנן סביבו, לבנות במדויק
          ולהישאר עד שהמערכת נטמעת בעבודה.
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
                  <a
                    className="process-stage-next"
                    href={next ? `#${next.id}` : "#blueprint"}
                    aria-label={
                      next
                        ? `לשלב הבא: ${next.title}`
                        : "סיימנו את התהליך — מתחילים באפיון"
                    }
                  >
                    <span>{next ? `לשלב הבא · ${next.title}` : "מתחילים באפיון"}</span>
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
                </aside>
              </article>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
