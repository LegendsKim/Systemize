import {
  offTheShelfComparisonHeadings,
  offTheShelfComparisonRows,
} from "../comparison-content";

/**
 * Off-the-shelf versus built around you.
 *
 * A real `<table>`, as `docs/PRODUCT.md` §3.1.6 requires: eight named dimensions, each
 * compared across the same two options. That is tabular data, and a grid of `<div>`s would
 * throw away the row/column relationship a screen-reader user needs to answer "and what
 * does a bespoke system do about cost?".
 *
 * The corner cell is intentionally empty. The content module names the two columns and
 * every row, but not the row-header column, and inventing a word for it would be inventing
 * copy, an empty corner is the conventional, accessible answer.
 *
 * Three columns of prose cannot fit a 390px viewport, so the table sits in a labelled,
 * keyboard-reachable scroll region rather than being restructured. `tabIndex={0}` on a
 * scroll container is required for keyboard scrolling and is not a positive tab index.
 *
 * A Server Component.
 */
export function OffTheShelfComparison() {
  return (
    <section
      id="off-the-shelf"
      className="shelf-section"
      aria-labelledby="shelf-heading"
    >
      <div className="shelf-inner">
        <header className="shelf-intro">
          <p className="shelf-eyebrow">{offTheShelfComparisonHeadings.eyebrow}</p>
          <h2 id="shelf-heading">{offTheShelfComparisonHeadings.headline}</h2>
        </header>

        <div
          className="shelf-scroll"
          role="region"
          tabIndex={0}
          aria-labelledby="shelf-heading"
        >
          <table className="shelf-table">
            <caption className="shelf-caption">
              {offTheShelfComparisonHeadings.lead}
            </caption>
            <thead>
              <tr>
                <td className="shelf-corner" />
                <th scope="col" className="shelf-column shelf-column-shelf">
                  {offTheShelfComparisonHeadings.offTheShelfLabel}
                </th>
                <th scope="col" className="shelf-column shelf-column-bespoke">
                  {offTheShelfComparisonHeadings.bespokeLabel}
                </th>
              </tr>
            </thead>
            <tbody>
              {offTheShelfComparisonRows.map((row) => (
                <tr key={row.id} id={row.id}>
                  <th scope="row" className="shelf-aspect">
                    {row.aspect}
                  </th>
                  <td className="shelf-cell">{row.offTheShelf}</td>
                  <td className="shelf-cell shelf-cell-bespoke">{row.bespoke}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="shelf-footnote">{offTheShelfComparisonHeadings.footnote}</p>
      </div>
    </section>
  );
}
