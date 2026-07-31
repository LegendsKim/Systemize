import type {
  IntakeStatus,
  MeetingSlotStatus,
  PaymentRequestStatus,
  ProjectStage,
} from "@/lib/supabase/types";

/**
 * The one place that answers "who acts now, and what is the next action".
 *
 * Both surfaces read the same derivation: the client sees the actions they own, the
 * operator sees the actions SYSTEMIZE owns, and neither screen is allowed to invent a
 * third opinion about the state of a project. It is deliberately pure — `now` is passed
 * in rather than read — so the answer is testable and identical on server and client.
 */

export type PortalActionOwner = "client" | "systemize";

export type PortalActionKind =
  | "start_intake"
  | "continue_intake"
  | "revise_intake"
  | "review_intake"
  | "publish_meeting_slots"
  | "book_meeting"
  | "attend_meeting"
  | "complete_meeting"
  | "prepare_summary"
  | "publish_summary"
  | "review_summary"
  | "publish_payment_request"
  | "pay_request"
  | "record_payment";

/** `now` demands attention today; `waiting` is visible progress that needs no one. */
export type PortalActionUrgency = "now" | "waiting";

export interface PortalActionProject {
  readonly id: string;
  readonly name: string;
  readonly companyName: string;
  readonly stage: ProjectStage;
}

export interface PortalActionIntake {
  readonly status: IntakeStatus;
  readonly reviewNote: string | null;
}

export interface PortalActionMeetingSlot {
  readonly id: string;
  readonly status: MeetingSlotStatus;
  readonly startsAt: string;
}

export interface PortalActionPayment {
  readonly id: string;
  readonly status: PaymentRequestStatus;
  readonly title: string;
  readonly amountAgorot: number;
}

export interface PortalActionDocumentState {
  readonly latestDraftVersionId: string | null;
  readonly latestPublishedVersionId: string | null;
}

export interface PortalActionInput {
  readonly project: PortalActionProject;
  readonly intake: PortalActionIntake | null;
  readonly meetingSlots: readonly PortalActionMeetingSlot[];
  readonly payments: readonly PortalActionPayment[];
  readonly documents: PortalActionDocumentState;
  readonly now: Date;
}

export interface PortalAction {
  /** Stable across renders and reloads, so a list can be keyed and linked to. */
  readonly id: string;
  readonly kind: PortalActionKind;
  readonly owner: PortalActionOwner;
  readonly urgency: PortalActionUrgency;
  readonly projectId: string;
  readonly projectName: string;
  readonly companyName: string;
  readonly title: string;
  readonly detail: string;
  readonly cta: string;
  readonly clientHref: string;
  readonly ownerHref: string;
}

/** A closed project has no next action; showing one would be a lie about the state. */
const closedStages: ReadonlySet<ProjectStage> = new Set<ProjectStage>([
  "completed",
  "cancelled",
]);

export function derivePortalActions(
  input: PortalActionInput
): readonly PortalAction[] {
  const { project, intake, meetingSlots, payments, documents, now } = input;

  if (closedStages.has(project.stage)) {
    return [];
  }

  const clientHref = `/portal/projects/${project.id}`;
  const ownerHref = `/admin/projects/${project.id}`;

  const build = (
    kind: PortalActionKind,
    owner: PortalActionOwner,
    urgency: PortalActionUrgency,
    title: string,
    detail: string,
    cta: string,
    hrefs?: { readonly client?: string; readonly owner?: string }
  ): PortalAction => ({
    id: `${project.id}:${kind}`,
    kind,
    owner,
    urgency,
    projectId: project.id,
    projectName: project.name,
    companyName: project.companyName,
    title,
    detail,
    cta,
    clientHref: hrefs?.client ?? clientHref,
    ownerHref: hrefs?.owner ?? ownerHref,
  });

  const actions: PortalAction[] = [];

  const bookedMeeting = meetingSlots.find((slot) => slot.status === "booked");
  const completedMeeting = meetingSlots.find(
    (slot) => slot.status === "completed"
  );
  const openSlots = meetingSlots.filter(
    (slot) => slot.status === "available" && new Date(slot.startsAt) > now
  );
  const pendingPayment = payments.find(
    (payment) => payment.status === "pending"
  );
  const paidPayment = payments.find((payment) => payment.status === "paid");

  // 1 — the intake gate. Nothing downstream opens until it is approved.
  if (!intake) {
    actions.push(
      build(
        "start_intake",
        "client",
        "now",
        "מילוי שאלון ההיכרות",
        "שאלון קצר בחמישה שלבים שמכין את הפגישה. אפשר לשמור ולחזור.",
        "פתיחת השאלון",
        { client: `${clientHref}/discovery` }
      )
    );
  } else if (intake.status === "draft") {
    actions.push(
      build(
        "continue_intake",
        "client",
        "now",
        "השלמת שאלון ההיכרות",
        "הטיוטה שמורה וממתינה להמשך מאותה נקודה בדיוק.",
        "המשך מילוי",
        { client: `${clientHref}/discovery` }
      )
    );
  } else if (intake.status === "changes_requested") {
    actions.push(
      build(
        "revise_intake",
        "client",
        "now",
        "תיקון קצר בשאלון",
        intake.reviewNote?.trim()
          ? intake.reviewNote.trim()
          : "עברנו על השאלון ויש כמה פרטים להשלים לפני שממשיכים.",
        "עדכון התשובות",
        { client: `${clientHref}/discovery` }
      )
    );
  } else if (intake.status === "submitted") {
    actions.push(
      build(
        "review_intake",
        "systemize",
        "now",
        "שאלון ממתין לבדיקה",
        "יש להחליט: אישור השאלון או בקשת השלמה ממוקדת.",
        "מעבר לבדיקה"
      )
    );
  }

  const intakeApproved = intake?.status === "approved";

  // 2 — scheduling. Only reachable once the intake is approved.
  if (intakeApproved && !bookedMeeting && !completedMeeting) {
    if (openSlots.length > 0) {
      actions.push(
        build(
          "book_meeting",
          "client",
          "now",
          "בחירת מועד לפגישת המיקוד",
          `${openSlots.length} מועדים פתוחים לבחירה. אפשר לתפוס אחד מהם.`,
          "בחירת מועד"
        )
      );
    } else {
      actions.push(
        build(
          "publish_meeting_slots",
          "systemize",
          "now",
          "פרסום מועדים לפגישה",
          "השאלון אושר והלקוח ממתין למועדים שיפתחו לבחירה.",
          "פתיחת מועדים"
        )
      );
    }
  }

  if (bookedMeeting) {
    actions.push(
      build(
        "attend_meeting",
        "client",
        "waiting",
        "פגישת המיקוד נקבעה",
        "המועד שמור. אין צורך בהכנה מוקדמת מצדך.",
        "צפייה בפרטים"
      )
    );
    actions.push(
      build(
        "complete_meeting",
        "systemize",
        "now",
        "סימון הפגישה כהושלמה",
        "רק לאחר הסימון נפתחת האפשרות לפרסם בקשת תשלום.",
        "עדכון הפגישה"
      )
    );
  }

  // 3 — the commercial gate. The client sees a published, immutable summary before
  // payment can be requested; payment, not agreement alone, opens the next stage.
  if (pendingPayment) {
    actions.push(
      build(
        "pay_request",
        "client",
        "now",
        pendingPayment.title,
        "התשלום פותח את השלב הבא בתהליך.",
        "מעבר לתשלום"
      )
    );
    actions.push(
      build(
        "record_payment",
        "systemize",
        "waiting",
        "בקשת תשלום פתוחה",
        "השלב הבא ייפתח רק לאחר שתסמן שהתשלום התקבל.",
        "רישום התשלום"
      )
    );
  } else if (completedMeeting && !paidPayment) {
    if (!documents.latestPublishedVersionId) {
      actions.push(
        build(
          documents.latestDraftVersionId ? "publish_summary" : "prepare_summary",
          "systemize",
          "now",
          documents.latestDraftVersionId
            ? "פרסום סיכום הפגישה"
            : "הכנת סיכום והצעת אפיון",
          documents.latestDraftVersionId
            ? "הטיוטה שמורה. יש לבדוק ולפרסם אותה לפני שאפשר לפתוח בקשת תשלום."
            : "הפגישה הושלמה. יש להכין ללקוח סיכום מסודר, תכולה ותנאים מסחריים.",
          documents.latestDraftVersionId ? "בדיקה ופרסום" : "יצירת הסיכום",
          { owner: `${ownerHref}#introductory-summary` }
        )
      );
    } else {
      actions.push(
        build(
          "review_summary",
          "client",
          "now",
          "סיכום הפגישה והצעת האפיון מוכנים",
          "המסמך פורסם עבורך וכולל את התכולה, התוצרים, לוח הזמנים והתנאים המסחריים.",
          "צפייה במסמך",
          {
            client: `/portal/documents/${documents.latestPublishedVersionId}`,
          }
        ),
        build(
          "publish_payment_request",
          "systemize",
          "now",
          "פתיחת בקשת תשלום",
          "הסיכום פורסם ללקוח. כעת אפשר לפתוח את בקשת התשלום לשלב האפיון.",
          "פתיחת בקשת תשלום",
          { owner: `${ownerHref}#payment-request` }
        )
      );
    }
  }

  return sortActions(actions);
}

/*
 * Ordering is part of the answer: an action that requires a person today outranks one
 * that only reports progress, and within the same urgency the client's own work comes
 * first on both surfaces. Anything else forces the reader to scan for the urgent row.
 */
const urgencyRank: Record<PortalActionUrgency, number> = {
  now: 0,
  waiting: 1,
};

function sortActions(actions: readonly PortalAction[]): readonly PortalAction[] {
  return [...actions].sort(
    (left, right) =>
      urgencyRank[left.urgency] - urgencyRank[right.urgency] ||
      Number(left.owner === "systemize") - Number(right.owner === "systemize")
  );
}

export function actionsFor(
  actions: readonly PortalAction[],
  owner: PortalActionOwner
): readonly PortalAction[] {
  return actions.filter((action) => action.owner === owner);
}

/** How many actions genuinely require this party today. Drives badges and counts. */
export function countRequiredActions(
  actions: readonly PortalAction[],
  owner: PortalActionOwner
): number {
  return actions.filter(
    (action) => action.owner === owner && action.urgency === "now"
  ).length;
}
