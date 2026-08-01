import { z } from "zod";

const autofillText = (label: string, max = 4_000) =>
  z
    .string()
    .trim()
    .min(2, `${label} חסר או קצר מדי.`)
    .max(max, `${label} ארוך מדי.`);

export const introductorySummaryAutofillSchema = z
  .object({
    schemaVersion: z.literal("systemize.introductory-summary.autofill.v1"),
    title: autofillText("כותרת המסמך", 160),
    currentSituation: autofillText("המצב הקיים"),
    operationalFriction: autofillText("הבעיות והחיכוך התפעולי"),
    desiredOutcomes: autofillText("התוצאות העסקיות הרצויות"),
    scopeAndAssumptions: autofillText("ההיקף וההנחות"),
    openQuestions: autofillText("השאלות הפתוחות"),
    discoveryIncludes: autofillText("תכולת האפיון והתכנון"),
    deliverables: autofillText("התוצרים"),
    estimatedTimeline: autofillText("לוח הזמנים", 1_000),
    priceIls: z
      .number()
      .positive("מחיר האפיון חייב להיות חיובי.")
      .max(1_000_000, "מחיר האפיון גבוה מדי."),
    paymentTerms: autofillText("תנאי התשלום", 1_000),
    exclusions: autofillText("מה לא כלול"),
    validityDays: z.number().int().min(1).max(90),
  })
  .strict();

export type IntroductorySummaryAutofill = z.infer<
  typeof introductorySummaryAutofillSchema
>;

function stripMarkdownFence(value: string): string {
  const trimmed = value.trim();
  const match = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return match?.[1]?.trim() ?? trimmed;
}

export function parseIntroductorySummaryAutofill(
  value: string
): IntroductorySummaryAutofill {
  if (value.trim().length === 0) {
    throw new Error("יש להדביק את פלט ה־JSON שקיבלת מ־ChatGPT.");
  }

  let decoded: unknown;
  try {
    decoded = JSON.parse(stripMarkdownFence(value));
  } catch {
    throw new Error(
      "הפלט אינו JSON תקין. בקש מ־ChatGPT להחזיר רק את אובייקט ה־JSON הסופי."
    );
  }

  const parsed = introductorySummaryAutofillSchema.safeParse(decoded);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    if (!firstIssue) {
      throw new Error(
        "לא ניתן למלא את המסמך: מבנה הפלט אינו תואם לגרסה הנדרשת."
      );
    }
    const field = firstIssue.path.join(".");
    throw new Error(
      field
        ? `לא ניתן למלא את המסמך: השדה ${field} אינו תקין — ${firstIssue.message}`
        : "לא ניתן למלא את המסמך: מבנה הפלט אינו תואם לגרסה הנדרשת."
    );
  }

  return parsed.data;
}

export function buildIntroductorySummaryPrompt(context: {
  readonly companyName: string;
  readonly projectName: string;
}): string {
  return `אתה מסייע ל-SYSTEMIZE להכין מסמך מקצועי בשם "סיכום שיחת היכרות והצעה לאפיון ותכנון" עבור ${context.companyName}, בפרויקט ${context.projectName}.

הנחת יסוד מחייבת: כבר קיבלת וקראת את מסמך ההיכרות הראשוני שנשלח ללקוח לפני הפגישה. השתמש בכל המידע שבו כבסיס, ואל תבקש ממני להזין אותו מחדש.

המטרה שלך:
1. לאסוף רק מידע שחסר, השתנה או הובהר בפגישת ההיכרות.
2. לשאול שאלות קצרות ומכוונות, עד 5 בכל הודעה. אל תחזור על שאלה שכבר נענתה במסמך או בשיחה.
3. אם קיימת סתירה בין המסמך הראשוני לבין תשובה מהפגישה, הצג אותה ובקש הכרעה.
4. אל תמציא עובדות, מחיר, לוחות זמנים, תנאי תשלום או התחייבויות. כשמידע הכרחי חסר, שאל עליו.
5. שמור על הגבול המסחרי: המסמך מסכם את ההבנה ומגדיר את שלב האפיון בתשלום; הוא אינו מוסר את הפתרון, הארכיטקטורה או תכנית היישום המלאה.
6. כתוב קצר וממוקד: עד שתי פסקאות קצרות בכל שדה, ללא חזרה על אותו מידע בשדות שונים.

לפני הפלט הסופי ודא שיש לך מידע מספק לכל הנושאים הבאים: מצב קיים; חיכוך תפעולי; תוצאות רצויות ומדדי הצלחה; היקף והנחות; שאלות פתוחות; מה כולל שלב האפיון; תוצרים; לוח זמנים; מחיר בשקלים; תנאי תשלום; החרגות; ותוקף ההצעה בימים.

כל עוד חסר מידע, המשך את הראיון ואל תחזיר JSON. לאחר שכל המידע נאסף, אמור במשפט קצר שאתה מוכן להפיק את המסמך ובקש ממני אישור סופי. רק לאחר שאאשר, החזר אובייקט JSON אחד בלבד, בלי Markdown, בלי הערות ובלי טקסט לפניו או אחריו, בדיוק במבנה הבא:

{
  "schemaVersion": "systemize.introductory-summary.autofill.v1",
  "title": "סיכום שיחת היכרות והצעה לאפיון ותכנון",
  "currentSituation": "תיאור קצר של דרך העבודה כיום בלבד, בלי לחזור על הבעיות",
  "operationalFriction": "החיכוך, בזבוז הזמן, הטעויות והקשיים בלבד, בלי לתאר שוב את כל התהליך",
  "desiredOutcomes": "התוצאות העסקיות והתפעוליות הרצויות ומדדי הצלחה שאושרו, אם קיימים",
  "scopeAndAssumptions": "עובדות שאושרו:\\n...\\nהנחות עבודה:\\n...\\nגבולות ההיקף:\\n...\\nנכלל בשלב הנוכחי:\\n...",
  "openQuestions": "רק שאלות או החלטות שבאמת דורשות אימות; אם אין, כתוב בדיוק: אין שאלות פתוחות מהותיות בשלב זה.",
  "discoveryIncludes": "רק הפעולות ש-SYSTEMIZE תבצע בשלב האפיון והתכנון בתשלום",
  "deliverables": "רק התוצרים המוחשיים שהלקוח יקבל בסיום השלב, בלי לחזור על הפעולות",
  "estimatedTimeline": "משך משוער:\\n...\\nתלות בלקוח:\\n...",
  "priceIls": 800,
  "paymentTerms": "תנאי התשלום שסוכמו",
  "exclusions": "- החרגה שנאספה או הוגדרה\\n- החרגה נוספת שנאספה או הוגדרה",
  "validityDays": 14
}

כללי הפלט:
- כתוב בעברית בהירה, עניינית ומכבדת, בגוף מקצועי וללא הגזמות שיווקיות.
- אל תחזור על תיאור התהליך בתוך operationalFriction, ואל תחזור על פעולות האפיון בתוך deliverables.
- בשדה scopeAndAssumptions השתמש בדיוק בכותרות השורות שבדוגמה, כדי להפריד בין עובדות, הנחות, גבולות ומה שנכלל.
- בשדה estimatedTimeline הפרד בין משך לבין תלות בקבלת מידע, חומרים או אישורים. אל תוסיף תלות שלא נמסרה.
- בשדה exclusions כתוב כל החרגה שנאספה בשורה נפרדת המתחילה ב-; אל תוסיף החרגות כלליות שלא נאמרו או הוגדרו.
- פרט לכותרות ולרשימות המובנות האלה, כתוב טקסטים קצרים ומוכנים להצגה ללא Markdown.
- priceIls הוא מספר בלבד בשקלים, ללא סימן מטבע וללא פסיקים.
- validityDays הוא מספר שלם בין 1 ל-90.
- אל תוסיף שדות ואל תשנה שמות שדות.

התחל כעת בסקירה שקטה של המסמך הראשוני שכבר קיבלת, ואז שאל רק את שאלות ההשלמה הראשונות.`;
}
