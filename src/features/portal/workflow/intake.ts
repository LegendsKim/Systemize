import type { IntakeStatus } from "@/lib/supabase/types";

export const intakeFieldNames = [
  "companyOverview",
  "productsAndServices",
  "currentProcess",
  "primaryChallenges",
  "goals",
  "successMetrics",
  "usersAndRoles",
  "mustHaveFeatures",
  "integrations",
  "dataSources",
  "automations",
  "reports",
  "securityRequirements",
  "timeline",
  "budgetRange",
  "decisionProcess",
  "additionalNotes",
] as const;

export type IntakeFieldName = (typeof intakeFieldNames)[number];
export type IntakeAnswers = Record<IntakeFieldName, string>;

export interface IntakeField {
  readonly name: IntakeFieldName;
  readonly label: string;
  readonly hint: string;
  readonly required: boolean;
  readonly rows: number;
}
export interface IntakeSection {
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly fields: readonly IntakeField[];
}

export const intakeSections: readonly IntakeSection[] = [
  {
    eyebrow: "01 · העסק",
    title: "בואו נכיר את החברה",
    description:
      "לא צריך לכתוב בצורה טכנית. ספרו לנו במילים שלכם איך העסק עובד ומה חשוב שנבין.",
    fields: [
      {
        name: "companyOverview",
        label: "מה החברה עושה ולמי היא עוזרת?",
        hint: "תחום פעילות, קהל יעד, גודל החברה והצעת הערך המרכזית.",
        required: true,
        rows: 5,
      },
      {
        name: "productsAndServices",
        label: "אילו מוצרים או שירותים אתם מציעים?",
        hint: "אפשר לפרט גם שירותים עתידיים שהמערכת צריכה לקחת בחשבון.",
        required: true,
        rows: 4,
      },
      {
        name: "decisionProcess",
        label: "מי מעורב בהחלטה ובהמשך התהליך?",
        hint: "שמות או תפקידים של מקבלי החלטות ומשתמשים מרכזיים.",
        required: true,
        rows: 3,
      },
    ],
  },
  {
    eyebrow: "02 · המצב היום",
    title: "איך העבודה מתבצעת כרגע?",
    description:
      "המטרה היא להבין את המציאות הקיימת, גם אם היא מורכבת או לא מסודרת.",
    fields: [
      {
        name: "currentProcess",
        label: "תארו את תהליך העבודה המרכזי מתחילתו ועד סופו",
        hint: "מאיפה מגיעה פנייה, מי מטפל בה, איפה נשמר מידע ואיך יודעים שהטיפול הסתיים.",
        required: true,
        rows: 7,
      },
      {
        name: "primaryChallenges",
        label: "מה מעכב אתכם או יוצר טעויות?",
        hint: "כפילויות, מידע שאובד, עבודה ידנית, חוסר בקרה או קושי לעקוב.",
        required: true,
        rows: 6,
      },
      {
        name: "dataSources",
        label: "איפה המידע נשמר היום?",
        hint: "Excel, Google Sheets, מערכת קיימת, WhatsApp, מסמכים או ידע של עובדים.",
        required: true,
        rows: 4,
      },
    ],
  },
  {
    eyebrow: "03 · היעד",
    title: "מה המערכת צריכה לשנות?",
    description:
      "נתמקד בתוצאה העסקית ולא רק ברשימת מסכים או כפתורים.",
    fields: [
      {
        name: "goals",
        label: "מהן שלוש המטרות החשובות ביותר?",
        hint: "לדוגמה: לחסוך זמן, לצמצם טעויות, לשפר שירות או לקבל תמונת מצב.",
        required: true,
        rows: 6,
      },
      {
        name: "successMetrics",
        label: "איך נדע שהצלחנו?",
        hint: "מספרים, זמני תגובה, חיסכון בשעות, פחות טעויות או שיפור בחוויית הלקוח.",
        required: true,
        rows: 4,
      },
      {
        name: "timeline",
        label: "האם יש תאריך יעד או אירוע שחשוב להיערך אליו?",
        hint: "אפשר לציין גם אילוצים, עונות עמוסות או שלבים שמתאימים לעלייה הדרגתית.",
        required: false,
        rows: 3,
      },
      {
        name: "budgetRange",
        label: "האם הוגדרה מסגרת תקציב ראשונית?",
        hint: "המידע עוזר לנו להציע פתרון שמתאים למציאות. אפשר לציין טווח או לכתוב שעדיין לא הוגדר.",
        required: false,
        rows: 3,
      },
    ],
  },
  {
    eyebrow: "04 · המערכת",
    title: "משתמשים, פעולות וחיבורים",
    description:
      "כאן נרכז את היכולות המרכזיות. אין צורך להכיר מונחים טכנולוגיים.",
    fields: [
      {
        name: "usersAndRoles",
        label: "מי ישתמש במערכת ומה כל אחד צריך לעשות?",
        hint: "עובדים, מנהלים, לקוחות, ספקים או שותפים והרשאות מיוחדות.",
        required: true,
        rows: 6,
      },
      {
        name: "mustHaveFeatures",
        label: "אילו פעולות חייבות להיות במערכת?",
        hint: "רשמו את הדברים שבלעדיהם הפתרון לא ייתן ערך אמיתי.",
        required: true,
        rows: 7,
      },
      {
        name: "integrations",
        label: "לאילו מערכות או שירותים צריך להתחבר?",
        hint: "חשבוניות, סליקה, Google, WhatsApp, דיוור, CRM או מערכת ארגונית אחרת.",
        required: false,
        rows: 4,
      },
      {
        name: "automations",
        label: "אילו פעולות הייתם רוצים שיקרו אוטומטית?",
        hint: "התראות, יצירת משימות, שליחת מסמכים, תזכורות או עדכון סטטוס.",
        required: false,
        rows: 4,
      },
      {
        name: "reports",
        label: "איזו תמונת מצב או דוחות חשוב לראות?",
        hint: "מה מנהל צריך לדעת בכל יום, שבוע או חודש כדי לקבל החלטות.",
        required: false,
        rows: 4,
      },
    ],
  },
  {
    eyebrow: "05 · אחריות ופרטיות",
    title: "פרטים אחרונים לפני השליחה",
    description:
      "המידע נשמר באופן פרטי ונגיש רק לכם ול־SYSTEMIZE במסגרת הפרויקט.",
    fields: [
      {
        name: "securityRequirements",
        label: "האם נשמר מידע רגיש או קיימות דרישות אבטחה מיוחדות?",
        hint: "מידע רפואי, פיננסי, פרטי לקוחות, הרשאות, גיבויים או דרישות רגולטוריות.",
        required: true,
        rows: 5,
      },
      {
        name: "additionalNotes",
        label: "מה עוד חשוב שנדע לפני הפגישה?",
        hint: "סיכונים, רעיונות, דוגמאות למערכות שאהבתם או כל דבר שלא נכנס בשאלות.",
        required: false,
        rows: 5,
      },
    ],
  },
] as const;

export const intakeStatusLabels: Record<IntakeStatus, string> = {
  draft: "טיוטה",
  submitted: "ממתין לבדיקה",
  changes_requested: "נדרש עדכון",
  approved: "אושר",
};

export function emptyIntakeAnswers(): IntakeAnswers {
  return Object.fromEntries(
    intakeFieldNames.map((name) => [name, ""])
  ) as IntakeAnswers;
}

export function parseIntakeAnswers(value: unknown): IntakeAnswers {
  const answers = emptyIntakeAnswers();
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return answers;
  }

  const record = value as Record<string, unknown>;
  for (const name of intakeFieldNames) {
    if (typeof record[name] === "string") {
      answers[name] = record[name].slice(0, 5000);
    }
  }
  return answers;
}
