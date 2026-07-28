import {
  workflowComparisonHeadings,
  workflowComparisonRows,
} from "../comparison-content";

/**
 * Before / after, the same six steps, done by hand today and inside the system tomorrow.
 *
 * Not a `<table>`, deliberately. The two cells of a row are not values of one measured
 * dimension; they are two narratives of the same step, and each is a short paragraph.
 * A list of steps, each carrying two labelled panels, is what the content actually is
 * and it survives the 390px viewport by stacking, where a three-column table would not.
 *
 * The column labels are repeated inside every row rather than printed once at the top of
 * the section. That is what keeps the stacked layout intelligible: when the panels sit one
 * above the other, a distant column header no longer identifies them.
 *
 * A Server Component; the only motion is a CSS scroll-driven reveal behind a `@supports`
 * guard.
 */
export function WorkflowComparison() {
  return (
    <section
      id="automation"
      className="workflow-section"
      aria-labelledby="workflow-heading"
    >
      <div className="workflow-inner">
        <header className="workflow-intro">
          <p className="workflow-eyebrow">{workflowComparisonHeadings.eyebrow}</p>
          <h2 id="workflow-heading">{workflowComparisonHeadings.headline}</h2>
          <p className="workflow-lead">{workflowComparisonHeadings.lead}</p>
        </header>

        <ol className="workflow-rows">
          {workflowComparisonRows.map((row) => (
            <li key={row.id} id={row.id} className="workflow-row">
              <h3 className="workflow-stage">{row.stage}</h3>

              <div className="workflow-cell workflow-cell-manual">
                <p className="workflow-cell-label">
                  <span className="workflow-cell-glyph" aria-hidden="true">
                    <svg
                      viewBox="0 0 16 16"
                      width="14"
                      height="14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      focusable="false"
                    >
                      <path d="M4 8h8" />
                    </svg>
                  </span>
                  {workflowComparisonHeadings.manualLabel}
                </p>
                <p className="workflow-cell-body">{row.manual}</p>
              </div>

              <div className="workflow-cell workflow-cell-automated">
                <p className="workflow-cell-label">
                  <span className="workflow-cell-glyph" aria-hidden="true">
                    <svg
                      viewBox="0 0 16 16"
                      width="14"
                      height="14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      focusable="false"
                    >
                      <path d="M3.5 8.5l3 3 6-6.5" />
                    </svg>
                  </span>
                  {workflowComparisonHeadings.automatedLabel}
                </p>
                <p className="workflow-cell-body">{row.automated}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
