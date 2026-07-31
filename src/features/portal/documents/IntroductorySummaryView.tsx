import {
  introductorySummarySections,
  type IntroductorySummaryContent,
} from "./introductory-summary";
import { formatIls } from "@/features/portal/workflow/format";

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
  readonly headingId?: string;
  readonly titleAs?: "h1" | "h2" | "h3";
}

export function IntroductorySummaryView({
  content,
  versionNumber,
  contentHash,
  publishedAt,
  headingId = "document-title",
  titleAs = "h1",
}: IntroductorySummaryViewProps) {
  const Title = titleAs;
  const SectionTitle = titleAs === "h3" ? "h4" : "h2";
  const clientHeadingId = `${headingId}-client`;
  const commercialHeadingId = `${headingId}-commercial`;

  return (
    <article className="project-document" aria-labelledby={headingId}>
      <header className="project-document-header">
        <div>
          <p className="portal-eyebrow">SYSTEMIZE · מסמך מסחרי</p>
          <Title id={headingId}>{content.title}</Title>
          <p>{content.companyName}</p>
        </div>
        <dl className="project-document-meta">
          <div>
            <dt>גרסה</dt>
            <dd>{versionNumber}</dd>
          </div>
          <div>
            <dt>{publishedAt ? "פורסם" : "הוכן"}</dt>
            <dd>
              {dateFormatter.format(
                new Date(publishedAt ?? content.preparedAt)
              )}
            </dd>
          </div>
          <div>
            <dt>בתוקף עד</dt>
            <dd>{dateFormatter.format(new Date(content.validUntil))}</dd>
          </div>
        </dl>
      </header>

      <section aria-labelledby={clientHeadingId}>
        <SectionTitle id={clientHeadingId}>הלקוח ואנשי הקשר</SectionTitle>
        <p>{content.companyName}</p>
        {content.contacts.length > 0 ? (
          <ul className="project-document-contacts">
            {content.contacts.map((contact) => (
              <li key={contact.email}>
                <strong>{contact.fullName}</strong>
                <span dir="ltr">{contact.email}</span>
                <span dir="ltr">{contact.phone}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>לא הוגדרו אנשי קשר במסמך.</p>
        )}
      </section>

      {introductorySummarySections.slice(0, 8).map((section) => (
        <section key={section.key}>
          <SectionTitle>{section.title}</SectionTitle>
          <p>{String(content[section.key])}</p>
        </section>
      ))}

      <section
        className="project-document-commercial"
        aria-labelledby={commercialHeadingId}
      >
        <div>
          <p className="portal-eyebrow">הצעה מסחרית</p>
          <SectionTitle id={commercialHeadingId}>מחיר ותנאים</SectionTitle>
        </div>
        <strong>{formatIls(content.price.amountAgorot)}</strong>
        <p>{content.paymentTerms}</p>
      </section>

      <section>
        <SectionTitle>מה לא כלול</SectionTitle>
        <p>{content.exclusions}</p>
      </section>

      <footer className="project-document-footer">
        <span>מזהה אימות SHA-256</span>
        <code dir="ltr">{contentHash}</code>
        <p>
          המסמך מוצג מאותה גרסת תוכן שממנה מופק קובץ ה־PDF. שינוי תוכן יוצר
          גרסה חדשה ואינו משנה גרסה שפורסמה.
        </p>
      </footer>
    </article>
  );
}
