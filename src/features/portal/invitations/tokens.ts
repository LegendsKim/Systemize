import "server-only";
import { createHash, randomBytes } from "node:crypto";

const invitationTokenPattern = /^[A-Za-z0-9_-]{43}$/;

export interface InvitationTokenPair {
  readonly token: string;
  readonly tokenHash: string;
}

export function createInvitationTokenPair(): InvitationTokenPair {
  const token = randomBytes(32).toString("base64url");
  return {
    token,
    tokenHash: hashInvitationToken(token),
  };
}

export function isInvitationToken(value: string): boolean {
  return invitationTokenPattern.test(value);
}

export function hashInvitationToken(token: string): string {
  if (!isInvitationToken(token)) {
    throw new Error("Invalid invitation token");
  }

  return createHash("sha256").update(token, "utf8").digest("hex");
}
