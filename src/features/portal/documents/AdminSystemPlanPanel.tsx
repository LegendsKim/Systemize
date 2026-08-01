import { randomUUID } from "node:crypto";
import Link from "next/link";
import type { SystemPlanDocumentSnapshot } from "@/server/repositories/document.repository";
import { formatPortalDateTime } from "@/features/portal/workflow/format";
import { publishDocumentVersion } from "./actions";
import { SystemPlanForm } from "./SystemPlanForm";
import { SystemPlanView } from "./SystemPlanView";
import { toSystemPlanEditorDefaults } from "./system-plan";

interface AdminSystemPlanPanelProps {
  readonly projectId: string;
  readonly companyName: string;
  readonly projectName: string;
  readonly document: SystemPlanDocumentSnapshot | null;
  readonly unlocked: boolean;
  readonly discoveryContext: string;
}

export function AdminSystemPlanPanel({
  projectId,
  companyName,
  projectName,
  document,
  unlocked,
  discoveryContext,
}: AdminSystemPlanPanelProps) {
  const latestDraft = document?.latestDraft ?? null;
  const latestPublished = document?.latestPublished ?? null;
  const defaults = toSystemPlanEditorDefaults(
    latestDraft?.content ?? latestPublished?.content ?? null
  );

  return (
    <section className="admin-panel admin-panel-wide" aria-labelledby="system-plan-panel-title">
      <div className="admin-panel-head">
        <div>
          <p className="admin-eyebrow">השלב הבא</p>
          <h2 id="system-plan-panel-title">תכנון מערכת והצעת פיתוח</h2>
          <p>
            חלופות פיתוח עם מחיר אחד לחלופה, שלבי הביצוע שמאחורי החלופה המומלצת,
            תמיכה, תמחור שינויים ותנאים מסחריים. הפירוט הטכני יורד לנספח.
          </p>
        </div>
        <span className="admin-chip" data-tone={latestPublished ? "positive" : latestDraft ? "attention" : undefined}>
          {latestPublished ? `גרסה ${latestPublished.versionNumber} פורסמה` : latestDraft ? `טיוטה ${latestDraft.versionNumber}` : unlocked ? "מוכן ליצירה" : "ייפתח לאחר תשלום"}
        </span>
      </div>

      {!unlocked && !document ? (
        <div className="system-plan-locked">
          <strong>המסמך נפתח לאחר השלמת ארבעת שלבי ההיכרות.</strong>
          <p>יש לפרסם את הצעת האפיון ולסמן את התשלום כהתקבל.</p>
        </div>
      ) : (
        <>
          {latestDraft && (
            <details className="document-version-card" open>
              <summary>טיוטה גרסה {latestDraft.versionNumber} · {formatPortalDateTime(latestDraft.createdAt)}</summary>
              <div className="document-version-actions">
                <Link href={`/api/documents/${latestDraft.id}/pdf`} className="admin-button" data-variant="secondary">תצוגת PDF</Link>
                <form action={publishDocumentVersion}>
                  <input type="hidden" name="projectId" value={projectId} />
                  <input type="hidden" name="versionId" value={latestDraft.id} />
                  <input type="hidden" name="idempotencyKey" value={randomUUID()} />
                  <button type="submit" className="admin-button">פרסום התוכנית ללקוח</button>
                </form>
              </div>
              <SystemPlanView content={latestDraft.content} versionNumber={latestDraft.versionNumber} contentHash={latestDraft.contentHash} publishedAt={latestDraft.publishedAt} headingId={`draft-system-plan-${latestDraft.id}`} titleAs="h3" />
            </details>
          )}
          {latestPublished && (
            <details className="document-version-card">
              <summary>גרסה {latestPublished.versionNumber} שפורסמה · {latestPublished.publishedAt ? formatPortalDateTime(latestPublished.publishedAt) : ""}</summary>
              <div className="document-version-actions">
                <Link href={`/api/documents/${latestPublished.id}/pdf`} className="admin-button" data-variant="secondary">הורדת PDF</Link>
              </div>
              <SystemPlanView content={latestPublished.content} versionNumber={latestPublished.versionNumber} contentHash={latestPublished.contentHash} publishedAt={latestPublished.publishedAt} headingId={`published-system-plan-${latestPublished.id}`} titleAs="h3" />
            </details>
          )}
          <details className="document-editor-shell" open={!latestDraft && !latestPublished}>
            <summary>{document ? "יצירת גרסה חדשה" : "פתיחת מסמך תכנון ראשון"}</summary>
            <SystemPlanForm
              projectId={projectId}
              companyName={companyName}
              projectName={projectName}
              documentId={document?.id ?? randomUUID()}
              versionId={randomUUID()}
              idempotencyKey={randomUUID()}
              discoveryContext={discoveryContext}
              defaults={defaults}
            />
          </details>
        </>
      )}
    </section>
  );
}
