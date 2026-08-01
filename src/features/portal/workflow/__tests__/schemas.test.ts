import { describe, expect, it } from "vitest";
import { formatIls } from "../format";
import {
  hasIntakeFieldErrors,
  intakeMinimumAnswerLength,
  parseIntakeForm,
  paymentRequestSchema,
} from "../schemas";

function createCompleteIntakeForm(): FormData {
  const form = new FormData();
  const requiredAnswers = {
    companyOverview: "A service company helping local businesses operate better.",
    productsAndServices: "Consulting, implementation, and ongoing support.",
    decisionProcess: "The founder approves scope and the operations lead validates it.",
    currentProcess: "Requests arrive by phone and are copied manually into spreadsheets.",
    primaryChallenges: "Information is duplicated and follow-up tasks are often missed.",
    dataSources: "Google Sheets, email, WhatsApp, and accounting software.",
    goals: "Reduce manual work, improve follow-up, and create one source of truth.",
    successMetrics: "Faster response time and fewer missed customer requests.",
    usersAndRoles: "Managers see all records while team members see assigned work.",
    mustHaveFeatures: "Customer records, tasks, reminders, documents, and reporting.",
    securityRequirements: "Customer contact details require role-based access.",
  };
  for (const [key, value] of Object.entries(requiredAnswers)) {
    form.set(key, value);
  }
  return form;
}

describe("guest intake validation", () => {
  it("allows an incomplete draft to be saved", () => {
    const form = new FormData();
    form.set("companyOverview", "Short");
    expect(hasIntakeFieldErrors(parseIntakeForm(form, false))).toBe(false);
  });

  it("requires meaningful answers before submission", () => {
    const form = new FormData();
    form.set("companyOverview", "Short");
    const result = parseIntakeForm(form, true);
    expect(hasIntakeFieldErrors(result)).toBe(true);
    expect(result.fieldErrors.companyOverview).toBeDefined();
    expect(result.fieldErrors.currentProcess).toBeDefined();
  });

  it("says how many characters are still missing", () => {
    const form = new FormData();
    form.set("companyOverview", "קצר");
    const result = parseIntakeForm(form, true);

    expect(result.fieldErrors.companyOverview?.[0]).toContain(
      String(intakeMinimumAnswerLength - 3)
    );
  });

  /*
   * The regression that cost a client ten minutes of typing: a rejected submission has to
   * hand every answer back, or the form redraws from server state that never received it.
   */
  it("returns the submitted answers even when the submission is rejected", () => {
    const form = new FormData();
    form.set("companyOverview", "Short");
    form.set("additionalNotes", "A note that is long enough to keep.");
    form.set("clientReply", "  השלמתי את מה שביקשתם  ");

    const result = parseIntakeForm(form, true);

    expect(hasIntakeFieldErrors(result)).toBe(true);
    expect(result.answers.companyOverview).toBe("Short");
    expect(result.answers.additionalNotes).toBe(
      "A note that is long enough to keep."
    );
    expect(result.clientReply).toBe("השלמתי את מה שביקשתם");
  });

  it("accepts a complete confidential intake", () => {
    expect(
      hasIntakeFieldErrors(parseIntakeForm(createCompleteIntakeForm(), true))
    ).toBe(false);
  });
});
describe("payment request validation", () => {
  it("accepts an HTTPS ILS payment request", () => {
    expect(
      paymentRequestSchema.safeParse({
        projectId: "123e4567-e89b-42d3-a456-426614174000",
        kind: "discovery",
        title: "Full discovery",
        amountIls: "4500",
        paymentUrl: "https://payments.example.test/request/123",
        idempotencyKey: "123e4567-e89b-42d3-a456-426614174001",
      }).success
    ).toBe(true);
  });

  it("rejects an insecure payment link", () => {
    expect(
      paymentRequestSchema.safeParse({
        projectId: "123e4567-e89b-42d3-a456-426614174000",
        kind: "discovery",
        title: "Full discovery",
        amountIls: "4500",
        paymentUrl: "http://payments.example.test/request/123",
        idempotencyKey: "123e4567-e89b-42d3-a456-426614174001",
      }).success
    ).toBe(false);
  });

  it("rejects a local file path because a client cannot open it", () => {
    expect(
      paymentRequestSchema.safeParse({
        projectId: "123e4567-e89b-42d3-a456-426614174000",
        kind: "discovery",
        title: "Full discovery",
        amountIls: "800",
        paymentUrl: "file:///C:/Users/owner/Downloads/summary.pdf",
        idempotencyKey: "123e4567-e89b-42d3-a456-426614174001",
      }).success
    ).toBe(false);
  });

  it("formats money explicitly as ILS", () => {
    expect(formatIls(450_000)).toContain("4,500");
  });
});
