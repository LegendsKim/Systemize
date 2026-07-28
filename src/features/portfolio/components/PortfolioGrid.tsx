import { portfolioHeadings, portfolioProjects } from "../portfolio-content";

/**
 * Portfolio examples.
 *
 * The argument of this section is the *range*, not any single project, so the cards are a
 * flat grid of equals rather than a ranked showcase, a judo club and a cleanroom sitting
 * side by side is the point.
 *
 * `placeholderNotice` renders as a visible, prominent note above the grid, never as
 * `sr-only` or a comment. While these entries are illustrative, presenting them as case
 * studies would be a misrepresentation, and a disclosure that only a screen-reader user
 * hears is not a disclosure. It stays on screen for as long as any entry is a placeholder,
 * which is what the flag is read for.
 *
 * No client name, logo, figure or testimonial appears here, because none exists in the
 * content module. Nothing on the card is invented to fill a slot.
 *
 * A Server Component.
 */
export function PortfolioGrid() {
  const hasPlaceholders = portfolioProjects.some((project) => project.isPlaceholder);

  return (
    <section
      id="portfolio"
      className="portfolio-section"
      aria-labelledby="portfolio-heading"
    >
      <div className="portfolio-inner">
        <header className="portfolio-intro">
          <p className="portfolio-eyebrow">{portfolioHeadings.eyebrow}</p>
          <h2 id="portfolio-heading">{portfolioHeadings.headline}</h2>
          <p className="portfolio-lead">{portfolioHeadings.lead}</p>
        </header>

        {hasPlaceholders && (
          <p className="portfolio-notice">
            <span className="portfolio-notice-glyph" aria-hidden="true">
              <svg
                viewBox="0 0 16 16"
                width="15"
                height="15"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                focusable="false"
              >
                <circle cx="8" cy="8" r="6.25" />
                <path d="M8 7.25v4M8 4.9v.1" />
              </svg>
            </span>
            {portfolioHeadings.placeholderNotice}
          </p>
        )}

        <ul className="portfolio-grid">
          {portfolioProjects.map((project) => (
            <li key={project.id} id={project.id} className="portfolio-card">
              <article aria-labelledby={`${project.id}-title`}>
                <p className="portfolio-sector">{project.sector}</p>
                <h3 id={`${project.id}-title`} className="portfolio-card-title">
                  {project.title}
                </h3>

                <dl className="portfolio-detail">
                  <dt>האתגר</dt>
                  <dd>{project.challenge}</dd>
                  <dt>מה נבנה</dt>
                  <dd>{project.solution}</dd>
                </dl>

                <ul className="portfolio-outcomes">
                  {project.outcomes.map((outcome) => (
                    <li key={outcome}>{outcome}</li>
                  ))}
                </ul>

                <ul className="portfolio-capabilities">
                  {project.capabilities.map((capability) => (
                    <li key={capability}>{capability}</li>
                  ))}
                </ul>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
