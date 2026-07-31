/**
 * Presentation for the append-only project history.
 *
 * The event rows are the record; this module only decides how each one reads in Hebrew
 * and whether a client should see it at all. Internal bookkeeping — a project being
 * created, an invitation being issued — is real history for the operator and noise for
 * the client, so visibility is a property of the event type rather than of the screen.
 */

export type ProjectEventActor = "client" | "systemize" | "system";

export interface ProjectEventPresentation {
  readonly title: string;
  readonly detail: string;
  readonly actor: ProjectEventActor;
  readonly clientVisible: boolean;
}

const presentations: Record<string, ProjectEventPresentation> = {
  project_created: {
    title: "הפרויקט נפתח",
    detail: "נוצרו כרטיס הלקוח והפרויקט במערכת.",
    actor: "systemize",
    clientVisible: false,
  },
  project_details_updated: {
    title: "פרטי הפרויקט עודכנו",
    detail: "שם החברה או שם הפרויקט עודכנו במערכת.",
    actor: "systemize",
    clientVisible: true,
  },
  contact_updated: {
    title: "פרטי איש קשר עודכנו",
    detail: "פרטי הקשר נשמרו ברשומת החברה.",
    actor: "systemize",
    clientVisible: false,
  },
  invitation_created: {
    title: "נשלחה הזמנה אישית",
    detail: "ההזמנה הופקה עבור כתובת Gmail אחת ותקפה לשבעה ימים.",
    actor: "systemize",
    clientVisible: false,
  },
  invitation_accepted: {
    title: "הגישה לאזור האישי הופעלה",
    detail: "ההזמנה מומשה והחשבון שויך לפרויקט.",
    actor: "client",
    clientVisible: true,
  },
  invitation_revoked: {
    title: "ההזמנה בוטלה",
    detail: "קישור ההזמנה הישן בוטל ואינו מאפשר עוד הפעלת גישה.",
    actor: "systemize",
    clientVisible: false,
  },
  invitation_reissued: {
    title: "הופקה הזמנה חלופית",
    detail: "הקישור הקודם בוטל ונוצר קישור אישי חדש לשבעה ימים.",
    actor: "systemize",
    clientVisible: false,
  },
  client_intake_submitted: {
    title: "שאלון ההיכרות נשלח",
    detail: "הגרסה שנשלחה ננעלה לעריכה ונשמרה כמסמך מחייב.",
    actor: "client",
    clientVisible: true,
  },
  client_intake_approved: {
    title: "השאלון אושר",
    detail: "הפרטים נבדקו ושלב קביעת הפגישה נפתח.",
    actor: "systemize",
    clientVisible: true,
  },
  client_intake_changes_requested: {
    title: "התבקשה השלמה בשאלון",
    detail: "השאלון נפתח שוב לעריכה יחד עם הערת הבדיקה.",
    actor: "systemize",
    clientVisible: true,
  },
  meeting_booked: {
    title: "נקבעה פגישת מיקוד",
    detail: "המועד שנבחר שוריין ונרשם בפרויקט.",
    actor: "client",
    clientVisible: true,
  },
  meeting_completed: {
    title: "הפגישה הושלמה",
    detail: "הפגישה תועדה והתהליך עבר להכנת הסיכום.",
    actor: "systemize",
    clientVisible: true,
  },
  document_draft_created: {
    title: "נוצרה טיוטת מסמך חדשה",
    detail: "נשמרה גרסת עבודה פנימית שאינה גלויה עדיין ללקוח.",
    actor: "systemize",
    clientVisible: false,
  },
  document_published: {
    title: "מסמך חדש פורסם",
    detail: "גרסה בלתי־ניתנת לשינוי זמינה לצפייה ולהורדה באזור האישי.",
    actor: "systemize",
    clientVisible: true,
  },
  payment_requested: {
    title: "פורסמה בקשת תשלום",
    detail: "פרטי התשלום והקישור המאובטח זמינים באזור האישי.",
    actor: "systemize",
    clientVisible: true,
  },
  payment_received: {
    title: "התשלום נרשם",
    detail: "קבלת התשלום אושרה והשלב הבא נפתח.",
    actor: "systemize",
    clientVisible: true,
  },
};

/*
 * An unknown type is not an error. Events are append-only, so history written by a
 * newer release must still render in an older one — and an event that cannot be
 * described is still evidence that something happened, which is worth showing to the
 * operator and worth withholding from the client until it has real wording.
 */
const unknownEvent: ProjectEventPresentation = {
  title: "עדכון בתהליך",
  detail: "נרשם אירוע נוסף בפרויקט.",
  actor: "system",
  clientVisible: false,
};

export function presentProjectEvent(
  eventType: string
): ProjectEventPresentation {
  return presentations[eventType] ?? unknownEvent;
}

export const projectEventActorLabels: Record<ProjectEventActor, string> = {
  client: "הלקוח",
  systemize: "SYSTEMIZE",
  system: "המערכת",
};
