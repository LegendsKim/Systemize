import { describe, expect, it } from "vitest";
import {
  gmailAddressSchema,
  isAllowedGmailAddress,
  normalizeGmailAddress,
} from "../email";

describe("Gmail invitation addresses", () => {
  it("normalizes an allowed Gmail address", () => {
    expect(normalizeGmailAddress("  Owner.Name+portal@GMAIL.COM ")).toBe(
      "owner.name+portal@gmail.com"
    );
  });

  it.each([
    "owner@company.co.il",
    "owner@googlemail.com",
    "owner@gmail.com.example",
    "@gmail.com",
    "owner @gmail.com",
  ])("rejects %s", (email) => {
    expect(gmailAddressSchema.safeParse(email).success).toBe(false);
  });

  it("exposes a safe boolean guard", () => {
    expect(isAllowedGmailAddress("owner@gmail.com")).toBe(true);
    expect(isAllowedGmailAddress(null)).toBe(false);
  });
});
