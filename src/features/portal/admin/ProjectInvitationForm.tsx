"use client";
// This form needs useActionState to preview the one-time share link safely, and it keeps
// the recipient's name and phone so the link can be handed straight to a chat with them.

import { useActionState, useState } from "react";
import { buildInvitationWhatsAppHref } from "@/features/portal/invitations/share-message";
import { initialAdminActionState } from "./action-state";
import { createProjectInvitation } from "./actions";

interface ProjectInvitationFormProps {
  readonly projectId: string;
  readonly projectName: string;
  readonly invitationId: string;
  readonly invitationToken: string;
  readonly idempotencyKey: string;
}

export function ProjectInvitationForm({
  projectId,
  projectName,
  invitationId,
  invitationToken,
  idempotencyKey,
}: ProjectInvitationFormProps) {
  const [state, action, pending] = useActionState(
    createProjectInvitation,
    initialAdminActionState
  );
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  const whatsAppHref = state.shareUrl
    ? buildInvitationWhatsAppHref({
        fullName,
        phone,
        projectName,
        shareUrl: state.shareUrl,
      })
    : null;

  return (
    <form action={action} className="portal-form">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="invitationId" value={invitationId} />
      <input type="hidden" name="invitationToken" value={invitationToken} />
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      <label>
        <span>שם מלא</span>
        <input
          name="fullName"
          autoComplete="name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          aria-invalid={Boolean(state.fieldErrors?.fullName)}
          aria-describedby="invite-name-error"
          required
        />
      </label>
      <p id="invite-name-error" className="portal-field-error">
        {state.fieldErrors?.fullName?.[0]}
      </p>
      <label>
        <span>כתובת Gmail</span>
        <input
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          dir="ltr"
          aria-invalid={Boolean(state.fieldErrors?.email)}
          aria-describedby="invite-email-error"
          required
        />
      </label>
      <p id="invite-email-error" className="portal-field-error">
        {state.fieldErrors?.email?.[0]}
      </p>
      <label>
        <span>מספר טלפון</span>
        <input
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          dir="ltr"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          aria-invalid={Boolean(state.fieldErrors?.phone)}
          aria-describedby="invite-phone-error"
          required
        />
      </label>
      <p id="invite-phone-error" className="portal-field-error">
        {state.fieldErrors?.phone?.[0]}
      </p>
      {state.message && (
        <p className="portal-form-message" role="status">
          {state.message}
        </p>
      )}
      {state.shareUrl && (
        <div className="portal-share-link">
          <label htmlFor="generated-invitation-link">קישור לשליחה</label>
          <input
            id="generated-invitation-link"
            readOnly
            dir="ltr"
            value={state.shareUrl}
            onFocus={(event) => event.currentTarget.select()}
          />

          {whatsAppHref ? (
            <>
              <a
                href={whatsAppHref}
                target="_blank"
                rel="noopener noreferrer"
                className="portal-primary-action"
              >
                פתיחת צ׳אט עם הלקוח והדבקת ההזמנה
              </a>
              <p className="admin-field-help">
                נפתחת שיחת WhatsApp עם המספר שהוזן, עם הקישור וטקסט שמסביר מה
                קורה בכניסה. הקישור מוצג בשיחה עם תמונת ההזמנה של SYSTEMIZE.
              </p>
            </>
          ) : (
            <p className="admin-field-help">
              לא ניתן לפתוח שיחה אוטומטית עם המספר שהוזן. אפשר להעתיק את הקישור
              ולשלוח אותו ידנית.
            </p>
          )}
        </div>
      )}
      <button
        type="submit"
        className="portal-primary-action"
        disabled={pending || Boolean(state.shareUrl)}
        aria-busy={pending}
      >
        {pending ? "יוצר הזמנה…" : "יצירת הזמנה חד־פעמית"}
      </button>
    </form>
  );
}
