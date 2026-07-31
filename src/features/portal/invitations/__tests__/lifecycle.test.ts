import { describe, expect, it } from "vitest";
import {
  canReissueInvitation,
  canRevokeInvitation,
  getInvitationDisplayStatus,
} from "../lifecycle";

const now = new Date("2026-07-30T12:00:00.000Z");

describe("invitation lifecycle", () => {
  it("derives expiry without mutating the durable invitation status", () => {
    expect(
      getInvitationDisplayStatus(
        {
          status: "pending",
          expiresAt: "2026-07-30T11:59:59.000Z",
        },
        now
      )
    ).toBe("expired");
  });

  it("does not classify accepted or revoked invitations as expired", () => {
    expect(
      getInvitationDisplayStatus(
        {
          status: "accepted",
          expiresAt: "2026-07-01T00:00:00.000Z",
        },
        now
      )
    ).toBe("accepted");
    expect(
      getInvitationDisplayStatus(
        {
          status: "revoked",
          expiresAt: "2026-07-01T00:00:00.000Z",
        },
        now
      )
    ).toBe("revoked");
  });

  it("allows only a live pending invitation to be revoked", () => {
    expect(canRevokeInvitation("pending")).toBe(true);
    expect(canRevokeInvitation("expired")).toBe(false);
    expect(canRevokeInvitation("revoked")).toBe(false);
    expect(canRevokeInvitation("accepted")).toBe(false);
  });

  it("never reissues an invitation that was already accepted", () => {
    expect(canReissueInvitation("pending")).toBe(true);
    expect(canReissueInvitation("expired")).toBe(true);
    expect(canReissueInvitation("revoked")).toBe(true);
    expect(canReissueInvitation("accepted")).toBe(false);
  });
});
