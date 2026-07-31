import { randomUUID } from "node:crypto";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CompanyPersonForm } from "@/features/portal/admin/CompanyPersonForm";
import { InvitationLifecycleActions } from "@/features/portal/admin/InvitationLifecycleActions";
import {
  hasInternalNotes,
  projectReadinessLabels,
} from "@/features/portal/admin/internal-notes";
import { InternalNotesForm } from "@/features/portal/admin/InternalNotesForm";
import { ProjectDetailsForm } from "@/features/portal/admin/ProjectDetailsForm";
import { ProjectInvitationForm } from "@/features/portal/admin/ProjectInvitationForm";
import {
  canReissueInvitation,
  canRevokeInvitation,
  getInvitationDisplayStatus,
  invitationStatusLabels,
} from "@/features/portal/invitations/lifecycle";
import { createInvitationTokenPair } from "@/features/portal/invitations/tokens";
import { AdminDocumentPanel } from "@/features/portal/documents/AdminDocumentPanel";
import { projectStageLabels } from "@/features/portal/project-stage";
import {
  completeProjectMeeting,
  markPaymentReceived,
  reviewClientIntake,
} from "@/features/portal/workflow/actions";
import { formatIls, formatPortalDateTime } from "@/features/portal/workflow/format";
import {
  intakeSections,
  intakeStatusLabels,
  parseIntakeAnswers,
} from "@/features/portal/workflow/intake";
import { MeetingSlotForm } from "@/features/portal/workflow/MeetingSlotForm";
import { PaymentRequestForm } from "@/features/portal/workflow/PaymentRequestForm";
import { ProjectHistory } from "@/features/portal/workflow/ProjectHistory";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  getProjectWorkflow,
  listCompanyPeople,
  listProjectEvents,
  listProjectInvitations,
} from "@/server/repositories/workflow.repository";
import { listProjectDocuments } from "@/server/repositories/document.repository";
import { getProjectInternalNotes } from "@/server/repositories/portal.repository";

type AdminProjectPageProps = {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ notice?: string }>;
};

/** Outcome messages, with the tone the operator should read them in. */
const noticeCopy: Record<string, { text: string; tone?: "attention" }> = {
  "review-saved": {
    text: "החלטת הבדיקה נשמרה והלקוח קיבל התראה באזור האישי.",
  },
  "review-failed": {
    text: "לא ניתן היה לשמור את החלטת הבדיקה. לא נשלחה הודעה ללקוח.",
    tone: "attention",
  },
  "slot-created": { text: "המועד נפתח לבחירה והלקוח קיבל התראה." },
  "meeting-completed": {
    text: "הפגישה סומנה כהושלמה. עכשיו אפשר להכין ולפרסם את הסיכום והצעת האפיון.",
  },
  "payment-created": { text: "בקשת התשלום פורסמה באזור האישי של הלקוח." },
  "payment-received": {
    text: "התשלום סומן כהתקבל והפרויקט התקדם לשלב הבא.",
  },
  "invitation-revoked": {
    text: "ההזמנה בוטלה. הקישור הישן אינו מאפשר עוד הפעלת גישה.",
  },
  "invitation-revoke-failed": {
    text: "לא ניתן היה לבטל את ההזמנה. לא בוצע שינוי בגישה.",
    tone: "attention",
  },
  "project-details-updated": {
    text: "פרטי החברה והפרויקט עודכנו בכל האזורים.",
  },
  "project-details-failed": {
    text: "לא ניתן היה לעדכן את פרטי החברה והפרויקט.",
    tone: "attention",
  },
  "contact-updated": {
    text: "פרטי איש הקשר עודכנו.",
  },
  "contact-updated-invitation-revoked": {
    text: "כתובת ה־Gmail עודכנה וכל הזמנה ישנה בוטלה. יש להפיק קישור חדש.",
    tone: "attention",
  },
  "internal-notes-saved": {
    text: "ההערות הפנימיות נשמרו. הן גלויות לך בלבד.",
  },
  "contact-email-locked": {
    text: "לא ניתן לשנות Gmail לאחר הפעלת החשבון. אפשר לעדכן שם וטלפון.",
    tone: "attention",
  },
  "contact-update-failed": {
    text: "לא ניתן היה לעדכן את איש הקשר.",
    tone: "attention",
  },
  "document-published": {
    text: "גרסת המסמך פורסמה ללקוח ונשמרה כגרסה בלתי־ניתנת לשינוי.",
  },
  "document-draft-saved": {
    text: "טיוטת המסמך נשמרה כגרסה חדשה. היא עדיין אינה גלויה ללקוח.",
  },
  "document-publish-failed": {
    text: "לא ניתן היה לפרסם את גרסת המסמך. לא בוצע שינוי ללקוח.",
    tone: "attention",
  },
};

export default async function AdminProjectPage({
  params,
  searchParams,
}: AdminProjectPageProps) {
  const [{ projectId }, query] = await Promise.all([params, searchParams]);
  const supabase = await createServerSupabaseClient();
  const { data: project, error } = await supabase
    .from("projects")
    .select("id,name,stage,company_id,progress_percent")
    .eq("id", projectId)
    .maybeSingle();

  if (error || !project) {
    notFound();
  }

  const [
    { data: company },
    workflow,
    events,
    invitations,
    companyPeople,
    documents,
    internalNotes,
  ] = await Promise.all([
    supabase
      .from("companies")
      .select("name")
      .eq("id", project.company_id)
      .maybeSingle(),
    getProjectWorkflow(supabase, projectId),
    listProjectEvents(supabase, projectId),
    listProjectInvitations(supabase, projectId),
    listCompanyPeople(supabase, project.company_id),
    listProjectDocuments(supabase, [projectId]),
    getProjectInternalNotes(supabase, projectId),
  ]);

  const invitation = createInvitationTokenPair();
  const now = new Date();
  const hasLiveInvitation = invitations.some(
    (item) =>
      getInvitationDisplayStatus(
        { status: item.status, expiresAt: item.expiresAt },
        now
      ) === "pending"
  );
  const answers = workflow.intake
    ? parseIntakeAnswers(workflow.intake.answers)
    : null;
  const bookedMeeting = workflow.meetingSlots.find(
    (slot) => slot.status === "booked"
  );
  const completedMeeting = workflow.meetingSlots.find(
    (slot) => slot.status === "completed"
  );
  const pendingPayment = workflow.payments.find(
    (payment) => payment.status === "pending"
  );
  const introductoryDocument =
    documents.find((document) => document.kind === "introductory_summary") ??
    null;
  const notice = query.notice ? noticeCopy[query.notice] : undefined;

  /*
   * The stepper is derived here rather than inline in the markup, so the four states are
   * decided in one place and can be read as a single sequence instead of four nested
   * ternaries scattered through the JSX.
   */
  const steps = [
    {
      title: "הזמנה",
      state: workflow.intake ? "complete" : "current",
      detail: workflow.intake ? "הלקוח נכנס" : "ממתין לכניסת הלקוח",
    },
    {
      title: "מסמך היכרות",
      state:
        workflow.intake?.status === "approved"
          ? "complete"
          : workflow.intake
            ? "current"
            : "upcoming",
      detail: workflow.intake
        ? intakeStatusLabels[workflow.intake.status]
        : "טרם התחיל",
    },
    {
      title: "פגישה",
      state: completedMeeting
        ? "complete"
        : bookedMeeting
          ? "current"
          : "upcoming",
      detail: completedMeeting
        ? "הושלמה"
        : bookedMeeting
          ? formatPortalDateTime(bookedMeeting.starts_at)
          : "טרם נקבעה",
    },
    {
      title: "תשלום",
      state: pendingPayment ? "current" : "upcoming",
      detail: pendingPayment ? "ממתין ללקוח" : "טרם פורסם",
    },
  ] as const;

  return (
    <main id="main-content" className="admin-page">
      <Link href="/admin" className="admin-back-link">
        <span aria-hidden="true">→</span> חזרה לסקירה
      </Link>

      {notice && (
        <p className="admin-notice" data-tone={notice.tone} role="status">
          {notice.text}
        </p>
      )}

      <div className="admin-workspace-head">
        <div>
          <p className="admin-eyebrow">{company?.name ?? "לקוח פוטנציאלי"}</p>
          <h1>{project.name}</h1>
          <p>
            ניהול המסע מהזמנה ראשונית ועד תשלום עבור האפיון, בתמונת מצב אחת.
          </p>
        </div>
        <div className="admin-workspace-stage">
          <span>שלב נוכחי</span>
          <strong>{projectStageLabels[project.stage]}</strong>
          <small>{project.progress_percent}% התקדמות מאושרת</small>
        </div>
      </div>

      <ol className="admin-stepper" aria-label="מצב התהליך">
        {steps.map((step, index) => (
          <li key={step.title} data-state={step.state}>
            <span className="admin-stepper-index">
              {String(index + 1).padStart(2, "0")}
            </span>
            <strong>{step.title}</strong>
            <small>{step.detail}</small>
          </li>
        ))}
      </ol>

      <div className="admin-workspace-grid">
        <section className="admin-panel" aria-labelledby="project-details-title">
          <div className="admin-panel-head">
            <div>
              <h2 id="project-details-title">פרטי החברה והפרויקט</h2>
              <p>
                השמות האלה מוצגים ללקוח באזור האישי ובכל מסמך עתידי.
              </p>
            </div>
          </div>
          <details>
            <summary>עריכת הפרטים</summary>
            <ProjectDetailsForm
              projectId={project.id}
              companyName={company?.name ?? ""}
              projectName={project.name}
              idempotencyKey={randomUUID()}
            />
          </details>
        </section>

        <section className="admin-panel" aria-labelledby="people-title">
          <div className="admin-panel-head">
            <div>
              <h2 id="people-title">אנשי קשר</h2>
              <p>
                כל איש קשר שייך לחברה. גישה בפועל נשארת מוגבלת לחברות בפרויקט.
              </p>
            </div>
            <span className="admin-chip">{companyPeople.length} אנשי קשר</span>
          </div>
          {companyPeople.length === 0 ? (
            <p>אנשי קשר יופיעו לאחר יצירת ההזמנה הראשונה.</p>
          ) : (
            <div className="admin-contact-list">
              {companyPeople.map((person) => (
                <details key={person.id}>
                  <summary>
                    {person.fullName} ·{" "}
                    {person.activated ? "חשבון פעיל" : "טרם הופעל"}
                  </summary>
                  <CompanyPersonForm
                    projectId={project.id}
                    personId={person.id}
                    fullName={person.fullName}
                    email={person.email}
                    phone={person.phone}
                    activated={person.activated}
                    idempotencyKey={randomUUID()}
                  />
                </details>
              ))}
            </div>
          )}
        </section>

        <section className="admin-panel" aria-labelledby="invite-title">
          <div className="admin-panel-head">
            <div>
              <h2 id="invite-title">הזמנה אישית</h2>
              <p>
                ההזמנה קשורה לכתובת Gmail אחת בלבד ומעניקה גישה לפרויקט הזה
                בלבד.
              </p>
            </div>
            <span className="admin-chip">תקפה ל־7 ימים</span>
          </div>

          {invitations.length > 0 && (
            <ul className="admin-invitation-list" aria-label="הזמנות לפרויקט">
              {invitations.map((item) => {
                const displayStatus = getInvitationDisplayStatus(
                  { status: item.status, expiresAt: item.expiresAt },
                  now
                );
                const allowReissue = canReissueInvitation(displayStatus);
                const allowRevoke = canRevokeInvitation(displayStatus);
                const replacement = allowReissue
                  ? createInvitationTokenPair()
                  : null;

                return (
                  <li key={item.id}>
                    <div className="admin-invitation-identity">
                      <strong>{item.fullName}</strong>
                      <span dir="ltr">{item.email}</span>
                      <small>
                        נוצרה {formatPortalDateTime(item.createdAt)} ·{" "}
                        {displayStatus === "pending"
                          ? `בתוקף עד ${formatPortalDateTime(item.expiresAt)}`
                          : invitationStatusLabels[displayStatus]}
                      </small>
                    </div>
                    <span
                      className="admin-chip"
                      data-tone={
                        displayStatus === "accepted"
                          ? "positive"
                          : displayStatus === "pending"
                            ? "attention"
                            : undefined
                      }
                    >
                      {invitationStatusLabels[displayStatus]}
                    </span>
                    {(allowReissue || allowRevoke) && (
                      <InvitationLifecycleActions
                        projectId={project.id}
                        invitationId={item.id}
                        replacementInvitationId={randomUUID()}
                        invitationToken={replacement?.token ?? ""}
                        revokeIdempotencyKey={randomUUID()}
                        reissueIdempotencyKey={randomUUID()}
                        allowRevoke={allowRevoke}
                        allowReissue={allowReissue}
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          <details open={invitations.length === 0}>
            <summary>
              {hasLiveInvitation
                ? "הזמנת בעלים נוסף"
                : "פתיחת טופס הזמנה חדשה"}
            </summary>
            <ProjectInvitationForm
              projectId={project.id}
              invitationId={randomUUID()}
              invitationToken={invitation.token}
              idempotencyKey={randomUUID()}
            />
          </details>
        </section>

        {/*
          The private half of the post-call record. The published summary next to it
          proves the client was heard; this one holds the judgement that would end the
          relationship if it were ever rendered on their screen — so it is owner-only at
          the database, not merely absent from the client's routes.
        */}
        <section className="admin-panel" aria-labelledby="internal-notes-title">
          <div className="admin-panel-head">
            <div>
              <h2 id="internal-notes-title">הערות פנימיות</h2>
              <p>
                גלוי לך בלבד. לא נכנס לסיכום, ל־PDF, להתראות או לכל מסך של
                הלקוח.
              </p>
            </div>
            <span
              className="admin-chip"
              data-tone={
                internalNotes.readiness === "high"
                  ? "positive"
                  : internalNotes.readiness === "low"
                    ? "attention"
                    : undefined
              }
            >
              {projectReadinessLabels[internalNotes.readiness]}
            </span>
          </div>
          <details open={!hasInternalNotes(internalNotes)}>
            <summary>
              {hasInternalNotes(internalNotes)
                ? "עריכת ההערות"
                : "רישום ההערות מהשיחה"}
            </summary>
            <InternalNotesForm
              projectId={project.id}
              defaults={internalNotes}
            />
          </details>
        </section>

        <section className="admin-panel" aria-labelledby="intake-title">
          <div className="admin-panel-head">
            <div>
              <h2 id="intake-title">שאלון היכרות עסקי</h2>
              <p>מסמך חסוי. נחשף רק לך וללקוח שמילא אותו.</p>
            </div>
            <span
              className="admin-chip"
              data-tone={
                workflow.intake?.status === "submitted"
                  ? "attention"
                  : workflow.intake?.status === "approved"
                    ? "positive"
                    : undefined
              }
            >
              {workflow.intake
                ? intakeStatusLabels[workflow.intake.status]
                : "טרם נפתח"}
            </span>
          </div>

          {!workflow.intake ? (
            <p>לאחר שהלקוח ייכנס, המסמך יופיע באזור האישי שלו.</p>
          ) : answers ? (
            <>
              <div className="admin-intake">
                {intakeSections.map((section) => (
                  <details key={section.title}>
                    <summary>{section.title}</summary>
                    <dl>
                      {section.fields.map((field) => (
                        <div key={field.name}>
                          <dt>{field.label}</dt>
                          <dd>{answers[field.name] || "לא נמסרה תשובה"}</dd>
                        </div>
                      ))}
                    </dl>
                  </details>
                ))}
              </div>

              {workflow.intake.status === "submitted" && (
                <form action={reviewClientIntake} className="admin-form">
                  <input type="hidden" name="projectId" value={project.id} />
                  <input
                    type="hidden"
                    name="idempotencyKey"
                    value={randomUUID()}
                  />
                  <div className="admin-field">
                    <label htmlFor="review-note">
                      <span>הערה ללקוח, במידת הצורך</span>
                    </label>
                    <textarea
                      id="review-note"
                      name="reviewNote"
                      rows={4}
                      maxLength={2000}
                      placeholder="אם חסר מידע, כתוב כאן בצורה ממוקדת מה להשלים."
                    />
                    <p className="admin-field-help">
                      ההערה נשלחת ללקוח כפי שהיא. בבקשת השלמה היא חובה בפועל,
                      אחרת הלקוח לא ידע מה לתקן.
                    </p>
                  </div>
                  <div className="admin-form-actions">
                    <button
                      type="submit"
                      name="decision"
                      value="approve"
                      className="admin-button"
                    >
                      אישור המסמך
                    </button>
                    <button
                      type="submit"
                      name="decision"
                      value="request_changes"
                      className="admin-button"
                      data-variant="secondary"
                    >
                      בקשת השלמה
                    </button>
                  </div>
                </form>
              )}
            </>
          ) : null}
        </section>

        <section className="admin-panel" aria-labelledby="meeting-title">
          <div className="admin-panel-head">
            <div>
              <h2 id="meeting-title">פגישת היכרות</h2>
              <p>הלקוח בוחר מועד אחד מתוך אלה שתפתח.</p>
            </div>
          </div>

          {bookedMeeting ? (
            <>
              <ul className="admin-list">
                <li>
                  <div>
                    <strong>{formatPortalDateTime(bookedMeeting.starts_at)}</strong>
                    <span>המועד שהלקוח בחר</span>
                  </div>
                  <span className="admin-chip" data-tone="positive">
                    נקבעה
                  </span>
                </li>
              </ul>
              <form action={completeProjectMeeting} className="admin-form-actions">
                <input type="hidden" name="projectId" value={project.id} />
                <input type="hidden" name="slotId" value={bookedMeeting.id} />
                <input type="hidden" name="idempotencyKey" value={randomUUID()} />
                <button type="submit" className="admin-button">
                  סימון הפגישה כהושלמה
                </button>
              </form>
            </>
          ) : completedMeeting ? (
            <p>הפגישה הושלמה ותועדה. אפשר להמשיך לבקשת התשלום.</p>
          ) : workflow.intake?.status === "approved" ? (
            <>
              <p>פתח כמה מועדים אפשריים. הלקוח יוכל לבחור מועד אחד בלבד.</p>
              <MeetingSlotForm
                projectId={project.id}
                idempotencyKey={randomUUID()}
              />
              {workflow.meetingSlots.some(
                (slot) => slot.status === "available"
              ) && (
                <ul className="admin-list">
                  {workflow.meetingSlots
                    .filter((slot) => slot.status === "available")
                    .map((slot) => (
                      <li key={slot.id}>
                        <div>
                          <strong>{formatPortalDateTime(slot.starts_at)}</strong>
                          <span>פתוח לבחירה</span>
                        </div>
                      </li>
                    ))}
                </ul>
              )}
            </>
          ) : (
            <p>אפשר לפתוח מועדים לאחר אישור מסמך ההיכרות.</p>
          )}
        </section>

        <AdminDocumentPanel
          projectId={project.id}
          document={introductoryDocument}
          meetingCompleted={Boolean(completedMeeting)}
        />

        <section
          id="payment-request"
          className="admin-panel"
          aria-labelledby="payment-title"
        >
          <div className="admin-panel-head">
            <div>
              <h2 id="payment-title">בקשות תשלום</h2>
              <p>נפתח לאחר שהפגישה סומנה כהושלמה.</p>
            </div>
          </div>

          {completedMeeting && introductoryDocument?.latestPublished ? (
            <PaymentRequestForm
              projectId={project.id}
              idempotencyKey={randomUUID()}
            />
          ) : completedMeeting ? (
            <p>
              יש לפרסם ללקוח את הסיכום וההצעה לאפיון לפני פתיחת בקשת תשלום.
            </p>
          ) : (
            <p>בקשת התשלום תיפתח לאחר סימון הפגישה כהושלמה.</p>
          )}

          {workflow.payments.length > 0 && (
            <ul className="admin-list">
              {workflow.payments.map((payment) => (
                <li key={payment.id}>
                  <div>
                    <strong>{payment.title}</strong>
                    <span>{formatIls(payment.amount_agorot)}</span>
                  </div>
                  <span
                    className="admin-chip"
                    data-tone={
                      payment.status === "paid"
                        ? "positive"
                        : payment.status === "pending"
                          ? "attention"
                          : undefined
                    }
                  >
                    {payment.status === "paid"
                      ? "שולם"
                      : payment.status === "pending"
                        ? "ממתין"
                        : "בוטל"}
                  </span>
                  {payment.status === "pending" && (
                    <form action={markPaymentReceived}>
                      <input type="hidden" name="projectId" value={project.id} />
                      <input
                        type="hidden"
                        name="paymentRequestId"
                        value={payment.id}
                      />
                      <input
                        type="hidden"
                        name="idempotencyKey"
                        value={randomUUID()}
                      />
                      <button
                        type="submit"
                        className="admin-button"
                        data-variant="secondary"
                      >
                        סימון כהתקבל
                      </button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="admin-panel">
          <ProjectHistory
            events={events}
            audience="owner"
            headingId="history-title"
          />
        </div>
      </div>
    </main>
  );
}
