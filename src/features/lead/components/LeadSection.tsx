import { leadSection } from "../lead-content";
import { LeadForm } from "./LeadForm";

/**
 * The Blueprint section, the page's single conversion surface, and the target of the
 * hero's second call to action (`#blueprint`).
 *
 * A Server Component. Only `LeadForm` crosses to the client.
 */
export function LeadSection() {
  return (
    <section
      id={leadSection.id}
      className="lead-section"
      aria-labelledby="lead-heading"
    >
      <div className="lead-inner">
        <header className="lead-intro">
          <p className="lead-kicker">{leadSection.kicker}</p>
          <h2 id="lead-heading">{leadSection.heading}</h2>
          <p className="lead-lede">{leadSection.lede}</p>
          <ul className="lead-assurances">
            {leadSection.assurances.map((assurance) => (
              <li key={assurance}>{assurance}</li>
            ))}
          </ul>
        </header>

        <div className="lead-form-panel">
          <LeadForm />
        </div>
      </div>
    </section>
  );
}
