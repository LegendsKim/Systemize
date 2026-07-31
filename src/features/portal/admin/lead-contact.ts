/**
 * Turning what a visitor typed into a phone box into a link that actually opens a
 * conversation.
 *
 * The lead form accepts any 9–32 character phone string, so what arrives is whatever the
 * person felt like typing: `050-123-4567`, `+972 50 123 4567`, `00972501234567`. WhatsApp
 * needs bare international digits. Normalising at the presentation edge — rather than
 * constraining the public form — keeps the marketing site forgiving and puts the burden
 * where it belongs.
 */

const defaultCountryCode = "972";

/** E.164 allows 15 digits including the country code; below 8 is not a phone number. */
const minDigits = 8;
const maxDigits = 15;

/**
 * International digits for a lead's phone, or `null` when the input cannot be read as a
 * phone number with confidence. A wrong number is worse than no button: it opens a chat
 * with a stranger.
 */
export function toInternationalDigits(
  rawPhone: string,
  countryCode: string = defaultCountryCode
): string | null {
  const trimmed = rawPhone.trim();
  if (trimmed === "") return null;

  const explicitlyInternational = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  if (digits === "") return null;

  let normalized: string;

  if (explicitlyInternational) {
    normalized = digits;
  } else if (digits.startsWith("00")) {
    // The other international prefix. `00972…` and `+972…` are the same number.
    normalized = digits.slice(2);
  } else if (digits.startsWith("0")) {
    normalized = `${countryCode}${digits.slice(1)}`;
  } else if (digits.startsWith(countryCode)) {
    normalized = digits;
  } else {
    /*
     * A national number written without its trunk zero — "501234567". Prefixing the
     * country code is a guess, so it is only made for a length that matches a local
     * subscriber number. Anything else falls through to null rather than inventing a
     * plausible-looking destination.
     */
    normalized =
      digits.length >= 9 && digits.length <= 10
        ? `${countryCode}${digits}`
        : digits;
  }

  if (normalized.length < minDigits || normalized.length > maxDigits) {
    return null;
  }
  return normalized;
}

export interface LeadContactSubject {
  readonly fullName: string;
  readonly businessName: string;
  readonly phone: string;
}

/** The opening line, so the operator never starts a conversation from a blank box. */
export function buildWhatsAppMessage(lead: LeadContactSubject): string {
  const firstName = lead.fullName.trim().split(/\s+/)[0] ?? "";
  const greeting = firstName ? `היי ${firstName},` : "היי,";
  const business = lead.businessName.trim();

  return [
    `${greeting} כאן SYSTEMIZE.`,
    business
      ? `קיבלנו את הפנייה שלך בנוגע ל${business} ורצינו להמשיך מכאן.`
      : "קיבלנו את הפנייה שלך ורצינו להמשיך מכאן.",
    "מתי נוח לך לשיחה קצרה?",
  ].join(" ");
}

/**
 * A `wa.me` link that opens the chat with the message already drafted, or `null` when the
 * phone could not be normalised — in which case the screen shows the plain number instead
 * of a button that would go nowhere useful.
 */
export function buildWhatsAppHref(lead: LeadContactSubject): string | null {
  const digits = toInternationalDigits(lead.phone);
  if (!digits) return null;

  return `https://wa.me/${digits}?text=${encodeURIComponent(
    buildWhatsAppMessage(lead)
  )}`;
}

/** `tel:` needs the same normalisation, and is the fallback when WhatsApp is not viable. */
export function buildTelHref(rawPhone: string): string {
  const digits = toInternationalDigits(rawPhone);
  return digits ? `tel:+${digits}` : `tel:${rawPhone.replace(/\s/g, "")}`;
}
