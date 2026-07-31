import { randomUUID } from "node:crypto";
import Link from "next/link";
import { notFound } from "next/navigation";
import { clientProjectStageLabels } from "@/features/portal/project-stage";
import {
  bookMeetingSlot,
} from "@/features/portal/workflow/actions";
import {
  formatIls,
  formatPortalDateTime,
} from "@/features/portal/workflow/format";
import { intakeStatusLabels } from "@/features/portal/workflow/intake";
import { ProjectHistory } from "@/features/portal/workflow/ProjectHistory";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  getProjectWorkflow,
  listProjectEvents,
} from "@/server/repositories/workflow.repository";
import { listProjectDocuments } from "@/server/repositories/document.repository";

type ProjectPageProps = {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ notice?: string }>;
};

const noticeCopy: Record<string, string> = {
  "draft-saved": "הטיוטה נשמרה. אפשר לחזור ולהמשיך בדיוק מכאן.",
  "intake-submitted": "המסמך נשלח לבדיקה. נעדכן אותך כאן לאחר שנעבור עליו.",
  "meeting-booked": "הפגישה נקבעה. המועד נשמר ומופיע בהמשך העמוד.",
  "booking-failed": "המועד כבר אינו זמין. אפשר לבחור מועד אחר.",
};

export default async function ProjectPage({
  params,
  searchParams,
}: ProjectPageProps) {
  const [{ projectId }, query] = await Promise.all([params, searchParams]);
  const supabase = await createServerSupabaseClient();
  const { data: project, error } = await supabase
    .from("projects")
    .select("id,name,stage,progress_percent")
    .eq("id", projectId)
    .maybeSingle();

  if (error || !project) {
    notFound();
  }

  const [workflow, events, documents] = await Promise.all([
    getProjectWorkflow(supabase, projectId),
    listProjectEvents(supabase, projectId),
    listProjectDocuments(supabase, [projectId]),
  ]);
  const bookedMeeting = workflow.meetingSlots.find(
    (slot) => slot.status === "booked"
  );
  const bookedMeetingIntegration = bookedMeeting
    ? workflow.meetingIntegrations.find(
        (integration) => integration.meeting_slot_id === bookedMeeting.id
      ) ?? null
    : null;
  const completedMeeting = workflow.meetingSlots.find(
    (slot) => slot.status === "completed"
  );
  const availableSlots = workflow.meetingSlots.filter(
    (slot) => slot.status === "available" && new Date(slot.starts_at) > new Date()
  );
  const pendingPayment = workflow.payments.find(
    (payment) => payment.status === "pending"
  );
  const paidPayment = workflow.payments.find(
    (payment) => payment.status === "paid"
  );
  const publishedSummary =
    documents.find((document) => document.kind === "introductory_summary")
      ?.latestPublished ?? null;

  const intakeComplete = workflow.intake?.status === "approved";
  const meetingComplete = Boolean(completedMeeting);
  const paymentComplete = Boolean(paidPayment);

  return (
    <main id="main-content" className="portal-main">
      <Link href="/portal" className="portal-back-link">
        חזרה לאזור האישי
      </Link>

      {query.notice && noticeCopy[query.notice] && (
        <p className="workflow-notice" role="status">
          {noticeCopy[query.notice]}
        </p>
      )}

      <section className="workflow-client-hero" aria-labelledby="project-title">
        <div>
          <p className="portal-eyebrow">
            {clientProjectStageLabels[project.stage]}
          </p>
          <h1 id="project-title">{project.name}</h1>
          <p>
            כאן מרוכז כל מה שצריך כדי לעבור מהיכרות ראשונית לתכנית עבודה
            מסודרת — בלי מידע מפוזר ובלי סימני שאלה.
          </p>
        </div>
        <div className="workflow-privacy-seal">
          <span aria-hidden="true">✓</span>
          <div>
            <strong>מרחב פרטי ומאובטח</strong>
            <p>המסמכים והמידע בפרויקט גלויים רק לך ול־SYSTEMIZE.</p>
          </div>
        </div>
      </section>

      <section className="workflow-roadmap" aria-labelledby="roadmap-title">
        <div className="portal-section-heading">
          <div>
            <p className="portal-eyebrow">התהליך שלך</p>
            <h2 id="roadmap-title">ארבע תחנות עד לתחילת האפיון</h2>
          </div>
        </div>
        <ol>
          <li data-state={workflow.intake ? (intakeComplete ? "complete" : "current") : "current"}>
            <span>{intakeComplete ? "✓" : "01"}</span>
            <div>
              <strong>מסמך היכרות</strong>
              <small>
                {workflow.intake
                  ? intakeStatusLabels[workflow.intake.status]
                  : "ממתין למילוי"}
              </small>
            </div>
          </li>
          <li data-state={intakeComplete ? "complete" : "upcoming"}>
            <span>{intakeComplete ? "✓" : "02"}</span>
            <div>
              <strong>בדיקה ואישור</strong>
              <small>{intakeComplete ? "אושר" : "לאחר השליחה"}</small>
            </div>
          </li>
          <li data-state={meetingComplete ? "complete" : bookedMeeting ? "current" : "upcoming"}>
            <span>{meetingComplete ? "✓" : "03"}</span>
            <div>
              <strong>פגישת מיקוד</strong>
              <small>
                {meetingComplete ? "הושלמה" : bookedMeeting ? "נקבעה" : "בהמשך"}
              </small>
            </div>
          </li>
          <li data-state={paymentComplete ? "complete" : pendingPayment ? "current" : "upcoming"}>
            <span>{paymentComplete ? "✓" : "04"}</span>
            <div>
              <strong>אפיון ותכנון</strong>
              <small>
                {paymentComplete
                  ? "התשלום התקבל"
                  : pendingPayment
                    ? "ממתין לתשלום"
                    : "לאחר הפגישה"}
              </small>
            </div>
          </li>
        </ol>
      </section>

      {!workflow.intake || workflow.intake.status === "draft" || workflow.intake.status === "changes_requested" ? (
        <section className="workflow-primary-card">
          <div className="workflow-card-index">הפעולה הבאה שלך</div>
          <div>
            <p className="portal-eyebrow">מסמך היכרות חסוי</p>
            <h2>
              {workflow.intake?.status === "changes_requested"
                ? "נשאר להשלים כמה פרטים"
                : workflow.intake
                  ? "הטיוטה שלך מחכה להמשך"
                  : "בואו נכיר את העסק לעומק"}
            </h2>
            <p>
              השאלון בנוי בשלבים קצרים ומכין אותנו לפגישה ממוקדת. אפשר לשמור
              ולחזור בכל זמן.
            </p>
          </div>
          <Link
            href={`/portal/projects/${project.id}/discovery`}
            className="portal-primary-action"
          >
            {workflow.intake ? "המשך מילוי המסמך" : "פתיחת המסמך"}
          </Link>
        </section>
      ) : workflow.intake.status === "submitted" ? (
        <section className="workflow-primary-card workflow-primary-card-waiting">
          <div className="workflow-card-index">בטיפול SYSTEMIZE</div>
          <div>
            <p className="portal-eyebrow">המסמך התקבל</p>
            <h2>עוברים עכשיו על כל הפרטים</h2>
            <p>
              המסמך נעול לעריכה בזמן הבדיקה, כדי שהגרסה שנשלחה תישאר ברורה
              ומחייבת. נעדכן אותך כאן לאחר האישור.
            </p>
          </div>
          <span className="portal-status-chip">ממתין לבדיקה</span>
        </section>
      ) : !bookedMeeting && !completedMeeting ? (
        <section className="workflow-primary-card">
          <div className="workflow-card-index">הפעולה הבאה שלך</div>
          <div>
            <p className="portal-eyebrow">פגישת מיקוד</p>
            <h2>
              {availableSlots.length > 0
                ? "בחרו את המועד שנוח לכם"
                : "השאלון אושר — המועדים ייפתחו בקרוב"}
            </h2>
            <p>
              הפגישה תהיה קצרה וממוקדת. נגיע אליה אחרי שכבר למדנו את החומר,
              ולכן נוכל להתמקד בהחלטות ובשאלות החשובות.
            </p>
          </div>
          {availableSlots.length > 0 && (
            <div className="workflow-slot-grid">
              {availableSlots.map((slot) => (
                <form key={slot.id} action={bookMeetingSlot}>
                  <input type="hidden" name="projectId" value={project.id} />
                  <input type="hidden" name="slotId" value={slot.id} />
                  <input
                    type="hidden"
                    name="idempotencyKey"
                    value={randomUUID()}
                  />
                  <strong>{formatPortalDateTime(slot.starts_at)}</strong>
                  <button type="submit" className="portal-primary-action">
                    בחירת המועד
                  </button>
                </form>
              ))}
            </div>
          )}
        </section>
      ) : bookedMeeting ? (
        <section className="workflow-primary-card workflow-primary-card-confirmed">
          <div className="workflow-card-index">הפגישה הבאה</div>
          <div>
            <p className="portal-eyebrow">פגישת מיקוד נקבעה</p>
            <h2>{formatPortalDateTime(bookedMeeting.starts_at)}</h2>
            <p>
              אין צורך להכין מצגת. נגיע עם השאלות שעולות מהמסמך ונשתמש בזמן
              כדי לדייק החלטות.
            </p>
            {bookedMeetingIntegration?.status === "ready" && (
              <p>
                הזימון נשלח ל־Gmail וכולל את קישור ה־Zoom ותזכורות יום לפני
                ושעה לפני הפגישה.
              </p>
            )}
          </div>
          {bookedMeetingIntegration?.status === "ready" &&
          bookedMeetingIntegration.zoom_join_url ? (
            <a
              href={bookedMeetingIntegration.zoom_join_url}
              target="_blank"
              rel="noopener noreferrer"
              className="portal-primary-action"
            >
              הצטרפות ל־Zoom
            </a>
          ) : (
            <span className="portal-status-chip" role="status">
              מכינים את קישור ה־Zoom
            </span>
          )}
        </section>
      ) : completedMeeting && !publishedSummary ? (
        <section className="workflow-primary-card workflow-primary-card-waiting">
          <div className="workflow-card-index">בטיפול SYSTEMIZE</div>
          <div>
            <p className="portal-eyebrow">סיכום והצעה</p>
            <h2>מכינים את המסמך מהפגישה</h2>
            <p>
              הסיכום, היקף שלב האפיון, התוצרים והמחיר יפורסמו כגרסה מסודרת.
              לאחר הפרסום אפשר יהיה לצפות בה באתר ולהוריד PDF זהה.
            </p>
          </div>
        </section>
      ) : publishedSummary && !pendingPayment && !paidPayment ? (
        <section className="workflow-primary-card">
          <div className="workflow-card-index">הפעולה הבאה שלך</div>
          <div>
            <p className="portal-eyebrow">הסיכום וההצעה מוכנים</p>
            <h2>{publishedSummary.content.title}</h2>
            <p>
              גרסה {publishedSummary.versionNumber} פורסמה ונשמרה. כדאי לעבור
              על ההיקף, התוצרים, לוח הזמנים והמחיר לפני התשלום.
            </p>
          </div>
          <Link
            href={`/portal/documents/${publishedSummary.id}`}
            className="portal-primary-action"
          >
            צפייה במסמך
          </Link>
        </section>
      ) : pendingPayment ? (
        <section className="workflow-primary-card workflow-payment-card">
          <div className="workflow-card-index">הפעולה הבאה שלך</div>
          <div>
            <p className="portal-eyebrow">בקשת תשלום</p>
            <h2>{pendingPayment.title}</h2>
            <p>
              התשלום פותח את שלב האפיון והתכנון המלא, שבסופו תקבלו מסמך
              מסודר ומבנה מוסכם למערכת.
            </p>
          </div>
          <div className="workflow-payment-summary">
            <strong>{formatIls(pendingPayment.amount_agorot)}</strong>
            <a
              href={pendingPayment.payment_url}
              target="_blank"
              rel="noopener noreferrer"
              className="portal-primary-action"
            >
              מעבר מאובטח לתשלום
            </a>
          </div>
        </section>
      ) : (
        <section className="workflow-primary-card workflow-primary-card-waiting">
          <div className="workflow-card-index">בטיפול SYSTEMIZE</div>
          <div>
            <p className="portal-eyebrow">הפגישה הושלמה</p>
            <h2>מכינים את שלב האפיון והתכנון</h2>
            <p>
              סיכום הפגישה ובקשת התשלום יופיעו כאן. אין צורך לבצע פעולה כרגע.
            </p>
          </div>
        </section>
      )}

      <section className="workflow-expectations" aria-labelledby="expectations-title">
        <div>
          <p className="portal-eyebrow">מה קורה מאחורי הקלעים</p>
          <h2 id="expectations-title">בכל שלב ברור מי עושה מה</h2>
        </div>
        <ul>
          <li>
            <strong>המידע נשמר במקום אחד</strong>
            <p>אין צורך לחפש גרסאות בהודעות, במיילים או בקבצים שונים.</p>
          </li>
          <li>
            <strong>שום שלב לא מתקדם בלי אישור</strong>
            <p>מסמך, פגישה ותשלום מקבלים סטטוס ברור ומתועד.</p>
          </li>
          <li>
            <strong>תמיד רואים את הפעולה הבאה</strong>
            <p>אם נדרש ממך משהו, הוא יופיע כאן בצורה בולטת.</p>
          </li>
        </ul>
      </section>

      <ProjectHistory
        events={events}
        audience="client"
        headingId="client-history-title"
      />
    </main>
  );
}
