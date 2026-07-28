import { faqEntries, faqHeadings } from "../faq-content";

/**
 * The visible FAQ.
 *
 * Native `<details>` / `<summary>` for the same reason as the services accordion: the
 * disclosure semantics, keyboard behaviour and state announcement already exist in the
 * platform, and reimplementing them would cost a client bundle to end up with less.
 *
 * The `FAQPage` structured data is rendered separately from this same module. Nothing on
 * this component may add, shorten or reword an answer, because the two must not diverge
 * a schema answer that does not appear on the page is exactly the mismatch the
 * `faq-content` module exists to prevent.
 *
 * A Server Component.
 */
export function FaqList() {
  return (
    <section id="faq" className="faq-section" aria-labelledby="faq-heading">
      <div className="faq-inner">
        <header className="faq-intro">
          <p className="faq-eyebrow">{faqHeadings.eyebrow}</p>
          <h2 id="faq-heading">{faqHeadings.headline}</h2>
        </header>

        <div className="faq-list">
          {faqEntries.map((entry) => (
            <details
              key={entry.id}
              id={entry.id}
              className="faq-entry"
              /*
               * Shared `name` makes this an exclusive accordion: opening one answer closes
               * the others, and the platform does it with no client JavaScript. A browser
               * that predates the feature ignores the attribute and simply allows several
               * open at once, which is the old behaviour rather than a broken one.
               */
              name="faq"
            >
              <summary className="faq-question">
                <h3 className="faq-question-text">{entry.question}</h3>
                <span className="faq-toggle" aria-hidden="true">
                  <svg
                    viewBox="0 0 16 16"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    focusable="false"
                  >
                    <path d="M3 8h10" />
                    <path className="faq-toggle-stem" d="M8 3v10" />
                  </svg>
                </span>
              </summary>

              <p className="faq-answer">{entry.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
