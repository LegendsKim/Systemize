/**
 * Every Hebrew string the lead form shows.
 *
 * One module so the copy can be reviewed as copy, and so the validation messages the
 * client renders are byte-identical to the ones the server produces, the schema in
 * `lead-schemas.ts` reads its messages from here and runs on both sides.
 *
 * Nothing else on the site reads this file. It reads only `site-config`, for the phone
 * number: the failure states tell a visitor to call instead, and an instruction to call
 * that does not say what to call is not a recovery path. `site-config` holds no secrets
 * and is safe in the client graph.
 */

import { contact } from "@/lib/site-config";

export const leadSection = {
  /** The hero's second call to action links to `#blueprint`. */
  id: "blueprint",
  kicker: "SYSTEM_INPUT",
  heading: "ספרו לי איזו מערכת העסק צריך",
  lede: "כמה שורות על העסק, מי יעבוד במערכת ומה היום קשה לנהל. זה מספיק כדי להגיע לשיחת ההיכרות מוכנים — את האפיון המפורט נעשה יחד בהמשך.",
  assurances: [
    "שיחת היכרות ומיפוי ראשוני ללא עלות",
    "אם יש התאמה, תקבלו הזמנה לאזור האישי עם כל החומר",
    "הפיתוח מתחיל רק אחרי שבחרתם מסלול ואישרתם את התנאים",
  ],
} as const;

export const leadForm = {
  /** Names the form for assistive technology; the visible heading is the section's. */
  label: "טופס פנייה לקביעת שיחת היכרות",
  fields: {
    full_name: {
      label: "שם מלא",
      placeholder: "לדוגמה: דנה לוי",
      autoComplete: "name",
    },
    business_name: {
      label: "שם העסק",
      placeholder: "לדוגמה: מעבדות אריאל",
      autoComplete: "organization",
    },
    phone: {
      label: "טלפון",
      placeholder: "050-0000000",
      autoComplete: "tel",
      hint: "לשיחה הראשונה. אפשר גם מספר משרד.",
    },
    email: {
      label: "אימייל",
      placeholder: "name@business.co.il",
      autoComplete: "email",
    },
    message: {
      label: "מה העסק עושה ומה המערכת צריכה לנהל",
      placeholder:
        "לדוגמה: אנחנו מנהלים לקוחות, הזמנות וצוות בכמה מקומות ורוצים מערכת אחת שתעשה סדר.",
      hint: "כמה שורות מספיקות. את כל השאלות המפורטות תקבלו באזור האישי.",
    },
  },
  required: "שדה חובה",
  submit: {
    idle: "שולחים רקע וקובעים שיחה",
    pending: "שולח…",
  },
  privacyNote:
    "הפרטים משמשים רק כדי לחזור אליכם בעניין הפנייה. בלי ספאם ובלי ניוזלטר שאף אחד לא ביקש.",
} as const;

/**
 * Validation messages. Each states what to do, not only what went wrong, an error a
 * screen reader announces has to be actionable on its own (AGENTS.md §8).
 */
export const leadValidation = {
  full_name: {
    required: "נא למלא שם מלא",
    tooShort: "השם קצר מדי, נא למלא שם מלא",
    tooLong: "השם ארוך מדי. עד 200 תווים",
  },
  business_name: {
    required: "נא למלא את שם העסק",
    tooShort: "שם העסק קצר מדי, נא למלא שם מלא",
    tooLong: "שם העסק ארוך מדי. עד 200 תווים",
  },
  phone: {
    required: "נא למלא מספר טלפון",
    invalid: "מספר הטלפון אינו תקין. נא למלא מספר ישראלי, לדוגמה 050-0000000",
  },
  email: {
    required: "נא למלא כתובת אימייל",
    invalid: "כתובת האימייל אינה תקינה. נא לבדוק שהיא כוללת @ ושם דומיין",
    tooLong: "כתובת האימייל ארוכה מדי. עד 320 תווים",
  },
  message: {
    required: "נא לתאר בקצרה מה המערכת צריכה לנהל",
    tooShort: "נא להוסיף עוד מעט פירוט, לפחות 10 תווים",
    tooLong: "התיאור ארוך מדי. עד 5,000 תווים",
  },
} as const;

/**
 * The states the visitor can end up in. Offline and rate-limited are deliberately
 * distinct from a generic failure (docs/PRODUCT.md §4, J1) because the recovery
 * action differs: reconnect, wait, or call.
 */
export const leadStates = {
  success: {
    title: "הפנייה נשלחה",
    body: `קיבלנו את הפרטים ונחזור אליכם ביום עסקים אחד. אם זה דחוף, אפשר להתקשר ל־${contact.display} או לכתוב בווטסאפ.`,
  },
  duplicate: {
    title: "הפנייה כבר אצלנו",
    body: "הפנייה הזו נרשמה כבר ולא נוצרה כפילות. אין צורך לשלוח שוב.",
  },
  rateLimited: {
    title: "נשלחו יותר מדי פניות",
    body: `נשלחו כמה פניות מהחיבור הזה בזמן קצר. נא לנסות שוב בעוד שעה, או להתקשר ישירות ל־${contact.display}.`,
  },
  offline: {
    title: "אין חיבור לאינטרנט",
    body: "הפנייה לא נשלחה. הפרטים נשארו בטופס, נא להתחבר ולנסות שוב.",
  },
  error: {
    title: "השליחה נכשלה",
    body: "משהו התקלקל אצלנו, לא אצלכם. נא לנסות שוב בעוד רגע.",
  },
  validationSummary: "יש שדות שדורשים תיקון. הפרטים מופיעים ליד כל שדה.",
} as const;

export type LeadFieldName = keyof typeof leadForm.fields;

/** The field order, which is also the tab order and the error-focus order. */
export const leadFieldOrder: readonly LeadFieldName[] = [
  "full_name",
  "business_name",
  "phone",
  "email",
  "message",
];
