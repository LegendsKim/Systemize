import { normalizeGmailAddress } from "@/features/portal/invitations/email";
import type { PortalAppRole } from "@/lib/supabase/types";

/**
 * A returning login may bypass the one-time invitation only when all durable account
 * facts still agree with the verified Google identity.
 */
export function canResumeClientSession(input: {
  readonly profileEmail: string;
  readonly appRole: PortalAppRole;
  readonly hasActiveMembership: boolean;
  readonly verifiedEmail: string;
}): boolean {
  return (
    input.appRole === "client" &&
    input.hasActiveMembership &&
    normalizeGmailAddress(input.profileEmail) ===
      normalizeGmailAddress(input.verifiedEmail)
  );
}
