import { randomUUID } from "node:crypto";
import Link from "next/link";
import type { IntroductoryDocumentSnapshot } from "@/server/repositories/document.repository";
import { formatPortalDateTime } from "@/features/portal/workflow/format";
import { publishDocumentVersion } from "./actions";
import { IntroductorySummaryForm } from "./IntroductorySummaryForm";
import { IntroductorySummaryView } from "./IntroductorySummaryView";
import { toIntroductorySummaryFormDefaults } from "./introductory-summary";

interface AdminDocumentPanelProps {
  readonly projectId: string;
  readonly companyName: string;
  readonly projectName: string;
  readonly document: IntroductoryDocumentSnapshot | null;
  readonly meetingCompleted: boolean;
}

export function AdminDocumentPanel({
  projectId,
  companyName,
  projectName,
  document,
  meetingCompleted,
}: AdminDocumentPanelProps) {
  const latestDraft = document?.latestDraft ?? null;
  const latestPublished = document?.latestPublished ?? null;
  const defaults = toIntroductorySummaryFormDefaults(
    latestDraft?.content ?? latestPublished?.content ?? null
  );

  return (
    <section
      id="introductory-summary"
      className="admin-panel admin-panel-wide"
      aria-labelledby="commercial-document-title"
    >
      <div className="admin-panel-head">
        <div>
          <h2 id="commercial-document-title">סיכום והצעה לאפיון</h2>
          <p>
            כל שמירה יוצרת גרסה נפרדת. הלקוח רואה רק גרסה שפורסמה, וגרסה
            שפורסמה אינה ניתנת לשינוי.
          </p>
        </div>
        <span
          className="admin-chip"
          data-tone={latestPublished ? "positive" : latestDraft ? "attention" : undefined}
        >
          {latestPublished
            ? `גרסה ${latestPublished.versionNumber} פורסמה`
            : latestDraft
              ? `טיוטה ${latestDraft.versionNumber}`
              : "טרם נוצר"}
        </span>
      </div>

      {!meetingCompleted && !latestDraft && !latestPublished ? (
        <p>
          המסמך נפתח לאחר השלמת פגישת ההיכרות, כדי שההצעה תתבסס על החומר
          שנאסף ועל ההחלטות מהפגישה.
        </p>
      ) : (
        <>
          {latestDraft && (
            <details className="document-version-card" open>
              <summary>
                טיוטה גרסה {latestDraft.versionNumber} ·{" "}
                {formatPortalDateTime(latestDraft.createdAt)}
              </summary>
              <div className="document-version-actions">
                <Link
                  href={`/api/documents/${latestDraft.id}/pdf`}
                  className="admin-button"
                  data-variant="secondary"
                >
                  תצוגת PDF
                </Link>
                <form action={publishDocumentVersion}>
                  <input type="hidden" name="projectId" value={projectId} />
                  <input
                    type="hidden"
                    name="versionId"
                    value={latestDraft.id}
                  />
                  <input
                    type="hidden"
                    name="idempotencyKey"
                    value={randomUUID()}
                  />
                  <button type="submit" className="admin-button">
                    פרסום גרסה זו ללקוח
                  </button>
                </form>
              </div>
              <IntroductorySummaryView
                content={latestDraft.content}
                projectName={projectName}
                versionNumber={latestDraft.versionNumber}
                contentHash={latestDraft.contentHash}
                publishedAt={latestDraft.publishedAt}
                headingId={`draft-document-${latestDraft.id}`}
                titleAs="h3"
              />
            </details>
          )}

          {latestPublished && (
            <details className="document-version-card">
              <summary>
                גרסה {latestPublished.versionNumber} שפורסמה ·{" "}
                {latestPublished.publishedAt
                  ? formatPortalDateTime(latestPublished.publishedAt)
                  : ""}
              </summary>
              <div className="document-version-actions">
                <Link
                  href={`/api/documents/${latestPublished.id}/pdf`}
                  className="admin-button"
                  data-variant="secondary"
                >
                  הורדת PDF
                </Link>
              </div>
              <IntroductorySummaryView
                content={latestPublished.content}
                projectName={projectName}
                versionNumber={latestPublished.versionNumber}
                contentHash={latestPublished.contentHash}
                publishedAt={latestPublished.publishedAt}
                headingId={`published-document-${latestPublished.id}`}
                titleAs="h3"
              />
            </details>
          )}

          <details
            className="document-editor-shell"
            open={!latestDraft && !latestPublished}
          >
            <summary>
              {document ? "יצירת גרסה חדשה" : "פתיחת מסמך ראשון"}
            </summary>
            <IntroductorySummaryForm
              projectId={projectId}
              companyName={companyName}
              projectName={projectName}
              documentId={document?.id ?? randomUUID()}
              versionId={randomUUID()}
              idempotencyKey={randomUUID()}
              defaults={defaults}
            />
          </details>
        </>
      )}
    </section>
  );
}
