import type { A11ySettingKey } from "./a11y-settings";

/**
 * Every Hebrew string the accessibility toolbar shows.
 *
 * Separated from the component for the same reason as the lead form's copy: it can be
 * reviewed as copy, and the labels a screen reader announces are the labels on screen.
 *
 * Each control carries a `hint` as well as a label. A toolbar of eleven two-word tiles is
 * unusable for someone who is not already familiar with the pattern, and "רוויה" alone
 * does not tell anyone what pressing it will do.
 */

export const a11yToolbar = {
  /** The floating trigger. */
  openLabel: "פתיחת תפריט נגישות",
  title: "התאמות נגישות",
  /* One line by design: the panel is sized to fit a laptop screen without scrolling, and
     a three-line preamble is the easiest 40px to give back. */
  description: "ההתאמות נשמרות בדפדפן הזה וימשיכו לפעול בביקור הבא.",
  levelsHeading: "טקסט וקריאוּת",
  togglesHeading: "תצוגה וניווט",
  /** Mono state chips, in the same register as the diagnostic console's tags. */
  stateOn: "ON",
  stateOff: "OFF",
  reset: "איפוס כל ההתאמות",
  resetAnnouncement: "כל ההתאמות אופסו",
  statementLink: "להצהרת הנגישות המלאה",
  /** Announced in a live region whenever a control changes. */
  on: "הופעל",
  off: "בוטל",
  levelNames: ["רגיל", "מעט", "בינוני", "מרבי"],
} as const;

interface ToggleCopy {
  readonly label: string;
  readonly hint: string;
}

export const a11yToggleCopy: Readonly<
  Record<
    Extract<
      A11ySettingKey,
      | "contrast"
      | "highlightLinks"
      | "readableFont"
      | "lowSaturation"
      | "stopAnimations"
      | "hideImages"
      | "bigCursor"
      | "alignStart"
    >,
    ToggleCopy
  >
> = {
  contrast: {
    label: "ניגודיות גבוהה",
    hint: "מחזק את הניגוד בין הטקסט לרקע",
  },
  highlightLinks: {
    label: "הדגשת קישורים",
    hint: "מסמן כל קישור בקו תחתון ובמסגרת",
  },
  readableFont: {
    label: "גופן קריא",
    hint: "מחליף לגופן עם אותיות מובחנות יותר",
  },
  lowSaturation: {
    label: "רוויה נמוכה",
    hint: "מנמיך את עוצמת הצבעים בעמוד",
  },
  stopAnimations: {
    label: "עצירת אנימציות",
    hint: "מקפיא תנועה, מעברים וגלילה רכה",
  },
  hideImages: {
    label: "הסתרת תמונות",
    hint: "מסתיר תמונות ומשאיר את הטקסט",
  },
  bigCursor: {
    label: "סמן גדול",
    hint: "מגדיל את סמן העכבר",
  },
  alignStart: {
    label: "יישור לצד אחד",
    hint: "מבטל טקסט מיושר לשני הצדדים",
  },
};

export const a11yLevelCopy: Readonly<
  Record<Extract<A11ySettingKey, "textScale" | "lineHeight" | "textSpacing">, ToggleCopy>
> = {
  textScale: {
    label: "גודל טקסט",
    hint: "מגדיל את הטקסט בכל העמוד",
  },
  lineHeight: {
    label: "גובה שורה",
    hint: "מרווח גדול יותר בין השורות",
  },
  textSpacing: {
    label: "ריווח תווים",
    hint: "מרווח גדול יותר בין אותיות ומילים",
  },
};
