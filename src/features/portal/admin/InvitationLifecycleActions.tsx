"use client";
// This leaf uses action state to reveal a replacement invitation link exactly once.

import { useActionState } from "react";
import { initialAdminActionState } from "./action-state";
import {
  reissueProjectInvitation,
  revokeProjectInvitation,
} from "./actions";

interface InvitationLifecycleActionsProps {
  readonly projectId: string;
  readonly invitationId: string;
  readonly replacementInvitationId: string;
  readonly invitationToken: string;
  readonly revokeIdempotencyKey: string;
  readonly reissueIdempotencyKey: string;
  readonly allowRevoke: boolean;
  readonly allowReissue: boolean;
}

export function InvitationLifecycleActions({
  projectId,
  invitationId,
  replacementInvitationId,
  invitationToken,
  revokeIdempotencyKey,
  reissueIdempotencyKey,
  allowRevoke,
  allowReissue,
}: InvitationLifecycleActionsProps) {
  const [reissueState, reissueAction, reissuePending] = useActionState(
    reissueProjectInvitation,
    initialAdminActionState
  );

  return (
    <div className="admin-invitation-actions">
      {allowReissue && (
        <form action={reissueAction}>
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="invitationId" value={invitationId} />
          <input
            type="hidden"
            name="replacementInvitationId"
            value={replacementInvitationId}
          />
          <input
            type="hidden"
            name="invitationToken"
            value={invitationToken}
          />
          <input
            type="hidden"
            name="idempotencyKey"
            value={reissueIdempotencyKey}
          />
          <button
            type="submit"
            className="admin-button"
            data-variant="secondary"
            disabled={reissuePending || Boolean(reissueState.shareUrl)}
            aria-busy={reissuePending}
          >
            {reissuePending ? "מפיק הזמנה…" : "הפקת קישור חדש"}
          </button>
        </form>
      )}

      {allowRevoke && (
        <form action={revokeProjectInvitation}>
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="invitationId" value={invitationId} />
          <input
            type="hidden"
            name="idempotencyKey"
            value={revokeIdempotencyKey}
          />
          <button
            type="submit"
            className="admin-button"
            data-variant="danger"
          >
            ביטול ההזמנה
          </button>
        </form>
      )}

      {reissueState.message && (
        <p className="admin-form-message" role="status">
          {reissueState.message}
        </p>
      )}
      {reissueState.shareUrl && (
        <div className="portal-share-link">
          <label htmlFor={`replacement-invitation-${invitationId}`}>
            קישור חלופי לשליחה
          </label>
          <input
            id={`replacement-invitation-${invitationId}`}
            readOnly
            dir="ltr"
            value={reissueState.shareUrl}
            onFocus={(event) => event.currentTarget.select()}
          />
        </div>
      )}
    </div>
  );
}
