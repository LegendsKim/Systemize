import { describe, expect, it } from "vitest";
import {
  createInvitationTokenPair,
  hashInvitationToken,
  isInvitationToken,
} from "../tokens";

describe("project invitation tokens", () => {
  it("creates a 256-bit URL-safe token and stores only its hash", () => {
    const pair = createInvitationTokenPair();

    expect(pair.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(pair.tokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(pair.tokenHash).not.toContain(pair.token);
    expect(hashInvitationToken(pair.token)).toBe(pair.tokenHash);
  });

  it("creates independent invitation secrets", () => {
    expect(createInvitationTokenPair().token).not.toBe(
      createInvitationTokenPair().token
    );
  });

  it.each(["", "short", "a".repeat(44), "a".repeat(42) + "!"])(
    "rejects malformed token %s",
    (token) => {
      expect(isInvitationToken(token)).toBe(false);
      expect(() => hashInvitationToken(token)).toThrow(
        "Invalid invitation token"
      );
    }
  );
});
