/**
 * The four delivery stages, told at length.
 *
 * These are the same four stages the hero plots along its trail, in the same order and
 * under the same names — `hero-geometry.ts` holds the short form, this holds the long
 * one. They must not diverge: a visitor who reads אפיון · תכנון · פיתוח · הטמעה on the
 * artwork and then meets four differently-named stages below concludes, correctly, that
 * nobody decided what the process is.
 *
 * Money is deliberately absent here and from the section intro above these stages. This
 * section answers "how does this work", and a visitor who meets prices mid-scroll stops
 * reading the process and starts doing arithmetic. The commercial shape is stated in the
 * pricing panel and in `features/pricing/pricing-content.ts`, where a visitor goes when
 * they are actually asking that question.
 */

export interface ProcessStage {
  readonly id: string;
  readonly number: string;
  readonly title: string;
  readonly eyebrow: string;
  readonly description: string;
  readonly outcome: string;
  readonly activities: readonly string[];
}

export const processStages: readonly ProcessStage[] = [
  {
    id: "process-discovery",
    number: "01",
    title: "אפיון",
    eyebrow: "שיחת היכרות ומיפוי ראשוני, ללא עלות",
    description:
      "מתחילים בשיחה על העסק, האנשים והתהליך שהמערכת צריכה לנהל. לא צריך להגיע עם מסמך דרישות; התפקיד שלנו הוא לשאול את השאלות הנכונות ולהבין אם יש התאמה לפרויקט של מערכת מלאה.",
    outcome:
      "תמונה ראשונית של המערכת הנדרשת והזמנה לאזור האישי, אם החלטנו יחד שיש בסיס נכון להתקדם.",
    activities: [
      "מכירים את העסק",
      "ממפים את הצורך המרכזי",
      "בודקים התאמה לפרויקט",
    ],
  },
  {
    id: "process-planning",
    number: "02",
    title: "תכנון",
    eyebrow: "בוחרים את הדרך ומאשרים הכול באזור האישי",
    description:
      "באזור האישי יחכו לכם חוזה ברור, שאלון העדפות ואפיון מפורט שמכסה את כל הדרך — מהמבנה והמסכים ועד ההטמעה והשירות שאחריה. לצד זה תקבלו מספר אפשרויות ביצוע, ולכל אחת היקף, מחיר ותנאי תשלום משלה.",
    outcome:
      "בחירה מאושרת ומתועדת: מה בונים, באיזה היקף, איך התהליך יעבוד וכמה משלמים — לפני שמתחיל הפיתוח.",
    activities: [
      "חוזה ושאלון מפורט",
      "מסלולי ביצוע לבחירה",
      "אישור ותשלום",
    ],
  },
  {
    id: "process-build",
    number: "03",
    title: "פיתוח",
    eyebrow: "האזור האישי מתרחב והמערכת נבנית מול העיניים",
    description:
      "אחרי האישור והתשלום נפתח באזור האישי מעקב הפרויקט המלא. רואים מה הושלם, מה בעבודה, אילו עדכונים נעשו ומה השתנה. אפשר להגיב על כל עדכון, להשאיר הערה, וכמובן להתקשר כששיחה היא הדרך הקצרה יותר.",
    outcome:
      "מערכת שנבנית מול העיניים שלכם, עם סטטוס פתוח בכל רגע, כך שביום המסירה אין הפתעות ואין ״לא לזה התכוונו״.",
    activities: [
      "סטטוס והתקדמות",
      "יומן עדכונים ושינויים",
      "הערות ושיחה ישירה",
    ],
  },
  {
    id: "process-rollout",
    number: "04",
    title: "הטמעה",
    eyebrow: "מכניסים את המערכת לעבודה ונשארים זמינים",
    description:
      "מעבירים נתונים, מגדירים משתמשים והרשאות, מדריכים את הצוות ומלווים את המעבר לעבודה החדשה. האזור האישי נשאר פתוח גם אחרי העלייה לאוויר, עם היסטוריה מסודרת, בקשות שירות ועדכונים עתידיים.",
    outcome:
      "העסק עובד בדרך החדשה, והיא כבר לא מרגישה חדשה.",
    activities: [
      "מעבר מבוקר",
      "הדרכה ברורה",
      "ליווי אחרי ההשקה",
    ],
  },
];
