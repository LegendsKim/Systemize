"use client";
// This form needs useActionState for accessible pending and validation feedback.

import { useActionState } from "react";
import { initialAdminActionState } from "./action-state";
import { createCompanyProject } from "./actions";

export function CompanyProjectForm({
  idempotencyKey,
}: {
  idempotencyKey: string;
}) {
  const [state, action, pending] = useActionState(
    createCompanyProject,
    initialAdminActionState
  );

  return (
    <form action={action} className="portal-form">
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      <label>
        <span>שם החברה</span>
        <input
          name="companyName"
          autoComplete="organization"
          aria-invalid={Boolean(state.fieldErrors?.companyName)}
          aria-describedby="company-name-error"
          required
        />
      </label>
      <p id="company-name-error" className="portal-field-error">
        {state.fieldErrors?.companyName?.[0]}
      </p>
      <label>
        <span>שם הפרויקט</span>
        <input
          name="projectName"
          aria-invalid={Boolean(state.fieldErrors?.projectName)}
          aria-describedby="project-name-error"
          required
        />
      </label>
      <p id="project-name-error" className="portal-field-error">
        {state.fieldErrors?.projectName?.[0]}
      </p>
      {state.message && (
        <p className="portal-form-message" role="status">
          {state.message}
        </p>
      )}
      <button
        type="submit"
        className="portal-primary-action"
        disabled={pending}
        aria-busy={pending}
      >
        {pending ? "יוצר פרויקט…" : "יצירת חברה ופרויקט"}
      </button>
    </form>
  );
}
