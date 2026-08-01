import { describe, expect, it } from "vitest";
import { derivePaymentStep } from "../stepper";

describe("payment workflow step", () => {
  it("is upcoming before a payment request is published", () => {
    expect(derivePaymentStep([])).toEqual({
      state: "upcoming",
      detail: "טרם פורסם",
    });
  });

  it("is current while a payment request is pending", () => {
    expect(derivePaymentStep([{ status: "pending" }])).toEqual({
      state: "current",
      detail: "ממתין ללקוח",
    });
  });

  it("is complete after payment is recorded", () => {
    expect(derivePaymentStep([{ status: "paid" }])).toEqual({
      state: "complete",
      detail: "שולם",
    });
  });

  it("keeps the completed gate filled when historical requests coexist", () => {
    expect(
      derivePaymentStep([{ status: "cancelled" }, { status: "paid" }])
    ).toEqual({ state: "complete", detail: "שולם" });
  });
});
