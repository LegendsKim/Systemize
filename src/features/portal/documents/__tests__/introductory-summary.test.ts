import { describe, expect, it } from "vitest";
import {
  buildIntroductorySummaryContent,
  introductorySummaryFormSchema,
  toIntroductorySummaryFormDefaults,
} from "../introductory-summary";

const validForm = {
  projectId: "11111111-1111-4111-8111-111111111111",
  documentId: "22222222-2222-4222-8222-222222222222",
  versionId: "33333333-3333-4333-8333-333333333333",
  idempotencyKey: "44444444-4444-4444-8444-444444444444",
  title: "סיכום והצעה לאפיון",
  currentSituation: "תהליך ידני בין כמה כלים.",
  operationalFriction: "כפילויות וחוסר בתמונת מצב.",
  desiredOutcomes: "מקור אמת אחד ואחריות ברורה.",
  scopeAndAssumptions: "האפיון מתמקד בתהליך הליבה.",
  openQuestions: "יש לאמת את מקורות הנתונים.",
  discoveryIncludes: "מיפוי תהליך, הרשאות ומסכים.",
  deliverables: "מסמך אפיון ותכנית עבודה.",
  estimatedTimeline: "עשרה ימי עסקים.",
  priceIls: "4500.25",
  paymentTerms: "תשלום מראש לפני תחילת האפיון.",
  exclusions: "פיתוח המערכת אינו כלול.",
  validityDays: "14",
};

describe("introductory summary contract", () => {
  it("normalizes money and validity into an immutable content snapshot", () => {
    const parsed = introductorySummaryFormSchema.parse(validForm);
    const content = buildIntroductorySummaryContent({
      parsed,
      companyName: "AthleteTrack",
      contacts: [
        {
          fullName: "ישראל ישראלי",
          email: "israel@example.com",
          phone: "+972501234567",
        },
      ],
      now: new Date("2026-07-31T09:00:00.000Z"),
    });

    expect(content.price).toEqual({
      amountAgorot: 450025,
      currency: "ILS",
    });
    expect(content.preparedAt).toBe("2026-07-31T09:00:00.000Z");
    expect(content.validUntil).toBe("2026-08-14T09:00:00.000Z");
    expect(content.companyName).toBe("AthleteTrack");
    expect(content.contacts[0]?.email).toBe("israel@example.com");
  });

  it("rejects malformed prices and validity outside the commercial bounds", () => {
    expect(
      introductorySummaryFormSchema.safeParse({
        ...validForm,
        priceIls: "4,500",
      }).success
    ).toBe(false);
    expect(
      introductorySummaryFormSchema.safeParse({
        ...validForm,
        validityDays: "91",
      }).success
    ).toBe(false);
  });

  it("round-trips a published snapshot into safe revision defaults", () => {
    const parsed = introductorySummaryFormSchema.parse(validForm);
    const content = buildIntroductorySummaryContent({
      parsed,
      companyName: "AthleteTrack",
      contacts: [],
      now: new Date("2026-07-31T09:00:00.000Z"),
    });

    const defaults = toIntroductorySummaryFormDefaults(content);

    expect(defaults.priceIls).toBe("4500.25");
    expect(defaults.validityDays).toBe(14);
    expect(defaults.title).toBe(validForm.title);
  });
});
