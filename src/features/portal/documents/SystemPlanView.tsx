import { SystemizeLockup } from "@/components/brand/SystemizeLockup";
import { formatIls } from "@/features/portal/workflow/format";
import {
  recommendedSystemPlanOption,
  systemPlanAppendix,
  type SystemPlanContent,
} from "./system-plan";

const dateFormatter = new Intl.DateTimeFormat("he-IL", {
  timeZone: "Asia/Jerusalem",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

interface SystemPlanViewProps {
  readonly content: SystemPlanContent;
  readonly versionNumber: number;
  readonly contentHash: string;
  readonly publishedAt: string | null;
  readonly headingId?: string;
  readonly titleAs?: "h1" | "h2" | "h3";
}

/**
 * The document a client reads before deciding whether to build.
 *
 * Five numbered sections and one appendix. The order answers the questions a buyer asks in
 * the order they ask them — what is this, what will it do, what does it cost, what happens
 * after it ships, what am I agreeing to — and everything that answers an engineer's
 * question instead of the client's is collapsed at the end.
 */
export function SystemPlanView({
  content,
  versionNumber,
  contentHash,
  publishedAt,
  headingId = "system-plan-title",
  titleAs = "h1",
}: SystemPlanViewProps) {
  const Title = titleAs;
  const SectionTitle = titleAs === "h3" ? "h4" : "h2";
  const SubsectionTitle = titleAs === "h3" ? "h5" : "h3";
  const preparedDate = dateFormatter.format(
    new Date(publishedAt ?? content.preparedAt)
  );
  const validUntil = dateFormatter.format(new Date(content.validUntil));
  const recommended = recommendedSystemPlanOption(content);
  const appendix = systemPlanAppendix(content);

  return (
    <article
      className="project-document system-plan"
      aria-labelledby={headingId}
      dir="rtl"
    >
      <header className="project-document-header">
        <SystemizeLockup className="project-document-brand" />
        <div className="project-document-heading">
          <p className="portal-eyebrow">תכנון מערכת והצעת פיתוח</p>
          <Title id={headingId}>{content.title}</Title>
          <p className="project-document-client">עבור {content.companyName}</p>
          <p className="project-document-project">
            פרויקט: {content.projectName}
          </p>
        </div>
        <dl className="project-document-meta">
          <div>
            <dt>תאריך הפקה</dt>
            <dd>{preparedDate}</dd>
          </div>
          <div>
            <dt>גרסה</dt>
            <dd>{versionNumber}</dd>
          </div>
          <div>
            <dt>בתוקף עד</dt>
            <dd>{validUntil}</dd>
          </div>
        </dl>
      </header>

      <section className="project-document-section">
        <p className="project-document-section-number" aria-hidden="true">
          01
        </p>
        <div>
          <SectionTitle>מה נבנה ולמה</SectionTitle>
          <p>{content.executiveSummary}</p>
          <div className="project-document-emphasis">
            <strong>איך נדע שהצלחנו</strong>
            <p>{content.successMetrics}</p>
          </div>
        </div>
      </section>

      <section className="project-document-section">
        <p className="project-document-section-number" aria-hidden="true">
          02
        </p>
        <div>
          <SectionTitle>מה המערכת תכלול</SectionTitle>
          <p>{content.solutionOverview}</p>
          <div className="system-plan-modules">
            <SubsectionTitle>מודולים ותהליכי עבודה</SubsectionTitle>
            <p>{content.modulesAndWorkflows}</p>
          </div>
        </div>
      </section>

      <section className="project-document-section">
        <p className="project-document-section-number" aria-hidden="true">
          03
        </p>
        <div>
          <SectionTitle>חלופות ומחיר</SectionTitle>
          <p className="project-document-section-lead">
            המחיר במסמך הוא מחיר החלופה הנבחרת. הוא אינו מצטבר לשלבים שמפורטים
            אחריו — השלבים מתארים כיצד אותה עבודה מתקדמת.
          </p>
          <ul className="system-plan-options">
            {content.developmentOptions.map((option) => (
              <li
                key={option.name}
                data-recommended={option.recommended || undefined}
              >
                <div className="system-plan-option-head">
                  <div>
                    {option.recommended && (
                      <span className="admin-chip" data-tone="positive">
                        מומלץ
                      </span>
                    )}
                    <SubsectionTitle>{option.name}</SubsectionTitle>
                  </div>
                  <strong>{formatIls(option.price.amountAgorot)}</strong>
                </div>
                <p className="system-plan-option-best-for">{option.bestFor}</p>
                <p>{option.scope}</p>
                <small>משך משוער: {option.timeline}</small>
              </li>
            ))}
          </ul>

          <div className="system-plan-plan">
            <SubsectionTitle>
              איך מתקדמת העבודה על {recommended.name}
            </SubsectionTitle>
            <ol className="system-plan-phases">
              {content.phases.map((phase, index) => (
                <li key={`${phase.name}-${index}`}>
                  <span
                    className="system-plan-phase-number"
                    aria-hidden="true"
                  >
                    {index + 1}
                  </span>
                  <div>
                    <div className="system-plan-phase-head">
                      <strong>{phase.name}</strong>
                      <small>{phase.timeline}</small>
                    </div>
                    <p>{phase.outcome}</p>
                    <p className="system-plan-phase-deliverables">
                      {phase.deliverables}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="project-document-section">
        <p className="project-document-section-number" aria-hidden="true">
          04
        </p>
        <div>
          <SectionTitle>אחרי העלייה לאוויר</SectionTitle>
          <div className="system-plan-support">
            {content.supportPlans.map((plan) => (
              <article key={plan.name}>
                <SubsectionTitle>{plan.name}</SubsectionTitle>
                <strong>
                  {formatIls(plan.monthlyPrice.amountAgorot)} לחודש
                </strong>
                <p>{plan.coverage}</p>
                <small>זמן תגובה: {plan.responseTime}</small>
              </article>
            ))}
          </div>
          <dl className="system-plan-change-pricing">
            <div>
              <dt>פיצ&apos;ר קטן</dt>
              <dd>
                החל מ־
                {formatIls(content.changePricing.smallFeatureFrom.amountAgorot)}
              </dd>
            </div>
            <div>
              <dt>פיצ&apos;ר גדול</dt>
              <dd>
                החל מ־
                {formatIls(content.changePricing.largeFeatureFrom.amountAgorot)}
              </dd>
            </div>
            <div>
              <dt>עבודה שעתית</dt>
              <dd>{formatIls(content.changePricing.hourlyRate.amountAgorot)}</dd>
            </div>
          </dl>
          <p>{content.changePricing.notes}</p>
        </div>
      </section>

      <section className="project-document-section">
        <p className="project-document-section-number" aria-hidden="true">
          05
        </p>
        <div>
          <SectionTitle>תנאים מסחריים</SectionTitle>
          <dl className="project-document-definitions">
            <div>
              <dt>תנאי תשלום</dt>
              <dd>{content.paymentTerms}</dd>
            </div>
            <div>
              <dt>מה אינו כלול</dt>
              <dd>{content.exclusions}</dd>
            </div>
            <div>
              <dt>אחריות הלקוח</dt>
              <dd>{content.clientResponsibilities}</dd>
            </div>
            <div data-tone="assumption">
              <dt>הנחות וסיכונים</dt>
              <dd>{content.assumptionsAndRisks}</dd>
            </div>
            <div>
              <dt>אחריות לאחר מסירה</dt>
              <dd>{content.warranty}</dd>
            </div>
            <div>
              <dt>תוקף ההצעה</dt>
              <dd>עד {validUntil}</dd>
            </div>
          </dl>
        </div>
      </section>

      {appendix.length > 0 && (
        <details className="system-plan-appendix">
          <summary>
            <span>נספח טכני</span>
            <small>הפירוט ההנדסי המלא — {appendix.length} נושאים</small>
          </summary>
          <dl className="project-document-definitions">
            {appendix.map((entry) => (
              <div key={entry.label}>
                <dt>{entry.label}</dt>
                <dd>{entry.value}</dd>
              </div>
            ))}
          </dl>
        </details>
      )}

      <footer className="project-document-footer">
        <p>
          המחירים והזמנים תקפים להיקף המתואר במסמך זה ועד {validUntil}.
        </p>
        <details className="project-document-verification">
          <summary>פרטי אימות המסמך</summary>
          <code dir="ltr">SHA-256: {contentHash}</code>
        </details>
      </footer>
    </article>
  );
}
