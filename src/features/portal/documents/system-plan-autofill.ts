import { z } from "zod";
import {
  systemPlanEditorSchema,
  type SystemPlanEditorValues,
} from "./system-plan";

const autofillSchema = systemPlanEditorSchema.extend({
  schemaVersion: z.literal("systemize.system-plan.autofill.v1"),
});

function stripMarkdownFence(value: string): string {
  const trimmed = value.trim();
  return trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)?.[1]?.trim() ?? trimmed;
}

export function parseSystemPlanAutofill(value: string): SystemPlanEditorValues {
  if (!value.trim()) throw new Error("יש להדביק את פלט ה־JSON שקיבלת.");

  let decoded: unknown;
  try {
    decoded = JSON.parse(stripMarkdownFence(value));
  } catch {
    throw new Error("הפלט אינו JSON תקין. יש לבקש פלט JSON בלבד.");
  }

  const parsed = autofillSchema.safeParse(decoded);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = issue?.path.join(".");
    throw new Error(
      field && issue
        ? `השדה ${field} אינו תקין — ${issue.message}`
        : "מבנה הפלט אינו תואם לגרסת המסמך."
    );
  }

  const { schemaVersion: _schemaVersion, ...editor } = parsed.data;
  return editor;
}

export function buildSystemPlanPrompt(context: {
  readonly companyName: string;
  readonly projectName: string;
  readonly discoveryContext: string;
}): string {
  const example = {
    schemaVersion: "systemize.system-plan.autofill.v1",
    title: "מסמך תכנון מערכת והצעת פיתוח",
    executiveSummary: "",
    successMetrics: "",
    solutionOverview: "",
    modulesAndWorkflows: "",
    developmentOptions: [
      { name: "", bestFor: "", scope: "", timeline: "", priceIls: "", recommended: true },
      { name: "", bestFor: "", scope: "", timeline: "", priceIls: "", recommended: false },
    ],
    phases: [
      { name: "", outcome: "", deliverables: "", timeline: "" },
      { name: "", outcome: "", deliverables: "", timeline: "" },
    ],
    supportPlans: [
      { name: "", coverage: "", responseTime: "", monthlyPriceIls: "" },
    ],
    smallFeatureFromIls: "",
    largeFeatureFromIls: "",
    hourlyRateIls: "",
    changePricingNotes: "",
    paymentTerms: "",
    exclusions: "",
    clientResponsibilities: "",
    assumptionsAndRisks: "",
    warranty: "",
    usersAndPermissions: "",
    integrationsAndData: "",
    architectureAndSecurity: "",
    uxAccessibilityAndDevices: "",
    migrationAndRollout: "",
    validityDays: 14,
  };

  return `אתה משמש כארכיטקט תוכנה ומנהל פרויקטים בכיר עבור SYSTEMIZE. עליך להכין מסמך תכנון מערכת והצעת פיתוח מלא עבור ${context.companyName}, פרויקט ${context.projectName}.

עבוד כמו מפתח מנוסה שליווה לקוחות במשך שנים: בדוק תהליכים, משתמשים והרשאות, חריגים, נתונים והסבה, אינטגרציות, אבטחה ופרטיות, ביצועים, נגישות, מובייל, בדיקות, הטמעה, הדרכה, גיבוי, ניטור, תחזוקה ועלויות צד שלישי. אל תסתפק ברשימת פיצ'רים.

זהו הקשר האפיון שכבר נאסף:
${context.discoveryContext}

כללים מחייבים:
1. אל תמציא עובדות, מחירים, זמני ביצוע או התחייבויות. שאל עד 5 שאלות ממוקדות בכל הודעה עד שכל החוסרים נסגרו.
2. הצע 2–4 חלופות פיתוח שונות באמת וסמן חלופה מומלצת אחת בלבד. המחיר היחיד במסמך הוא מחיר החלופה.
3. פרק את העבודה על החלופה המומלצת ל־2–8 שלבים. לכל שלב תוצאה, תוצרים ומשך — בלי מחיר. שלב אינו מתומחר בנפרד.
4. כלול 1–4 מסלולי תמיכה חודשית, זמני תגובה וכיסוי ברור.
5. הגדר מחיר פתיחה לפיצ'ר קטן, לפיצ'ר גדול ותעריף שעתי, והבהר ששינוי דורש הגדרת היקף.
6. כתוב תנאי תשלום, מה אינו כלול (כולל עלויות ורישיונות צד שלישי, באותו שדה), אחריות, אחריות הלקוח, הנחות וסיכונים.
7. חמשת שדות הנספח הטכני אינם חובה. מלא רק את מה שיש עליו מה לומר, והשאר מחרוזת ריקה בשאר.
8. כתוב קצר. הלקוח מקבל החלטה מסחרית, לא קורא מפרט הנדסי. אל תחזור על אותו מידע בשני שדות.
9. השתמש בעברית מקצועית וברורה שהלקוח יכול להבין. אל תחשוף הערות פנימיות.
10. רק לאחר שאאשר שהראיון הושלם, החזר אובייקט JSON יחיד, בלי Markdown ובלי טקסט נוסף.

מבנה הפלט המדויק:
${JSON.stringify(example, null, 2)}

המערכים יכולים להכיל יותר פריטים עד הגבולות שצוינו. כל שדה טקסט חייב להכיל תוכן ממשי; מחירים נכתבים כמחרוזת מספרית בשקלים, ללא סימן מטבע.`;
}
