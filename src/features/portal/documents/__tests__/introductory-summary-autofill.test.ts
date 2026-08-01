import { describe, expect, it } from "vitest";
import {
  buildIntroductorySummaryPrompt,
  parseIntroductorySummaryAutofill,
} from "../introductory-summary-autofill";

const validPayload = {
  schemaVersion: "systemize.introductory-summary.autofill.v1",
  title: "סיכום שיחת היכרות והצעה לאפיון ותכנון",
  currentSituation: "העבודה מתבצעת כיום בכמה מערכות נפרדות.",
  operationalFriction: "הצוות מזין את אותם הנתונים יותר מפעם אחת.",
  desiredOutcomes: "לקצר את זמן הטיפול ולשפר את השקיפות.",
  scopeAndAssumptions: "ההיקף כולל את התהליך המרכזי; זמינות API טרם אומתה.",
  openQuestions: "נדרש לאמת את הרשאות הגישה למערכת הקיימת.",
  discoveryIncludes: "מיפוי תהליכים, משתמשים, נתונים ואינטגרציות.",
  deliverables: "מסמך אפיון, חלופות ותכנית עבודה.",
  estimatedTimeline: "כשבועיים, בכפוף לזמינות בעלי התפקידים.",
  priceIls: 800,
  paymentTerms: "תשלום מראש עם פתיחת שלב האפיון.",
  exclusions: "הפיתוח והרישיונות אינם כלולים.",
  validityDays: 14,
} as const;

describe("introductory summary autofill", () => {
  it("accepts the exact versioned payload, including a markdown JSON fence", () => {
    expect(
      parseIntroductorySummaryAutofill(
        `\`\`\`json\n${JSON.stringify(validPayload)}\n\`\`\``
      )
    ).toEqual(validPayload);
  });

  it("rejects unknown fields so output changes cannot silently enter a document", () => {
    expect(() =>
      parseIntroductorySummaryAutofill(
        JSON.stringify({ ...validPayload, inventedCommitment: "מחר" })
      )
    ).toThrow(/מבנה הפלט אינו תואם/i);
  });

  it("tells ChatGPT the initial document is already present and forbids invention", () => {
    const prompt = buildIntroductorySummaryPrompt({
      companyName: "חברה לדוגמה",
      projectName: "מערכת לדוגמה",
    });

    expect(prompt).toContain("כבר קיבלת וקראת את מסמך ההיכרות הראשוני");
    expect(prompt).toContain("אל תמציא עובדות, מחיר");
    expect(prompt).toContain("systemize.introductory-summary.autofill.v1");
    expect(prompt).toContain("עובדות שאושרו:\\n");
    expect(prompt).toContain("אל תחזור על תיאור התהליך");
    expect(prompt).toContain("אל תוסיף החרגות כלליות");
  });
});
