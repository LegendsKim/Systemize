export const projectSlugs = ["athletetrack", "finquest", "guesto"] as const;

export type ProjectSlug = (typeof projectSlugs)[number];

export interface PortfolioProject {
  readonly slug: ProjectSlug;
  readonly name: string;
  readonly type: "פרויקט אישי" | "פרויקט לקוח";
  readonly status: string;
  readonly image: string;
  readonly imageAlt: string;
  readonly liveUrl: string;
  readonly liveLabel: string;
  readonly cardSummary: string;
  readonly description: string;
  readonly origin: string;
  readonly pain: string;
  readonly solution: string;
  readonly capabilities: readonly string[];
  readonly planning: readonly string[];
}

/**
 * Real projects only. The copy describes visible product capabilities and avoids
 * performance claims, client attribution and unverified metrics.
 */
export const portfolioProjects: readonly PortfolioProject[] = [
  {
    slug: "athletetrack",
    name: "AthleteTrack",
    type: "פרויקט לקוח",
    status: "מערכת שנבנתה עבור לקוח",
    image: "/projects/athletetrack-home.png",
    imageAlt: "דף הבית של AthleteTrack, מערכת ביצועים לספורטאי ג׳ודו",
    liveUrl: "https://athletetrack-ten.vercel.app",
    liveLabel: "לצפייה בפרויקט",
    cardSummary: "מרכז ביצועים שמחבר בין מאמנים, ספורטאים והדרך התחרותית.",
    description:
      "מערכת לספורטאים ולמאמנים שמרכזת אימונים, מוכנות יומית, משקל, התקדמות ותחרויות בתמונה מקצועית אחת.",
    origin:
      "הפרויקט נבנה עבור לקוח מעולם הספורט התחרותי, מתוך צורך להפוך עבודה יומיומית עם ספורטאים צעירים לתהליך מדויק, רציף וברור יותר.",
    pain:
      "מידע חשוב על עומס, נוכחות, תחושה והתקדמות נוטה להתפזר בין שיחות, טפסים וגיליונות. כך קשה למאמן לזהות בזמן מה דורש תשומת לב ולעקוב אחר כל ספורטאי לאורך העונה.",
    solution:
      "AthleteTrack מארגנת את העבודה סביב שני הצדדים: הספורטאי מעדכן נתונים קצרים בשגרה, והמאמן מקבל תמונת מצב מרוכזת שמחברת בין האימון היומי, מגמות והיעדים התחרותיים.",
    capabilities: [
      "עדכון מוכנות ואימון יומי",
      "מעקב משקל והתקדמות",
      "תמונת מאמן וסימנים לתשומת לב",
      "אימונים, תחרויות ודירוגים",
    ],
    planning: [
      "מסלולים נפרדים לספורטאי ולמאמן",
      "מידע רגיש נשאר באזור המאובטח",
      "הדשבורד מציף קודם את מה שדורש פעולה",
    ],
  },
  {
    slug: "finquest",
    name: "FinQuest",
    type: "פרויקט אישי",
    status: "גרסת מוצר עובדת · אינה מופעלת כיום כשירות פעיל",
    image: "/projects/finquest-home.png",
    imageAlt: "דף הבית של FinQuest עם כלים לתכנון פיננסי",
    liveUrl: "https://www.finquest.co.il",
    liveLabel: "לצפייה באתר ההדגמה",
    cardSummary: "חינוך פיננסי, סימולטורים וכלים מעשיים למשפחות בישראל.",
    description:
      "פלטפורמה עברית שמנגישה חינוך פיננסי לילדים ולמבוגרים, ומחברת ידע עם מחשבונים וסימולציות להחלטות יומיומיות.",
    origin:
      "פרויקט אישי שנולד מהרצון לשתף ידע פיננסי בצורה קלה יותר ולחבר בין תוכן, מחשבונים ומידע אישי במערכת אחת שמעדכנת את התמונה ומכוונת לצעד הבא.",
    pain:
      "פנסיה, משכנתה, תקציב והשקעות מוצגים לרוב בשפה מורכבת ובמקומות נפרדים. אנשים פוגשים את המידע דווקא ברגע של החלטה גדולה, בלי דרך פשוטה להבין את ההשלכות.",
    solution:
      "FinQuest מרכזת מסלולי למידה, מאמרים, שאלון אישי וסימולטורים שמתרגמים מושגים לתרחישים ברורים. המערכת מחברת את התשובות והכלים לתמונה אישית אחת, ולומדת מה מעניין את המשתמש כדי לכוון אותו לתוכן הבא.",
    capabilities: [
      "אקדמיה לילדים ולמבוגרים",
      "מחשבוני משכנתה ופנסיה",
      "סימולציות תקציב והשקעות",
      "אזור אישי שמתעדכן לפי המשתמש",
    ],
    planning: [
      "ידע וכלים מעשיים תחת מסע אחד",
      "שפה עברית פשוטה לצד הסברים מדורגים",
      "הכוונה לכלי המתאים לפי השאלה של המשתמש",
    ],
  },
  {
    slug: "guesto",
    name: "Guesto",
    type: "פרויקט אישי",
    status: "גרסת מוצר עובדת · אינה מופעלת כיום כשירות פעיל",
    image: "/projects/guesto-home.png",
    imageAlt: "דף הבית של Guesto עם מערכת לניהול הזמנות ואורחים לאירועים",
    liveUrl: "https://guesto-nine.vercel.app",
    liveLabel: "לצפייה באתר ההדגמה",
    cardSummary: "הזמנות, אורחים ואישורי הגעה לאירועים במקום אחד.",
    description:
      "מערכת לניהול אורחים לאירועים — מחתונה וברית ועד בר או בת מצווה ומפגש חברים — שמלווה את הדרך מההזמנה ועד סיום האירוע.",
    origin:
      "Guesto נולדה מתוך צורך מעשי שחוזר בתכנון אירועים: לרכז את רשימת האורחים, האישורים והפרטים במקום אחד, במקום לנהל אותם בין עשרות שיחות.",
    pain:
      "רשימות אורחים, הודעות WhatsApp ואישורי הגעה מתפזרים בין כמה אנשים ועשרות שיחות. ככל שהאירוע מתקרב, קשה לדעת מי קיבל הזמנה, מי ענה ומה עדיין פתוח.",
    solution:
      "Guesto מחברת יצירת אירוע והזמנה, ניהול רשימת אורחים, שליחה אישית ואישורי הגעה לדשבורד אחד. לאחר קבלת התשובות אפשר לתכנן גם את הושבת האורחים ולראות את תמונת האירוע במקום אחד.",
    capabilities: [
      "יצירת אירוע והזמנה דיגיטלית",
      "ייבוא וניהול רשימת אורחים",
      "שליחה אישית דרך WhatsApp",
      "אישורי הגעה ומעקב חי",
      "תכנון שולחנות והושבת אורחים",
    ],
    planning: [
      "מסלול קצר מפתיחת אירוע לשליחת הזמנה",
      "קישור אישי לכל אורח",
      "תמונה משותפת גם כשכמה אנשים מזמינים",
    ],
  },
] as const;

export function getProject(slug: string): PortfolioProject | undefined {
  return portfolioProjects.find((project) => project.slug === slug);
}
