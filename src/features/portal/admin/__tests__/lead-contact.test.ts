import { describe, expect, it } from "vitest";
import {
  buildTelHref,
  buildWhatsAppHref,
  buildWhatsAppMessage,
  toInternationalDigits,
} from "../lead-contact";

describe("toInternationalDigits", () => {
  it("reads the shapes an Israeli visitor actually types", () => {
    const expected = "972501234567";

    expect(toInternationalDigits("0501234567")).toBe(expected);
    expect(toInternationalDigits("050-123-4567")).toBe(expected);
    expect(toInternationalDigits("050 123 4567")).toBe(expected);
    expect(toInternationalDigits("+972 50 123 4567")).toBe(expected);
    expect(toInternationalDigits("+972-50-1234567")).toBe(expected);
    expect(toInternationalDigits("00972501234567")).toBe(expected);
    expect(toInternationalDigits("972501234567")).toBe(expected);
    expect(toInternationalDigits("501234567")).toBe(expected);
  });

  it("keeps a foreign number the visitor wrote in full", () => {
    expect(toInternationalDigits("+44 20 7946 0958")).toBe("442079460958");
  });

  it("refuses to invent a destination it cannot be sure of", () => {
    expect(toInternationalDigits("")).toBeNull();
    expect(toInternationalDigits("   ")).toBeNull();
    expect(toInternationalDigits("לא רלוונטי")).toBeNull();
    expect(toInternationalDigits("12345")).toBeNull();
    expect(toInternationalDigits("+1234567890123456789")).toBeNull();
  });

  it("honours a different default country code", () => {
    expect(toInternationalDigits("0201234567", "44")).toBe("44201234567");
  });
});

describe("buildWhatsAppMessage", () => {
  it("opens with the lead's first name and their business", () => {
    const message = buildWhatsAppMessage({
      fullName: "דנה כהן",
      businessName: "מאפיית דנה",
      phone: "0501234567",
    });

    expect(message).toContain("היי דנה");
    expect(message).toContain("מאפיית דנה");
  });

  it("stays grammatical when the name is a single word or blank", () => {
    expect(
      buildWhatsAppMessage({
        fullName: "   ",
        businessName: "עסק",
        phone: "0501234567",
      })
    ).toContain("היי,");
  });
});

describe("buildWhatsAppHref", () => {
  it("builds a wa.me link with the draft message encoded", () => {
    const href = buildWhatsAppHref({
      fullName: "דנה כהן",
      businessName: "מאפיית דנה",
      phone: "050-123-4567",
    });

    expect(href).not.toBeNull();
    expect(href).toContain("https://wa.me/972501234567?text=");
    expect(href).not.toContain(" ");
  });

  it("returns null rather than a link to the wrong person", () => {
    expect(
      buildWhatsAppHref({
        fullName: "דנה כהן",
        businessName: "מאפיית דנה",
        phone: "לא נמסר",
      })
    ).toBeNull();
  });
});

describe("buildTelHref", () => {
  it("dials the international form when the number can be read", () => {
    expect(buildTelHref("050-123-4567")).toBe("tel:+972501234567");
  });

  it("falls back to what the visitor typed", () => {
    expect(buildTelHref("12345")).toBe("tel:12345");
  });
});
