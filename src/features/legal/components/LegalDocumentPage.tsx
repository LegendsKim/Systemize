import type { LegalDocument } from "../legal-content";
import { legalHeadings } from "../legal-content";

interface LegalDocumentPageProps {
  readonly legalDocument: LegalDocument;
}

/**
 * The single renderer for all three legal routes.
 *
 * One component rather than three pages of markup: the routes differ only in content, and
 * a shared renderer is what guarantees the draft notice cannot be present on one page and
 * quietly missing from another.
 *
 * The draft notice is rendered from `legalDocument.isPlaceholder`, not from a hardcoded flag,
 * so approving the copy in the content module is the only edit needed to remove it.
 *
 * No prose lives here. Every visible string comes from `legal-content.ts`.
 *
 * Layout is a masthead band over a two-column reading area: a sticky contents rail beside
 * the prose on wide viewports, a single column below `64rem`. The rail replaced an inline
 * list of underlined links that sat above the body and left the whole outer column empty.
 *
 * Section numbers are generated from the array index rather than stored in the content
 * module, so reordering or inserting a section cannot leave a stale number behind.
 *
 * A Server Component, the page is static text with no interactivity. The sticky rail is
 * `position: sticky`, not a scroll listener, so nothing here reaches the client bundle.
 */
export function LegalDocumentPage({ legalDocument }: LegalDocumentPageProps) {
  const noticeId = "legal-draft-notice";
  const openDecisionsId = "legal-open-decisions";

  /** Two digits, so the rail's numbers form a straight edge at any count. */
  const sectionNumber = (index: number) => String(index + 1).padStart(2, "0");

  return (
    <article className="legal-page">
      <header className="legal-masthead">
        <div className="legal-masthead-inner">
          <p className="legal-eyebrow">{legalDocument.eyebrow}</p>
          <h1 className="legal-title">{legalDocument.title}</h1>
          <p className="legal-lead">{legalDocument.lead}</p>
        </div>
      </header>

      <div className="legal-inner">
        <div className="legal-layout">
          <nav
            className="legal-toc"
            aria-label={`תוכן העמוד: ${legalDocument.title}`}
          >
            <p className="legal-toc-heading">{legalHeadings.tableOfContents}</p>
            <ol className="legal-toc-list">
              {legalDocument.sections.map((section, index) => (
                <li key={section.id}>
                  <a className="legal-toc-link" href={`#${section.id}`}>
                    <span className="legal-toc-number" aria-hidden="true">
                      {sectionNumber(index)}
                    </span>
                    <span>{section.heading}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="legal-body">
            {legalDocument.isPlaceholder ? (
              <aside
                className="legal-draft"
                role="note"
                aria-labelledby={noticeId}
                data-placeholder="true"
              >
                <p className="legal-draft-label" id={noticeId}>
                  {legalHeadings.draftLabel}
                </p>
                <p className="legal-draft-text">{legalDocument.draftNotice}</p>
              </aside>
            ) : null}

            {legalDocument.sections.map((section, index) => (
              <section
                key={section.id}
                id={section.id}
                className="legal-section"
                aria-labelledby={`${section.id}-heading`}
              >
                <h2 className="legal-section-heading" id={`${section.id}-heading`}>
                  <span className="legal-section-number" aria-hidden="true">
                    {sectionNumber(index)}
                  </span>
                  {section.heading}
                </h2>

                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="legal-paragraph">
                    {paragraph}
                  </p>
                ))}

                {section.bullets === undefined ? null : (
                  <ul className="legal-list">
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}

            <section
              className="legal-section legal-open-decisions"
              aria-labelledby={openDecisionsId}
            >
              <h2 className="legal-section-heading" id={openDecisionsId}>
                {legalHeadings.openDecisions}
              </h2>
              <ul className="legal-list">
                {legalDocument.openDecisions.map((decision) => (
                  <li key={decision}>{decision}</li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </div>
    </article>
  );
}
