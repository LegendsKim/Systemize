import { describe, it, expect } from "vitest";
import {
  getDirection,
  getHtmlLang,
  defaultLocale,
  supportedLocales,
  timeZone,
  currency,
  formatLocale,
} from "../locale";
import { formatCurrency, formatNumber } from "../format";

describe("locale configuration", () => {
  it("ships Hebrew as the only supported locale", () => {
    expect(supportedLocales).toEqual(["he"]);
    expect(defaultLocale).toBe("he");
  });

  it("renders Hebrew right-to-left", () => {
    expect(getDirection("he")).toBe("rtl");
  });

  it("returns the locale string as the html lang attribute", () => {
    expect(getHtmlLang("he")).toBe("he");
  });

  it("pins the regional constants required by AGENTS.client.md", () => {
    expect(timeZone).toBe("Asia/Jerusalem");
    expect(currency).toBe("ILS");
    expect(formatLocale).toBe("he-IL");
  });
});

describe("formatCurrency", () => {
  it("formats whole shekels with the ILS symbol", () => {
    const formatted = formatCurrency(1234);
    expect(formatted).toContain("₪");
    expect(formatted).toContain("1,234");
  });

  it("rounds to whole shekels", () => {
    expect(formatCurrency(1234.49)).toContain("1,234");
    expect(formatCurrency(1234.5)).toContain("1,235");
  });

  it("formats zero rather than leaking NaN to a visitor", () => {
    expect(formatCurrency(Number.NaN)).toBe(formatCurrency(0));
    expect(formatCurrency(Number.POSITIVE_INFINITY)).toBe(formatCurrency(0));
  });

  it("is stable across calls, so server and client renders agree", () => {
    expect(formatCurrency(98765)).toBe(formatCurrency(98765));
  });
});

describe("formatNumber", () => {
  it("groups thousands", () => {
    expect(formatNumber(1234567)).toContain("1,234,567");
  });

  it("formats non-finite input as zero", () => {
    expect(formatNumber(Number.NaN)).toBe(formatNumber(0));
  });
});
