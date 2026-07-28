/**
 * Value-proposition section content.
 *
 * The site's central claim in one place: software does not dictate how the business
 * works, the business dictates how the software is built. The supporting points are the
 * reasons that claim is credible, not features, a business owner is buying operational
 * quiet, not a feature list.
 *
 * Every line here must be defensible without a number behind it. No invented metrics.
 */

export interface ValuePoint {
  readonly id: string;
  readonly title: string;
  readonly description: string;
}

export interface ValueContent {
  readonly eyebrow: string;
  readonly headline: string;
  readonly lead: string;
  readonly points: readonly ValuePoint[];
}

export const valueContent: ValueContent = {
  eyebrow: "הרעיון שמנחה כל פרויקט",
  headline: "התוכנה לא מכתיבה איך העסק עובד. העסק מכתיב איך התוכנה נבנית.",
  lead:
    "אנחנו בונים מערכות ניהול בענן לעסקים קטנים ובינוניים, בכל תחום. הבסיס הוא תמיד אותו בסיס: קודם מבינים איך העבודה מתנהלת אצלכם בפועל, ורק אחר כך מחליטים מה המערכת צריכה לעשות.",
  points: [
    {
      id: "value-fit",
      title: "המערכת נבנית סביב התהליך הקיים",
      description:
        "לא צריך לשנות את דרך העבודה כדי שהיא תיכנס לתוך מסכים שמישהו אחר תכנן. המערכת מקבלת את המבנה של העסק, המונחים, השלבים, מי מאשר מה, ומייצגת אותו כמו שהוא.",
    },
    {
      id: "value-range",
      title: "העדות היא רוחב הלקוחות",
      description:
        "מאמן ג׳ודו שמנהל מנויים ונוכחות ומפעל שעוקב אחרי מלאי בחדר נקי לא חולקים כלום, לא מונחים, לא קצב עבודה, לא חוקים. שניהם קיבלו מערכת שנתפרה למידותיהם. זה אפשרי כי אנחנו לא מוכרים מוצר קיים.",
    },
    {
      id: "value-cloud",
      title: "בענן, בלי שרת במשרד",
      description:
        "המערכת נגישה מכל מקום ומכל מכשיר, בלי התקנות ובלי תחזוקה של חומרה. מי שצריך לראות נתון רואה אותו גם כשהוא לא במשרד, והמידע נשמר במקום אחד מוסדר.",
    },
    {
      id: "value-quiet",
      title: "פחות עבודה כפולה, פחות שאלות פתוחות",
      description:
        "מידע שמוזן פעם אחת מגיע לכל מקום שצריך אותו. במקום לחפש איפה הדברים עומדים ולאסוף תשובות מכמה מקורות, התמונה קיימת ומעודכנת, וזה מה שמשנה את היום־יום.",
    },
  ],
};
