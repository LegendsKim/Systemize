import { describe, expect, it } from "vitest";
import {
  buildSystemPlanContent,
  recommendedSystemPlanOption,
  systemPlanAppendix,
  systemPlanContentSchema,
  systemPlanEditorSchema,
  toSystemPlanEditorDefaults,
} from "../system-plan";
import {
  buildSystemPlanPrompt,
  parseSystemPlanAutofill,
} from "../system-plan-autofill";

const editor = {
  title: "מסמך תכנון מערכת והצעת פיתוח",
  executiveSummary: "מערכת אחת שמרכזת את תהליך הליבה.",
  successMetrics: "זמן הטיפול יימדד לפני ואחרי ההשקה.",
  solutionOverview: "פורטל מאובטח שמרכז עבודה, מידע והתראות.",
  modulesAndWorkflows: "קליטה, טיפול, אישור, תיעוד ודיווח.",
  phases: [
    { name: "הכנה", outcome: "תשתית מוכנה.", deliverables: "סביבה ותכנון.", timeline: "שבוע" },
    { name: "פיתוח", outcome: "מערכת עובדת.", deliverables: "מודולי הליבה.", timeline: "ארבעה שבועות" },
  ],
  developmentOptions: [
    { name: "MVP", bestFor: "השקה מהירה.", scope: "תהליך ליבה בלבד.", timeline: "חודש", priceIls: "30000", recommended: false },
    { name: "מורחב", bestFor: "ארגון בשל.", scope: "ליבה ודוחות מתקדמים.", timeline: "חודשיים", priceIls: "50000", recommended: true },
  ],
  supportPlans: [
    { name: "שוטף", coverage: "בדיקות, עדכונים ותיקונים.", responseTime: "יום עסקים", monthlyPriceIls: "1500" },
  ],
  smallFeatureFromIls: "1200",
  largeFeatureFromIls: "6000",
  hourlyRateIls: "350",
  changePricingNotes: "כל שינוי עובר הגדרת היקף לפני התחייבות.",
  paymentTerms: "מקדמה ואבני תשלום לפי שלבים.",
  exclusions: "רישיונות צד שלישי ועלויות ענן אינם כלולים.",
  clientResponsibilities: "הלקוח מספק מידע ואישורים בזמן.",
  assumptionsAndRisks: "זמינות הממשק החיצוני דורשת אימות.",
  warranty: "תקלות מימוש יתוקנו בתקופת האחריות.",
  usersAndPermissions: "מנהל, עובד ולקוח עם הרשאות נפרדות.",
  integrationsAndData: "",
  architectureAndSecurity: "",
  uxAccessibilityAndDevices: "",
  migrationAndRollout: "",
  validityDays: 14,
} as const;

function build() {
  return buildSystemPlanContent({
    editor: systemPlanEditorSchema.parse(editor),
    companyName: "חברה לדוגמה",
    projectName: "מערכת לדוגמה",
    now: new Date("2026-08-01T00:00:00.000Z"),
  });
}

describe("system plan document", () => {
  it("builds a strict immutable snapshot and converts every price to agorot", () => {
    const content = build();

    expect(systemPlanContentSchema.parse(content)).toEqual(content);
    expect(content.developmentOptions[1]?.price.amountAgorot).toBe(5_000_000);
    expect(content.supportPlans[0]?.monthlyPrice.amountAgorot).toBe(150_000);
    expect(content.changePricing.smallFeatureFrom.amountAgorot).toBe(120_000);
  });

  it("prices the offer only through the recommended option, never through a phase", () => {
    const content = build();

    // The regression this guards: the document used to carry a price per phase as well as a
    // price per option, so the page showed two different totals and did not say which one
    // the client owed.
    for (const phase of content.phases) {
      expect(phase.price).toBeUndefined();
    }
    expect(recommendedSystemPlanOption(content).name).toBe("מורחב");
    expect(recommendedSystemPlanOption(content).price.amountAgorot).toBe(5_000_000);
  });

  it("falls back to the first option when no version marked a recommendation", () => {
    const content = build();
    const withoutRecommendation = {
      ...content,
      developmentOptions: content.developmentOptions.map((option) => ({
        ...option,
        recommended: false,
      })),
    };

    expect(recommendedSystemPlanOption(withoutRecommendation).name).toBe("MVP");
  });

  it("keeps an unfilled technical appendix out of the document entirely", () => {
    const content = build();
    const appendix = systemPlanAppendix(content);

    expect(appendix).toEqual([
      { label: "משתמשים והרשאות", value: "מנהל, עובד ולקוח עם הרשאות נפרדות." },
    ]);
    expect(content.integrationsAndData).toBeUndefined();
  });

  it("requires exactly one recommended development option", () => {
    expect(
      systemPlanEditorSchema.safeParse({
        ...editor,
        developmentOptions: editor.developmentOptions.map((option) => ({
          ...option,
          recommended: false,
        })),
      }).success
    ).toBe(false);
  });

  it("still reads a version stored under the longer format", () => {
    // A published version is immutable and re-parsed on every read, so the fields the editor
    // stopped collecting have to keep parsing — otherwise the repository drops the version
    // and the document disappears from the portal.
    const legacy = {
      ...build(),
      businessGoals: "קיצור זמני טיפול ושיפור שקיפות.",
      thirdPartyCosts: "עלויות ענן משולמות ישירות לספק.",
      phases: build().phases.map((phase) => ({
        ...phase,
        price: { amountAgorot: 500_000, currency: "ILS" as const },
      })),
    };

    const parsed = systemPlanContentSchema.parse(legacy);
    expect(parsed.phases[0]?.price?.amountAgorot).toBe(500_000);

    const reopened = toSystemPlanEditorDefaults(parsed);
    expect(reopened.phases[0]).not.toHaveProperty("price");
    expect(reopened.exclusions).toContain("עלויות ענן משולמות ישירות לספק.");
    expect(systemPlanAppendix(parsed).map((entry) => entry.label)).toContain(
      "מטרות עסקיות"
    );
  });

  it("accepts only the versioned autofill payload", () => {
    const parsed = parseSystemPlanAutofill(
      JSON.stringify({
        schemaVersion: "systemize.system-plan.autofill.v1",
        ...editor,
      })
    );
    expect(parsed.title).toBe(editor.title);
    expect(() =>
      parseSystemPlanAutofill(
        JSON.stringify({
          schemaVersion: "systemize.system-plan.autofill.v1",
          ...editor,
          secretCommitment: "tomorrow",
        })
      )
    ).toThrow();
  });

  it("prompts for support, change pricing, an unpriced phase list and no invented commitments", () => {
    const prompt = buildSystemPlanPrompt({
      companyName: "חברה לדוגמה",
      projectName: "מערכת לדוגמה",
      discoveryContext: "הלקוח מבקש תהליך מאובטח.",
    });
    expect(prompt).toContain("אל תמציא עובדות, מחירים");
    expect(prompt).toContain("מסלולי תמיכה חודשית");
    expect(prompt).toContain("פיצ'ר קטן");
    expect(prompt).toContain("בלי מחיר");
    expect(prompt).toContain("systemize.system-plan.autofill.v1");
    expect(prompt).not.toContain("thirdPartyCosts");
  });
});
