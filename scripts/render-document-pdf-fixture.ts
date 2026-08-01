import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  IntroductoryDocumentVersionSnapshot,
  SystemPlanDocumentVersionSnapshot,
} from "@/server/repositories/document.repository";
import { renderIntroductorySummaryPdf } from "@/features/portal/documents/introductory-summary-pdf";
import { renderSystemPlanPdf } from "@/features/portal/documents/system-plan-pdf";

const outputDirectory = path.join(process.cwd(), "tmp", "pdfs");
const outputPath = path.join(outputDirectory, "introductory-summary.pdf");
const systemPlanOutputPath = path.join(outputDirectory, "system-plan.pdf");

const version: IntroductoryDocumentVersionSnapshot = {
  id: "11111111-1111-4111-8111-111111111111",
  documentId: "22222222-2222-4222-8222-222222222222",
  projectId: "33333333-3333-4333-8333-333333333333",
  projectName: "מערכת ניהול AthleteTrack",
  kind: "introductory_summary",
  versionNumber: 1,
  status: "published",
  contentHash:
    "46ed522a75d044142abe152c27728dfc3dd92807b0f12e44e44bff8617b8c762",
  createdAt: "2026-07-31T08:00:00.000Z",
  publishedAt: "2026-07-31T09:00:00.000Z",
  content: {
    schemaVersion: 1,
    title: "סיכום שיחת היכרות והצעה לאפיון ותכנון",
    companyName: "AthleteTrack",
    contacts: [
      {
        fullName: "ישראל ישראלי",
        email: "israel@example.com",
        phone: "+972501234567",
      },
    ],
    currentSituation:
      "הפעילות מנוהלת כיום בין גיליונות, הודעות ויישומים נפרדים. אין מקור אמת אחד למעקב אחר הספורטאים והמשימות.",
    /*
     * Carries an emoji bullet and a tab on purpose. Both editors ingest pasted ChatGPT
     * output, which routinely contains them, and the embedded font can draw neither: each
     * one would otherwise print Heebo's `.notdef` outline and push the rest of the line
     * 0.657em off the margin.
     */
    operationalFriction:
      "🔹 הצוות משקיע זמן באיסוף נתונים ידני, עדכונים כפולים ובירור מי מחזיק בכל משימה.\n\tמידע חשוב מגיע באיחור.",
    /*
     * Deliberately mixes Hebrew with Latin terms and ends on a period. Both are what real
     * briefs look like, and both are what a wrong bidi base level visibly breaks: the
     * closing period jumps to the right edge and the Latin run lands on the wrong side of
     * the words around it.
     */
    desiredOutcomes:
      "תמונת מצב אחת ב-MVP ראשון, חלוקת אחריות ברורה, פחות עבודה ידנית ויכולת לקבל החלטות על בסיס נתונים עדכניים.",
    scopeAndAssumptions:
      "עובדות שאושרו:\nהעבודה מתבצעת בידי צוות מקצועי אחד ובשלושה סוגי הרשאות.\nהנחות עבודה:\nניתן יהיה לייצא את נתוני המערכת הקיימת בפורמט מוסכם.\nגבולות ההיקף:\nשלב זה מתמקד בתהליך הליבה ובהחלטות הנדרשות לאפיון.\nנכלל בשלב הנוכחי:\nמשתמשים, הרשאות, מסכים מרכזיים, נתונים ואינטגרציות נדרשות.",
    openQuestions:
      "יש לאמת את מספר סוגי המשתמשים, מקורות הנתונים, תדירות העדכון והאינטגרציות הנדרשות בשלב הראשון.",
    discoveryIncludes:
      "מיפוי תהליכים, הגדרת משתמשים והרשאות, מסכים מרכזיים, נתונים, אינטגרציות ותכנית יישום.",
    deliverables:
      "מסמך אפיון ותכנון מלא, חלופות פתרון, תכנית עבודה והצעת מחיר להקמת המערכת.",
    estimatedTimeline:
      "משך משוער:\nעד עשרה ימי עסקים.\nתלות בלקוח:\nקבלת התשלום, חומרי הרקע והאישורים הנדרשים בזמן.",
    price: {
      amountAgorot: 450000,
      currency: "ILS",
    },
    paymentTerms:
      "התשלום מבוצע מראש ופותח את שלב האפיון והתכנון. המחיר כולל את כל התוצרים המפורטים במסמך.",
    exclusions:
      "- פיתוח המערכת\n- רישיונות צד שלישי\n- הזנת נתונים והדרכות, אלא אם צוין אחרת",
    validUntil: "2026-08-14T09:00:00.000Z",
    preparedAt: "2026-07-31T08:00:00.000Z",
  },
};

const systemPlanVersion: SystemPlanDocumentVersionSnapshot = {
  id: "44444444-4444-4444-8444-444444444444",
  documentId: "55555555-5555-4555-8555-555555555555",
  projectId: "33333333-3333-4333-8333-333333333333",
  projectName: "מערכת ניהול AthleteTrack",
  kind: "discovery_plan",
  versionNumber: 2,
  status: "published",
  contentHash:
    "9f2c1d7a6b3e58d0417c9a2b4e6f8103d5c7a9b1e3f50726d8a4c6e0b2d4f618",
  createdAt: "2026-07-31T08:00:00.000Z",
  publishedAt: "2026-07-31T09:00:00.000Z",
  content: {
    schemaVersion: 1,
    title: "תכנון מערכת AthleteTrack והצעת פיתוח",
    companyName: "AthleteTrack",
    projectName: "מערכת ניהול AthleteTrack",
    executiveSummary:
      "מערכת אחת שמרכזת ספורטאים, אימונים ומדידות, במקום גיליונות והודעות נפרדים. השלב הזה מקים את הליבה ומעלה אותה לאוויר.",
    successMetrics:
      "זמן הכנת דוח שבועי יורד מארבע שעות לפחות מחצי שעה, וכל מדידה נרשמת פעם אחת בלבד.",
    solutionOverview:
      "פורטל מאובטח למאמן ולספורטאי, עם הרשאות נפרדות, תיעוד אימונים והתראות על חריגות.",
    modulesAndWorkflows:
      "ניהול ספורטאים, תכנון אימונים, רישום מדידות, התראות ודוחות תקופתיים.",
    usersAndPermissions:
      "שלושה תפקידים: מנהל מערכת, מאמן וספורטאי. ספורטאי רואה רק את הנתונים שלו.",
    phases: [
      {
        name: "תכנון טכני והכנה",
        outcome: "מודל הנתונים והמסכים מאושרים.",
        deliverables: "סכמת נתונים, מפת מסכים וסביבת פיתוח.",
        timeline: "שבועיים",
      },
      {
        name: "פיתוח ליבה",
        outcome: "ניהול ספורטאים, אימונים ומדידות עובד מקצה לקצה.",
        deliverables: "מודולי הליבה והרשאות המשתמשים.",
        timeline: "שישה שבועות",
      },
      {
        name: "בדיקות והכנת השקה",
        outcome: "המערכת יציבה ונבדקה מול תרחישים אמיתיים.",
        deliverables: "בדיקות קבלה, תיקונים והדרכה מוקלטת.",
        timeline: "שבועיים",
      },
    ],
    developmentOptions: [
      {
        name: "MVP ממוקד",
        bestFor: "מאמן יחיד שרוצה להפסיק לעבוד בגיליונות מהר.",
        scope: "ניהול ספורטאים ורישום מדידות בלבד, בלי דוחות מתקדמים.",
        timeline: "כחודשיים",
        price: { amountAgorot: 3_800_000, currency: "ILS" },
        recommended: false,
      },
      {
        name: "פתרון מומלץ",
        bestFor: "מועדון שמנהל כמה מאמנים וזקוק לדוחות ולהתראות.",
        scope: "כל מודולי הליבה, התראות, דוחות תקופתיים והרשאות מלאות.",
        timeline: "כשלושה חודשים",
        price: { amountAgorot: 6_400_000, currency: "ILS" },
        recommended: true,
      },
    ],
    supportPlans: [
      {
        name: "תחזוקה בסיסית",
        coverage: "עדכוני אבטחה, גיבוי מנוטר ותיקון תקלות.",
        responseTime: "שני ימי עסקים",
        monthlyPrice: { amountAgorot: 90_000, currency: "ILS" },
      },
      {
        name: "ליווי שוטף",
        coverage: "כל האמור לעיל, ובנוסף שעות פיתוח חודשיות ופגישת מעקב.",
        responseTime: "יום עסקים אחד",
        monthlyPrice: { amountAgorot: 220_000, currency: "ILS" },
      },
    ],
    changePricing: {
      smallFeatureFrom: { amountAgorot: 120_000, currency: "ILS" },
      largeFeatureFrom: { amountAgorot: 600_000, currency: "ILS" },
      hourlyRate: { amountAgorot: 35_000, currency: "ILS" },
      notes:
        "כל שינוי מתומחר לאחר הגדרת היקף קצרה. המחירים המוצגים הם נקודת פתיחה ואינם התחייבות ללא אפיון השינוי.",
    },
    clientResponsibilities:
      "מסירת רשימת הספורטאים הקיימת, החלטה על מבנה ההרשאות וזמינות איש קשר אחד לאישורים.",
    assumptionsAndRisks:
      "מונח שניתן לייצא את הנתונים הקיימים לקובץ מסודר. אם לא, הסבת הנתונים תתומחר בנפרד.",
    exclusions:
      "רישיונות, שירותי ענן, הודעות SMS וספקי צד שלישי אינם כלולים ומשולמים ישירות לספק.",
    warranty:
      "תיקון תקלות שנגרמו מהמימוש שסופק כלול בתקופת האחריות; שינוי דרישה או התנהגות חדשה מתומחרים בנפרד.",
    paymentTerms:
      "40% עם אישור ההצעה, 40% בתום שלב פיתוח הליבה והיתרה במסירה.",
    preparedAt: "2026-07-31T08:00:00.000Z",
    validUntil: "2026-08-14T09:00:00.000Z",
  },
};

async function main() {
  await mkdir(outputDirectory, { recursive: true });
  await writeFile(outputPath, await renderIntroductorySummaryPdf(version));
  await writeFile(systemPlanOutputPath, await renderSystemPlanPdf(systemPlanVersion));
  process.stdout.write(`${outputPath}\n${systemPlanOutputPath}\n`);
}

void main();
