/**
 * Site-wide identity and navigation.
 *
 * Safe to import from both server and client graphs, it holds no secrets.
 * The canonical host is still an open owner decision (AGENTS.client.md §9), so the URL
 * comes from `NEXT_PUBLIC_SITE_URL` and falls back to the development origin.
 */

export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const siteName = "Systemize";

/**
 * The owner's contact number, in three shapes because three consumers need three shapes.
 *
 *   - `display`  — Israeli local formatting, the only one a visitor ever reads.
 *   - `tel`      — E.164, required by `tel:` and by schema.org `telephone`.
 *   - `whatsapp` — E.164 without the `+`, which is the form wa.me expects in the path.
 *
 * Derived from one source so the digits cannot diverge between the footer link, the
 * floating WhatsApp button and the structured data.
 */
const phoneNational = "0544246057";

export const contact = {
  display: "054-4246057",
  tel: `+972${phoneNational.slice(1)}`,
  whatsapp: `972${phoneNational.slice(1)}`,
  /** Pre-fills the WhatsApp composer so the visitor does not face an empty box. */
  whatsappGreeting: "היי, הגעתי מהאתר של Systemize ואשמח לשמוע פרטים",
} as const;

export const siteTagline = "מערכות ניהול בענן, בנויות סביב העסק";

/**
 * The site's one plain, literal sentence about what the business does.
 *
 * Deliberately unpoetic. This is the meta description, the Open Graph description, and
 * the line a language model is most likely to quote when asked what Systemize is, and a
 * model cannot quote a metaphor. The evocative version of the same idea lives in the
 * hero, where a person reads it.
 */
export const siteDescription =
  "Systemize בונה מערכות ניהול בענן בהתאמה לעסק, משיחת ההיכרות והאפיון ועד פיתוח, הטמעה ושירות מתמשך.";

/**
 * In-page navigation. Each `href` must match a section `id` rendered on the home page,
 * so that a missing section becomes an obviously broken anchor rather than a silent
 * no-op.
 */
export const navigation = [
  { href: "#process", label: "איך זה עובד" },
  { href: "#diagnostic", label: "האזור האישי" },
  { href: "#faq", label: "שאלות" },
  { href: "#blueprint", label: "יצירת קשר" },
] as const;

export const legalRoutes = [
  { href: "/privacy", label: "מדיניות פרטיות" },
  { href: "/terms", label: "תנאי שימוש" },
  { href: "/accessibility", label: "הצהרת נגישות" },
] as const;

/** Every indexable route, used by the sitemap. */
export const indexableRoutes = [
  "/",
  ...legalRoutes.map((route) => route.href),
] as const;
