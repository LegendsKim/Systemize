/**
 * Portfolio project cards.
 *
 * ⚠ PLACEHOLDER CONTENT, NOT FOR PUBLIC LAUNCH.
 *
 * No real project material exists yet. Every entry below is an illustrative *kind* of
 * engagement, not a real client, and carries `isPlaceholder: true`. No client name, no
 * logo, no metric, and no testimonial is invented anywhere in this file, an unverifiable
 * number on a portfolio card is the single fastest way to lose a serious buyer.
 *
 * `isPlaceholder` is a required field on `PortfolioProject`, so a real entry cannot be
 * added without deciding about it, and the launch checklist can assert mechanically that
 * `portfolioProjects.every((project) => !project.isPlaceholder)` before a public release.
 * See AGENTS.client.md §9 and docs/PRODUCT.md §3.3.
 *
 * What the section argues is the *range*, not any single project: a judo coach and a
 * cleanroom inventory operation have nothing in common, and both got a system cut to fit.
 * Replacements must preserve that spread.
 */

export interface PortfolioProject {
  readonly id: string;
  /** Illustrative sector label. Never a client name while `isPlaceholder` is true. */
  readonly sector: string;
  readonly title: string;
  /** The operational problem, in the business's own terms. */
  readonly challenge: string;
  /** What was built. Capabilities only, no results, no figures. */
  readonly solution: string;
  /** Qualitative outcomes. Must remain free of numbers while placeholder. */
  readonly outcomes: readonly string[];
  /** Capability tags, used for the card's chips. */
  readonly capabilities: readonly string[];
  /** True while the entry is illustrative rather than a real, approved engagement. */
  readonly isPlaceholder: boolean;
}

export const portfolioHeadings = {
  eyebrow: "סוגי פרויקטים",
  headline: "עסקים שאין ביניהם שום דבר במשותף, ולכל אחד מערכת משלו",
  lead:
    "הרוחב הוא הטיעון. כשהמערכת נבנית סביב העסק, התחום לא קובע אם אפשר לבנות אותה.",
  /**
   * Shown on the section while `isPlaceholder` entries are present. It must stay visible
   * for as long as this content is illustrative, publishing examples as if they were
   * case studies would be a misrepresentation.
   */
  placeholderNotice:
    "הדוגמאות הבאות ממחישות סוגי פרויקטים ואינן מתארות לקוחות ספציפיים. תיאורי מקרה מלאים יתפרסמו באישור הלקוחות.",
} as const;

export const portfolioProjects: readonly PortfolioProject[] = [
  {
    id: "portfolio-sports-club",
    sector: "חוגים וספורט",
    title: "ניהול מנויים, נוכחות ותשלומים בחוג",
    challenge:
      "רשימות מתאמנים במחברת ובגיליון, נוכחות שנרשמת בסוף השבוע מהזיכרון, ומנויים שפגו בלי שאף אחד שם לב.",
    solution:
      "מערכת מנויים בענן עם רישום נוכחות מהמכשיר הנייד באולם, מצב מנוי לכל מתאמן, וסימון אוטומטי של מנויים שמתקרבים לסיום או שפגו.",
    outcomes: [
      "מצב המנוי של כל מתאמן ברור בכל רגע",
      "נוכחות נרשמת בזמן האימון, לא אחריו",
      "התראה לפני שמנוי פג",
    ],
    capabilities: ["מנויים", "נוכחות", "התראות", "נייד"],
    isPlaceholder: true,
  },
  {
    id: "portfolio-cleanroom-inventory",
    sector: "תעשייה ובקרת איכות",
    title: "מעקב מלאי וציוד בחדר נקי",
    challenge:
      "מלאי חומרים וציוד מנוהל בגיליונות נפרדים, ללא תיעוד עקבי של מי לקח מה ומתי, ובלי בקרה על תוקף ותנאי אחסון.",
    solution:
      "מערכת מלאי עם רשומה לכל פריט, תיעוד תנועות כניסה ויציאה לפי משתמש ומועד, סימון פריטים שמתקרבים לתוקף, ומסך בקרה לאחראי האיכות.",
    outcomes: [
      "כל תנועת מלאי מתועדת ומיוחסת",
      "פריטים שחורגים מתוקף מסומנים מראש",
      "נתוני המעקב זמינים לביקורת",
    ],
    capabilities: ["מלאי", "תיעוד ובקרה", "התראות", "הרשאות"],
    isPlaceholder: true,
  },
  {
    id: "portfolio-field-service",
    sector: "שירות ותחזוקה בשטח",
    title: "תיאום קריאות שירות וטכנאים",
    challenge:
      "קריאות מגיעות בטלפון ובוואטסאפ, השיבוץ נעשה בעל פה, ודוח העבודה נכתב על פתק ומוקלד מחדש במשרד.",
    solution:
      "מערכת קריאות עם שיבוץ לטכנאי, מסך שטח שבו הטכנאי מעדכן מצב ומצרף תיעוד, ותצוגת מצב שוטפת למשרד.",
    outcomes: [
      "כל קריאה מתועדת מהרגע שנפתחה",
      "הטכנאי מדווח מהשטח, בלי הקלדה חוזרת",
      "המשרד רואה את מצב היום בזמן אמת",
    ],
    capabilities: ["שיבוץ", "דיווח מהשטח", "מסכי בקרה"],
    isPlaceholder: true,
  },
  {
    id: "portfolio-clinic",
    sector: "קליניקה ומטפלים",
    title: "ניהול מטופלים, תורים ומסמכים",
    challenge:
      "יומן תורים נפרד מרשימת המטופלים, טפסי הסכמה על נייר, ותזכורות שנשלחות ידנית כשיש זמן.",
    solution:
      "מערכת בענן שמאחדת תיק מטופל, יומן תורים ותזכורות אוטומטיות, עם טפסים דיגיטליים ששמורים בתיק והרשאות גישה לפי תפקיד.",
    outcomes: [
      "התיק והיומן מדברים זה עם זה",
      "תזכורות נשלחות בלי התערבות",
      "מסמכים נשמרים במקום אחד מוגן",
    ],
    capabilities: ["יומן", "תיק לקוח", "טפסים", "תזכורות"],
    isPlaceholder: true,
  },
  {
    id: "portfolio-wholesale",
    sector: "סחר וסיטונאות",
    title: "הזמנות, מחירונים ומעקב אחרי הזמנה",
    challenge:
      "הזמנות נכנסות בטלפון ובמייל, מחירונים שונים ללקוחות שונים מנוהלים בקבצים, ומצב ההזמנה נשלף בשאלה למחסן.",
    solution:
      "מערכת הזמנות עם מחירון לפי לקוח, מסלול אישור מוגדר, ומצב הזמנה גלוי מהקליטה ועד המסירה, כולל חיבור להנהלת החשבונות הקיימת.",
    outcomes: [
      "מחירון נכון מוחל אוטומטית לכל לקוח",
      "מצב ההזמנה גלוי בלי לשאול",
      "הנתונים עוברים להנהלת החשבונות בלי הקלדה",
    ],
    capabilities: ["הזמנות", "מחירונים", "אינטגרציה", "מסכי בקרה"],
    isPlaceholder: true,
  },
  {
    id: "portfolio-education",
    sector: "הדרכה וקורסים",
    title: "מחזורי לימוד, משתתפים והתקדמות",
    challenge:
      "כל מחזור מנוהל בגיליון חדש, ההרשמות נאספות מכמה ערוצים, ואין תמונה רציפה של מי השתתף במה.",
    solution:
      "מערכת מחזורים עם הרשמה מקוונת, רשומת משתתף שמלווה אותו בין מחזורים, מעקב התקדמות והפקת אישורי סיום.",
    outcomes: [
      "היסטוריית משתתף נשמרת בין מחזורים",
      "הרשמות מגיעות לערוץ אחד",
      "אישורי סיום מופקים מהמערכת",
    ],
    capabilities: ["הרשמות", "מחזורים", "מעקב התקדמות"],
    isPlaceholder: true,
  },
];
