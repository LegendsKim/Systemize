import { toInternationalDigits } from "@/features/portal/admin/lead-contact";

/**
 * The message that carries a portal invitation to the person it belongs to.
 *
 * A bare link is the worst way to send one of these. It arrives with no sender, no
 * explanation of what pressing it does, and no reason to trust it — so it gets ignored,
 * and the operator ends up explaining the whole thing by hand anyway. The text below says
 * who it is from, what the client will be asked for, and what the link is worth: one
 * Gmail address, one project, seven days.
 *
 * The preview image is not attached here and does not need to be. `/invite/<token>` ships
 * Open Graph metadata pointing at the SYSTEMIZE invitation card, so WhatsApp renders it
 * from the link itself — and it stays generic on purpose, because a preview is visible to
 * anyone the message is forwarded to.
 */

export interface InvitationShareSubject {
  readonly fullName: string;
  readonly projectName: string;
  readonly shareUrl: string;
}

export function buildInvitationMessage(subject: InvitationShareSubject): string {
  const firstName = subject.fullName.trim().split(/\s+/)[0] ?? "";
  const greeting = firstName ? `היי ${firstName},` : "היי,";
  const project = subject.projectName.trim();

  return [
    `${greeting} כאן SYSTEMIZE.`,
    project
      ? `פתחנו עבורך אזור אישי לפרויקט ${project} — כל השלבים, המסמכים וההחלטות במקום אחד.`
      : "פתחנו עבורך אזור אישי לפרויקט — כל השלבים, המסמכים וההחלטות במקום אחד.",
    "",
    "זה הקישור האישי שלך:",
    subject.shareUrl,
    "",
    "מה קורה כשנכנסים: מתחברים פעם אחת עם חשבון ה־Gmail שאליו נשלחה ההזמנה, ומשם רואים מיד את השלב הנוכחי ואת מה שממתין לך. הקישור אישי, תקף לשבעה ימים ומשויך לפרויקט הזה בלבד.",
    "",
    "כדאי להוסיף את האזור האישי למסך הבית ולאשר התראות, כדי לדעת על כל עדכון בזמן אמת.",
  ].join("\n");
}

/**
 * A `wa.me` link with the invitation already drafted, or `null` when the phone cannot be
 * read as a number with confidence — a button that opens a chat with a stranger is worse
 * than no button.
 */
export function buildInvitationWhatsAppHref(
  subject: InvitationShareSubject & { readonly phone: string }
): string | null {
  const digits = toInternationalDigits(subject.phone);
  if (!digits) return null;

  return `https://wa.me/${digits}?text=${encodeURIComponent(
    buildInvitationMessage(subject)
  )}`;
}
