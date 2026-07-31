import { describe, expect, it } from "vitest";
import { canResumeClientSession } from "../returning-client";

describe("returning client access", () => {
  const valid = {
    profileEmail: "client@gmail.com",
    appRole: "client" as const,
    hasActiveMembership: true,
    verifiedEmail: "client@gmail.com",
  };

  it("allows an existing client with a matching Google address and active project", () => {
    expect(canResumeClientSession(valid)).toBe(true);
  });

  it("does not treat an owner as a returning client", () => {
    expect(
      canResumeClientSession({ ...valid, appRole: "systemize_owner" })
    ).toBe(false);
  });

  it("rejects an identity mismatch", () => {
    expect(
      canResumeClientSession({
        ...valid,
        verifiedEmail: "someone-else@gmail.com",
      })
    ).toBe(false);
  });

  it("requires at least one active project membership", () => {
    expect(
      canResumeClientSession({ ...valid, hasActiveMembership: false })
    ).toBe(false);
  });
});
