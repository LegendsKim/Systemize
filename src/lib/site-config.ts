/**
 * Site-wide identity and navigation.
 *
 * Safe to import from both server and client graphs — it holds no secrets.
 * The canonical host is still an open owner decision (AGENTS.client.md §9), so the URL
 * comes from `NEXT_PUBLIC_SITE_URL` and falls back to the development origin.
 */

export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const siteName = "Systemize";

export const siteTagline = "מערכות שעובדות בדרך שבה העסק שלך עובד";

export const siteDescription =
  "Systemize בונה מערכות אוטומציה ופתרונות Excel ו-VBA שמתאימים לדרך שבה העסק שלך כבר עובד — בלי פיצ׳רים מיותרים ובלי פתרונות מדף.";

/**
 * Geographic coordinates shown beside the wordmark. Decorative, matching the
 * topographic hero artwork.
 */
export const siteCoordinates = "32°05'N 34°48'E";

/**
 * In-page navigation. Each `href` must match a section `id` rendered on the home page,
 * so that a missing section becomes an obviously broken anchor rather than a silent
 * no-op.
 */
export const navigation = [
  { href: "#services", label: "שירותים" },
  { href: "#process", label: "תהליך" },
  { href: "#portfolio", label: "פרוייקטים" },
  { href: "#founder", label: "אודות" },
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
