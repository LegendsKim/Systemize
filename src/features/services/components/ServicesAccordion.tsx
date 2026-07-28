import { serviceEntries, servicesHeadings } from "../services-content";

/**
 * Services and capabilities.
 *
 * Native `<details>` / `<summary>`, not a scripted accordion. `AGENTS.md` §8 requires a
 * native semantic element wherever one applies, and this is the case it describes: the
 * browser already supplies the expanded/collapsed state, the button semantics, the
 * keyboard behaviour and the announcement. A JS reimplementation would cost a client
 * bundle and get all four slightly wrong.
 *
 * Each entry stays independently open. Making them mutually exclusive would hide content a
 * reader had deliberately opened in order to compare it with the next one.
 *
 * The heading lives inside the `<summary>`, which the HTML content model allows, heading
 * content intermixed with phrasing content. That keeps every service in the document
 * outline, so the section is navigable by heading and not only by tabbing through seven
 * disclosure controls. Nothing wraps the `<h3>`: `<summary>` admits a heading, a `<span>`
 * would not, so the three children are laid out by grid areas on the summary itself.
 *
 * A Server Component.
 */
export function ServicesAccordion() {
  return (
    <section
      id="services"
      className="services-section"
      aria-labelledby="services-heading"
    >
      <div className="services-inner">
        <header className="services-intro">
          <p className="services-eyebrow">{servicesHeadings.eyebrow}</p>
          <h2 id="services-heading">{servicesHeadings.headline}</h2>
          <p className="services-lead">{servicesHeadings.lead}</p>
        </header>

        <div className="services-list">
          {serviceEntries.map((entry) => (
            <details key={entry.id} id={entry.id} className="services-entry">
              <summary className="services-summary">
                <h3 className="services-title">{entry.title}</h3>
                <span className="services-teaser">{entry.summary}</span>
                <span className="services-chevron" aria-hidden="true">
                  <svg
                    viewBox="0 0 16 16"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    focusable="false"
                  >
                    <path d="M3.5 6l4.5 4.5L12.5 6" />
                  </svg>
                </span>
              </summary>

              <div className="services-body">
                <p className="services-prose">{entry.body}</p>

                <div className="services-outcomes">
                  <p className="services-outcomes-title">התוצרים</p>
                  <ul>
                    {entry.outcomes.map((outcome) => (
                      <li key={outcome}>{outcome}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
