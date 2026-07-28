import { contact } from "@/lib/site-config";

/**
 * Floating WhatsApp launcher, pinned to the bottom inline-end corner.
 *
 * A Server Component, and deliberately a plain anchor rather than a widget: opening a
 * conversation is a navigation, so the platform's own link affordances — focus ring,
 * middle-click, long-press, "copy link" — all work without a line of JavaScript.
 *
 * Position uses `inset-inline-start`, which resolves to the visual right on this RTL site.
 * That is both the requested corner and the rule in AGENTS.md §7: a physical `right` here
 * would strand the button on the wrong side the moment a page renders LTR.
 *
 * Layout is a flex row of [disc, bubble]. Under RTL the first child sits rightmost, so the
 * disc lands against the screen edge and the bubble opens away from it, toward the visual
 * left — the requested direction, achieved by document order rather than by a physical
 * offset, so it stays correct in either direction.
 *
 * The `aria-label` opens with the bubble's visible words. WCAG 2.5.3 requires the
 * accessible name to contain the visible label, and an `aria-label` silently replaces it,
 * so "דברו איתי" has to lead here rather than being paraphrased away.
 */
export function WhatsAppLauncher() {
  const href = `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(
    contact.whatsappGreeting
  )}`;

  return (
    <a
      className="whatsapp-launcher"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="דברו איתי בווטסאפ, נפתח בלשונית חדשה"
    >
      <span className="whatsapp-launcher-disc">
          <svg
          viewBox="0 0 24 24"
          width="26"
          height="26"
          fill="currentColor"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.4" />
        </svg>
      </span>

      <span className="whatsapp-launcher-bubble">דברו איתי</span>
    </a>
  );
}
