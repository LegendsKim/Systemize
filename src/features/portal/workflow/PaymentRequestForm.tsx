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
          aria-invalid={Boolean(state.fieldErrors?.title)}
          aria-describedby="payment-title-error"
        />
        <span id="payment-title-error" className="portal-field-error">
          {state.fieldErrors?.title?.[0]}
        </span>
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
          aria-invalid={Boolean(state.fieldErrors?.amountIls)}
          aria-describedby="payment-amount-error"
        />
        <span id="payment-amount-error" className="portal-field-error">
          {state.fieldErrors?.amountIls?.[0]}
        </span>
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
          pattern="https://.*"
          aria-invalid={Boolean(state.fieldErrors?.paymentUrl)}
          aria-describedby="payment-url-help payment-url-error"
        />
        <span id="payment-url-help" className="admin-field-help">
          יש להזין קישור ציבורי לעמוד תשלום, לא קובץ PDF או כתובת file:// מהמחשב.
        </span>
        <span id="payment-url-error" className="portal-field-error">
          {state.fieldErrors?.paymentUrl?.[0]}
        </span>
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
