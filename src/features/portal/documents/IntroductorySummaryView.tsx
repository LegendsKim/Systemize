import { formatIls } from "@/features/portal/workflow/format";
import { SystemizeLockup } from "@/components/brand/SystemizeLockup";
import type { IntroductorySummaryContent } from "./introductory-summary";
import {
  meaningfulText,
  presentList,
  presentScope,
  presentTimeline,
} from "./introductory-summary-presentation";

const dateFormatter = new Intl.DateTimeFormat("he-IL", {
  timeZone: "Asia/Jerusalem",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export interface IntroductorySummaryViewProps {
  readonly content: IntroductorySummaryContent;
  readonly versionNumber: number;
  readonly contentHash: string;
  readonly publishedAt: string | null;
  readonly projectName?: string;
  readonly headingId?: string;
  readonly titleAs?: "h1" | "h2" | "h3";
}

export function IntroductorySummaryView({
  content,
  versionNumber,
  contentHash,
  publishedAt,
  projectName,
  headingId = "document-title",
  titleAs = "h1",
}: IntroductorySummaryViewProps) {
  const Title = titleAs;
  const SectionTitle = titleAs === "h3" ? "h4" : "h2";
  const SubsectionTitle = titleAs === "h3" ? "h5" : "h3";
  const currentSituation = meaningfulText(content.currentSituation);
  const operationalFriction = meaningfulText(content.operationalFriction);
  const desiredOutcomes = meaningfulText(content.desiredOutcomes);
  const discoveryIncludes = meaningfulText(content.discoveryIncludes);
  const deliverables = meaningfulText(content.deliverables);
  const paymentTerms = meaningfulText(content.paymentTerms);
  const openQuestions = meaningfulText(content.openQuestions);
  const exclusions = meaningfulText(content.exclusions);
  const exclusionItems = presentList(exclusions);
  const scope = presentScope(content.scopeAndAssumptions);
  const timeline = presentTimeline(content.estimatedTimeline);
  const preparedDate = dateFormatter.format(
    new Date(publishedAt ?? content.preparedAt)
  );
  const validUntil = dateFormatter.format(new Date(content.validUntil));
  const resolvedProjectName = meaningfulText(projectName);

  return (
    <article className="project-document" aria-labelledby={headingId} dir="rtl">
      <header className="project-document-header">
        <SystemizeLockup className="project-document-brand" />
        <div className="project-document-heading">
          <p className="portal-eyebrow">הצעה לאפיון ותכנון</p>
          <Title id={headingId}>{content.title}</Title>
          <p className="project-document-client">עבור {content.companyName}</p>
          {resolvedProjectName && (
            <p className="project-document-project">
              פרויקט: {resolvedProjectName}
            </p>
          )}
        </div>
        <dl className="project-document-meta">
          <div>
            <dt>תאריך הפקה</dt>
            <dd>{preparedDate}</dd>
          </div>
          <div>
            <dt>גרסת הצעה</dt>
            <dd>{versionNumber}</dd>
          </div>
          <div>
            <dt>בתוקף עד</dt>
            <dd>{validUntil}</dd>
          </div>
        </dl>
      </header>

      {(currentSituation || operationalFriction) && (
        <section className="project-document-section">
          <p className="project-document-section-number" aria-hidden="true">
            01
          </p>
          <div>
            <SectionTitle>הבנת המצב הקיים</SectionTitle>
            {currentSituation && <p>{currentSituation}</p>}
            {operationalFriction && (
              <div className="project-document-emphasis">
                <strong>מוקדי החיכוך שעלו בשיחה</strong>
                <p>{operationalFriction}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {desiredOutcomes && (
        <section className="project-document-section">
          <p className="project-document-section-number" aria-hidden="true">
            02
          </p>
          <div>
            <SectionTitle>מטרות ותוצאות רצויות</SectionTitle>
            <p>{desiredOutcomes}</p>
          </div>
        </section>
      )}

      {(scope.confirmedFacts ||
        scope.assumptions ||
        scope.boundaries ||
        scope.included ||
        scope.fallback) && (
        <section className="project-document-section">
          <p className="project-document-section-number" aria-hidden="true">
            03
          </p>
          <div>
            <SectionTitle>היקף ראשוני והנחות</SectionTitle>
            {scope.fallback && <p>{scope.fallback}</p>}
            {(scope.confirmedFacts ||
              scope.assumptions ||
              scope.boundaries ||
              scope.included) && (
              <dl className="project-document-definitions">
                {scope.confirmedFacts && (
                  <div>
                    <dt>עובדות שאושרו</dt>
                    <dd>{scope.confirmedFacts}</dd>
                  </div>
                )}
                {scope.assumptions && (
                  <div data-tone="assumption">
                    <dt>הנחות שדורשות אימות</dt>
                    <dd>{scope.assumptions}</dd>
                  </div>
                )}
                {scope.boundaries && (
                  <div>
                    <dt>גבולות ההיקף</dt>
                    <dd>{scope.boundaries}</dd>
                  </div>
                )}
                {scope.included && (
                  <div>
                    <dt>נכלל בשלב הנוכחי</dt>
                    <dd>{scope.included}</dd>
                  </div>
                )}
              </dl>
            )}
          </div>
        </section>
      )}

      {(discoveryIncludes || deliverables) && (
        <section className="project-document-section">
          <p className="project-document-section-number" aria-hidden="true">
            04
          </p>
          <div>
            <SectionTitle>שלב האפיון והתכנון</SectionTitle>
            <p className="project-document-section-lead">
              שלב מקצועי בתשלום שמתרגם את הצרכים וההחלטות לתשתית ברורה
              להמשך. הפיתוח עצמו אינו כלול בשלב זה.
            </p>
            <div className="project-document-deliverables">
              {discoveryIncludes && (
                <div>
                  <SubsectionTitle>מה נעשה בשלב האפיון</SubsectionTitle>
                  <p>{discoveryIncludes}</p>
                </div>
              )}
              {deliverables && (
                <div>
                  <SubsectionTitle>מה תקבלו בסיום השלב</SubsectionTitle>
                  <p>{deliverables}</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="project-document-questions">
        <SectionTitle>שאלות פתוחות</SectionTitle>
        <p>
          {openQuestions || "אין שאלות פתוחות מהותיות בשלב זה."}
        </p>
      </section>

      <section className="project-document-commercial">
        <div className="project-document-commercial-heading">
          <div>
            <p className="portal-eyebrow">הצעה מסחרית</p>
            <SectionTitle>שלב האפיון והתכנון</SectionTitle>
          </div>
          <strong>{formatIls(content.price.amountAgorot)}</strong>
        </div>
        <dl className="project-document-commercial-details">
          {(timeline.duration || timeline.fallback) && (
            <div>
              <dt>משך משוער</dt>
              <dd>{timeline.duration || timeline.fallback}</dd>
            </div>
          )}
          {paymentTerms && (
            <div>
              <dt>תנאי תשלום</dt>
              <dd>{paymentTerms}</dd>
            </div>
          )}
          <div>
            <dt>תוקף ההצעה</dt>
            <dd>עד {validUntil}</dd>
          </div>
          {timeline.dependencies && (
            <div>
              <dt>תלות בלקוח</dt>
              <dd>{timeline.dependencies}</dd>
            </div>
          )}
        </dl>
      </section>

      {exclusions && (
        <section className="project-document-exclusions">
          <SectionTitle>מה אינו כלול</SectionTitle>
          {exclusionItems.length > 0 ? (
            <ul>
              {exclusionItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p>{exclusions}</p>
          )}
        </section>
      )}

      <section className="project-document-next-step">
        <p className="portal-eyebrow">הפעולה הבאה</p>
        <SectionTitle>מאשרים, מסדירים תשלום ויוצאים לדרך</SectionTitle>
        <p>
          לאחר אישור ההצעה וביצוע התשלום, נתאם את תחילת שלב האפיון בהתאם
          לקבלת החומרים והאישורים הנדרשים.
        </p>
      </section>

      <footer className="project-document-footer">
        <p>
          מסמך זה מופק מגרסה שמורה ובלתי־ניתנת לשינוי. עדכון תוכן יוצר גרסה
          חדשה.
        </p>
        <details className="project-document-verification">
          <summary>פרטי אימות המסמך</summary>
          <code dir="ltr">SHA-256: {contentHash}</code>
        </details>
      </footer>
    </article>
  );
}
