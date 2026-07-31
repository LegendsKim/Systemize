import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { DocumentVersionSnapshot } from "@/server/repositories/document.repository";
import { renderIntroductorySummaryPdf } from "@/features/portal/documents/introductory-summary-pdf";

const outputDirectory = path.join(process.cwd(), "tmp", "pdfs");
const outputPath = path.join(outputDirectory, "introductory-summary.pdf");

const version: DocumentVersionSnapshot = {
  id: "11111111-1111-4111-8111-111111111111",
  documentId: "22222222-2222-4222-8222-222222222222",
  projectId: "33333333-3333-4333-8333-333333333333",
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
    operationalFriction:
      "הצוות משקיע זמן באיסוף נתונים ידני, עדכונים כפולים ובירור מי מחזיק בכל משימה. מידע חשוב מגיע באיחור.",
    desiredOutcomes:
      "תמונת מצב אחת, חלוקת אחריות ברורה, פחות עבודה ידנית ויכולת לקבל החלטות על בסיס נתונים עדכניים.",
    scopeAndAssumptions:
      "האפיון יתמקד בתהליך הליבה, בהרשאות ובמידע הדרוש לכל תפקיד. הלקוח יספק דוגמאות למסמכים ולתהליכים הקיימים.",
    openQuestions:
      "יש לאמת את מספר סוגי המשתמשים, מקורות הנתונים, תדירות העדכון והאינטגרציות הנדרשות בשלב הראשון.",
    discoveryIncludes:
      "מיפוי תהליכים, הגדרת משתמשים והרשאות, מסכים מרכזיים, נתונים, אינטגרציות ותכנית יישום.",
    deliverables:
      "מסמך אפיון ותכנון מלא, חלופות פתרון, תכנית עבודה והצעת מחיר להקמת המערכת.",
    estimatedTimeline:
      "עד עשרה ימי עסקים ממועד קבלת התשלום וכל חומרי הרקע הנדרשים.",
    price: {
      amountAgorot: 450000,
      currency: "ILS",
    },
    paymentTerms:
      "התשלום מבוצע מראש ופותח את שלב האפיון והתכנון. המחיר כולל את כל התוצרים המפורטים במסמך.",
    exclusions:
      "פיתוח המערכת, רישיונות צד שלישי, הזנת נתונים והדרכות אינם כלולים בשלב זה אלא אם צוין אחרת.",
    validUntil: "2026-08-14T09:00:00.000Z",
    preparedAt: "2026-07-31T08:00:00.000Z",
  },
};

async function main() {
  await mkdir(outputDirectory, { recursive: true });
  await writeFile(outputPath, await renderIntroductorySummaryPdf(version));
  process.stdout.write(outputPath);
}

void main();
