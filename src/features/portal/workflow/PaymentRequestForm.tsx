"use client";
// This form needs accessible pending and validation feedback from a Server Action.

import { useActionState } from "react";
import {
  createPaymentRequest,
} from "./actions";
import { initialWorkflowActionState } from "./action-state";

export function PaymentRequestForm({
  projectId,
  idempotencyKey,
}: {
  readonly projectId: string;
  readonly idempotencyKey: string;
}) {
  const [state, action, pending] = useActionState(
    createPaymentRequest,
    initialWorkflowActionState
  );

  return (
    <form action={action} className="workflow-compact-form">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      <label>
        <span>סוג התשלום</span>
        <select name="kind" defaultValue="discovery">
          <option value="discovery">אפיון ותכנון מלא</option>
          <option value="initial_deposit">מקדמה להקמת המערכת</option>
          <option value="balance">יתרת פרויקט</option>
        </select>
      </label>
      <label>
        <span>כותרת</span>
        <input
          name="title"
          defaultValue="אפיון ותכנון מלא של המערכת"
          required
          maxLength={160}
        />
      </label>
      <label>
        <span>סכום בש״ח</span>
        <input
          name="amountIls"
          type="number"
          min="1"
          step="0.01"
          inputMode="decimal"
          required
          dir="ltr"
        />
      </label>
      <label>
        <span>קישור מאובטח לתשלום</span>
        <input
          name="paymentUrl"
          type="url"
          inputMode="url"
          placeholder="https://"
          required
          dir="ltr"
        />
      </label>
      {state.message && (
        <p className="workflow-form-message" role="alert">
          {state.message}
        </p>
      )}
      <button
        type="submit"
        className="portal-primary-action"
        disabled={pending}
      >
        {pending ? "מפרסם…" : "שליחת בקשת תשלום"}
      </button>
    </form>
  );
}
