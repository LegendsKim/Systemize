/**
 * Content for the two comparison sections.
 *
 * They live in one module because they are the same rhetorical move made twice, and
 * keeping them together makes it obvious that they must not repeat each other:
 *
 *   `workflowComparisonRows`, before / after. The same task, done by hand today and
 *   done by a system tomorrow. Describes work, never savings: no percentages, no hours,
 *   no invented figures.
 *
 *   `offTheShelfComparisonRows`, off-the-shelf versus built around you. This is the
 *   slot the intake brief called "Excel versus SaaS". It is deliberately fair: each row
 *   names honestly what a packaged product is genuinely good at before naming what a
 *   bespoke system does differently. A strawman would not survive a business owner who
 *   has already looked at the packaged options.
 */

export interface WorkflowComparisonRow {
  readonly id: string;
  /** The step being compared, as the business would name it. */
  readonly stage: string;
  /** How it happens today, without a system. */
  readonly manual: string;
  /** How the same step happens once it is part of the system. */
  readonly automated: string;
}

export const workflowComparisonHeadings = {
  eyebrow: "אותה עבודה, שתי דרכים",
  headline: "מה משתנה כשתהליך הופך למערכת",
  lead:
    "אין כאן קסם. אותם שלבים בדיוק, רק שהמידע נרשם פעם אחת ועובר לבד למי שצריך אותו.",
  manualLabel: "לפני: עבודה ידנית",
  automatedLabel: "אחרי: בתוך המערכת",
} as const;

export const workflowComparisonRows: readonly WorkflowComparisonRow[] = [
  {
    id: "compare-intake",
    stage: "קליטת פנייה או לקוח חדש",
    manual:
      "הפרטים מגיעים בוואטסאפ, בטלפון ובמייל, ומישהו מקליד אותם שוב לגיליון או למחברת. מה שלא הוקלד, נשכח.",
    automated:
      "הפנייה נכנסת לטופס אחד ונשמרת ברשומה אחת, עם תאריך ואחראי. שום פנייה לא תלויה בזיכרון של אדם.",
  },
  {
    id: "compare-status",
    stage: "לדעת איפה כל דבר עומד",
    manual:
      "צריך לשאול. מי טיפל, מה נשלח, מה מחכה לאישור, התשובה מפוזרת בין כמה אנשים וכמה קבצים.",
    automated:
      "מסך אחד מציג את המצב הנוכחי לפי שלב ואחראי. מי שרוצה לדעת, מסתכל.",
  },
  {
    id: "compare-updates",
    stage: "עדכון מידע במקומות מרובים",
    manual:
      "שינוי אחד גורר תיקון בגיליון, ביומן ובקובץ הנוסף, ובדרך כלל אחד מהם נשאר לא מעודכן.",
    automated:
      "הנתון מתוקן במקום אחד ומופיע מעודכן בכל תצוגה שמשתמשת בו. אין שתי גרסאות של אותה אמת.",
  },
  {
    id: "compare-reminders",
    stage: "מעקב ותזכורות",
    manual:
      "תזכורות ידניות, תלויות בכך שמישהו יזכור לפתוח את הרשימה ביום הנכון.",
    automated:
      "המערכת מסמנת מה חורג ומה מתקרב למועד, ושולחת התראה לאחראי בזמן שהוגדר.",
  },
  {
    id: "compare-reporting",
    stage: "דוחות והצגת נתונים",
    manual:
      "כל דוח הוא פרויקט: אוספים, מדביקים, מסדרים. לכן דוחות נעשים רק כשאין ברירה.",
    automated:
      "הדוחות שהוגדרו כחשובים קיימים כמסך קבוע ומתעדכנים מהנתונים עצמם.",
  },
  {
    id: "compare-handover",
    stage: "כשעובד מתחלף",
    manual:
      "הידע יושב באדם ובקבצים הפרטיים שלו. חפיפה היא סיכון אמיתי לעסק.",
    automated:
      "התהליך מוגדר בתוך המערכת, וההיסטוריה מתועדת. מי שנכנס לתפקיד רואה את המצב ואת מה שקדם לו.",
  },
];

export interface OffTheShelfComparisonRow {
  readonly id: string;
  /** The dimension being compared. */
  readonly aspect: string;
  /** What a packaged product does, stated fairly, including where it wins. */
  readonly offTheShelf: string;
  /** What a system built around the workflow does instead. */
  readonly bespoke: string;
}

export const offTheShelfComparisonHeadings = {
  eyebrow: "מתי כדאי מוצר מדף ומתי לא",
  headline: "תוכנת מדף מול מערכת שנבנית סביבכם",
  lead:
    "לתוכנת מדף יש יתרונות אמיתיים, ולפעמים היא התשובה הנכונה. ההבדל מתחיל כשהתהליך שלכם לא נראה כמו התהליך שהמוצר הניח.",
  offTheShelfLabel: "תוכנת מדף",
  bespokeLabel: "מערכת שנבנית סביב העסק",
  footnote:
    "אם תהליך העבודה שלכם סטנדרטי ומוצר קיים מכסה אותו, קחו את המוצר הקיים ונשמח להגיד לכם את זה בשיחה הראשונה.",
} as const;

export const offTheShelfComparisonRows: readonly OffTheShelfComparisonRow[] = [
  {
    id: "shelf-start",
    aspect: "זמן להתחלה",
    offTheShelf:
      "יתרון ברור: נרשמים ומתחילים לעבוד באותו יום, בלי תהליך אפיון ובלי פיתוח.",
    bespoke:
      "יש שלב אפיון ובנייה לפני שעובדים במערכת. בתמורה, ביום הראשון היא כבר מדברת בשפה של העסק.",
  },
  {
    id: "shelf-fit",
    aspect: "התאמה לתהליך שלכם",
    offTheShelf:
      "המוצר מניח תהליך עבודה מסוים. אם הוא דומה לשלכם, מצוין. אם לא, מתחילים לעקם את העבודה סביב המסכים.",
    bespoke:
      "התהליך הקיים הוא נקודת ההתחלה. המונחים, השלבים והאישורים הם שלכם, ולא תרגום שלהם.",
  },
  {
    id: "shelf-cost",
    aspect: "מבנה העלות",
    offTheShelf:
      "עלות התחלה נמוכה, ואז דמי שימוש חודשיים לכל משתמש, שגדלים עם הצוות ועם המודולים.",
    bespoke:
      "עלות פיתוח חד־פעמית בתחילת הדרך, ואחריה עלויות תפעול ותמיכה. המבנה שונה, ולכן צריך לבחון אותו לאורך זמן ולא ליום אחד.",
  },
  {
    id: "shelf-change",
    aspect: "כשהעסק משתנה",
    offTheShelf:
      "אפשר לשנות מה שהמוצר מאפשר לשנות. בקשה שיוצאת מהגדרות המוצר תלויה במפת הדרכים של החברה שמפתחת אותו.",
    bespoke:
      "שינוי בתהליך הוא שינוי במערכת. זו החלטה שלכם ולוח זמנים שלכם.",
  },
  {
    id: "shelf-scope",
    aspect: "מה מקבלים",
    offTheShelf:
      "מקבלים גם הרבה יכולות שלא תשתמשו בהן, וגם, לפעמים, מסך אחד שדווקא חסר.",
    bespoke:
      "מקבלים את מה שהוגדר כנחוץ. פחות מסכים, פחות שדות, פחות הדרכה.",
  },
  {
    id: "shelf-data",
    aspect: "הנתונים והבעלות",
    offTheShelf:
      "הנתונים יושבים במוצר. ייצוא בדרך כלל אפשרי, במבנה שהמוצר מגדיר.",
    bespoke:
      "הקוד והנתונים הם שלכם, במסד נתונים שאתם הבעלים שלו, ואפשר להוציא אותם בכל רגע.",
  },
  {
    id: "shelf-support",
    aspect: "תמיכה ומי מכיר את העסק",
    offTheShelf:
      "תמיכה מקצועית וזמינה, אבל גנרית, היא מכירה את המוצר, לא את העסק שלכם.",
    bespoke:
      "התמיכה מגיעה מהאנשים שאפיינו ובנו את המערכת, ומכירים למה כל החלטה בה נראית כך.",
  },
  {
    id: "shelf-integration",
    aspect: "חיבור לכלים שכבר עובדים",
    offTheShelf:
      "יש חיבורים מוכנים לכלים הנפוצים, וזה חוסך עבודה. מה שאין ברשימה, לרוב אין.",
    bespoke:
      "מתחברים למה שקיים בעסק, כולל כלים פחות נפוצים או מערכת פנימית שאין לה ממשק מוכן.",
  },
];
