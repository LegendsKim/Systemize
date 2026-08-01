/**
 * What a client is told, once, before they are asked to do anything.
 *
 * The portal used to open straight onto a project card and a button. Everything about the
 * shape of the engagement — that there is a questionnaire, that we read it and may come
 * back with one note, that a meeting follows, that payment opens the real work — was
 * knowledge the operator had and the client did not. This is that knowledge, stated in
 * the order it actually happens.
 */

export interface PortalOrientationStep {
  readonly index: string;
  readonly title: string;
  readonly detail: string;
}

export const portalOrientationSteps: readonly PortalOrientationStep[] = [
  {
    index: "01",
    title: "מסמך היכרות",
    detail:
      "שאלון קצר בחמישה שלבים על העסק, המצב היום והמטרות. נשמר אוטומטית תוך כדי כתיבה, כך שאפשר לצאת ולחזור בכל רגע.",
  },
  {
    index: "02",
    title: "בדיקה ואישור",
    detail:
      "אנחנו עוברים על התשובות. אם חסר לנו משהו נכתוב הערה קצרה, ואפשר לענות עליה ולשלוח מחדש ישירות מתוך המסמך.",
  },
  {
    index: "03",
    title: "פגישת מיקוד",
    detail:
      "נפתחים מועדים לבחירה ואתם תופסים את המועד שנוח. לפגישה נגיע אחרי שכבר קראנו את החומר.",
  },
  {
    index: "04",
    title: "סיכום, הצעה ותשלום",
    detail:
      "מפרסמים מסמך מסודר עם מה שהבנו, התכולה, לוח הזמנים והתנאים. התשלום פותח את שלב האפיון והתכנון המלא.",
  },
] as const;

export interface PortalOrientationPointer {
  readonly label: string;
  readonly detail: string;
}

/** Where each kind of thing lives, so the tabs are not a guessing game. */
export const portalOrientationPointers: readonly PortalOrientationPointer[] = [
  {
    label: "פעולות",
    detail: "כל מה שממתין לך, במקום אחד. אם נדרש ממך משהו — הוא יופיע שם ובדף הבית.",
  },
  {
    label: "מסמכים",
    detail: "כל גרסה שפורסמה נשמרת. אפשר לצפות באתר או להוריד PDF זהה.",
  },
  {
    label: "עדכונים",
    detail: "יומן ההתראות המלא. שום עדכון לא נעלם, גם אם לא היית מחובר.",
  },
];
