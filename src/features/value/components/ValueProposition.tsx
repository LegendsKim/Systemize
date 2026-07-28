import { valueContent } from "../value-content";

/**
 * The value proposition.
 *
 * The section exists to state one claim and then make it credible, so the claim gets the
 * whole first screen at display size and the supporting points arrive underneath it as a
 * quiet grid. The points are deliberately not styled as cards: cards read as features,
 * and these are reasons.
 *
 * A Server Component. The numerals come from a CSS counter rather than the array index,
 * so the markup carries no presentational ordinals, and every reveal is a CSS
 * scroll-driven animation behind a `@supports` guard.
 */
export function ValueProposition() {
  return (
    <section id="value" className="value-section" aria-labelledby="value-heading">
      <div className="value-inner">
        <header className="value-intro">
          <p className="value-eyebrow">{valueContent.eyebrow}</p>
          <h2 id="value-heading">{valueContent.headline}</h2>
          <p className="value-lead">{valueContent.lead}</p>
        </header>

        <ul className="value-points">
          {valueContent.points.map((point) => (
            <li key={point.id} id={point.id} className="value-point">
              <h3>{point.title}</h3>
              <p>{point.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
