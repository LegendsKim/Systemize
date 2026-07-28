/**
 * Founder section content.
 *
 * ⚠ PLACEHOLDER CONTENT, NOT FOR PUBLIC LAUNCH.
 *
 * The founder is Marlen Kimiagrov, and that is the only fact in this module that is
 * verified. No years of experience, no client count, no previous employer, no
 * certification and no personal history is stated, because none was supplied, inventing
 * a biography is not a placeholder, it is a false claim about a real person.
 *
 * What is written below is therefore a *structure* plus copy that only restates the
 * working method already documented in `src/features/process/process-content.ts`. It is
 * defensible as written, and it is still marked `isPlaceholder: true` because the owner
 * has not reviewed or approved it as his own words. The launch checklist can assert
 * `!founderContent.isPlaceholder`, and the same flag gates `portrait` and `credentials`,
 * which are intentionally empty until real material exists.
 *
 * See AGENTS.client.md §9 and docs/PRODUCT.md §3.3.
 */

export interface FounderCredential {
  readonly id: string;
  readonly label: string;
  readonly detail: string;
}

export interface FounderPortrait {
  /** Path under `public/`. Rendered with `next/image` and reserved dimensions. */
  readonly src: string;
  readonly width: number;
  readonly height: number;
  /** Meaningful alternative text; the portrait is not decorative. */
  readonly alt: string;
}

export interface FounderContent {
  readonly eyebrow: string;
  readonly headline: string;
  readonly name: string;
  readonly role: string;
  /** Body paragraphs, in reading order. */
  readonly paragraphs: readonly string[];
  /** A short line the section can set apart. Must be a stated commitment, not a boast. */
  readonly pledge: string;
  /**
   * Verified credentials. Deliberately empty: nothing here may be written without a fact
   * supplied by the owner. The section must render correctly with an empty list.
   */
  readonly credentials: readonly FounderCredential[];
  /** `null` until a real photograph is supplied. The section must handle `null`. */
  readonly portrait: FounderPortrait | null;
  readonly ctaLabel: string;
  readonly ctaHref: string;
  /** True until the owner reviews and approves this text as his own. */
  readonly isPlaceholder: boolean;
}

export const founderContent: FounderContent = {
  eyebrow: "מי מאחורי Systemize",
  headline: "מי שמאפיין הוא גם מי שבונה",
  name: "מרלן קימיאגרוב",
  role: "מייסד Systemize",
  paragraphs: [
    "Systemize היא עסק קטן במכוון. אותו אדם שיושב איתכם באפיון הוא זה שבונה את המערכת ומלווה את ההטמעה, ולכן שום דבר לא נאבד בהעברה בין מי שהבין את הבעיה למי שמיישם אותה.",
    "העבודה מתחילה תמיד באותו מקום: להבין איך העבודה מתנהלת אצלכם בפועל, לא איך היא אמורה להתנהל לפי נוהל, ולא איך תוכנה קיימת מניחה שהיא מתנהלת. מהבנה כזו נגזר מה המערכת צריכה לעשות, ובאותה מידה מה היא לא צריכה לעשות.",
    "מכאן גם הגישה לתקשורת: מסמך אפיון שאפשר לקרוא ולהבין בלי מונחים מקצועיים, מסירות שאפשר לראות בדרך במקום קופסה שנפתחת בסוף, ותשובה ישרה כשהתשובה הנכונה היא שכדאי לכם דווקא מוצר מדף קיים.",
  ],
  pledge:
    "אם התהליך שלכם סטנדרטי ויש כבר מוצר שמכסה אותו, נגיד את זה בשיחה הראשונה.",
  credentials: [],
  portrait: null,
  ctaLabel: "לשיחה על העסק שלכם",
  ctaHref: "#blueprint",
  isPlaceholder: true,
};
