import type { ProjectInvitationStatus } from "@/lib/supabase/types";

export type InvitationDisplayStatus =
  | ProjectInvitationStatus
  | "expired";

interface InvitationStatusInput {
  readonly status: ProjectInvitationStatus;
  readonly expiresAt: string;
}

export function getInvitationDisplayStatus(
  invitation: InvitationStatusInput,
  now: Date
): InvitationDisplayStatus {
  if (
    invitation.status === "pending" &&
    Date.parse(invitation.expiresAt) <= now.getTime()
  ) {
    return "expired";
  }

  return invitation.status;
}

export const invitationStatusLabels: Record<
  InvitationDisplayStatus,
  string
> = {
  pending: "פעילה",
  accepted: "מומשה",
  revoked: "בוטלה",
  expired: "פגה",
};

export function canReissueInvitation(
  status: InvitationDisplayStatus
): boolean {
  return status !== "accepted";
}

export function canRevokeInvitation(
  status: InvitationDisplayStatus
): boolean {
  return status === "pending";
}
