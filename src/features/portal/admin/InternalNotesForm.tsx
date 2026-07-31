"use client";
// The owner needs pending feedback and inline errors while saving private notes.

import { useActionState } from "react";
import { initialAdminActionState } from "@/features/portal/admin/action-state";
import {
  internalNotesFields,
  projectReadinessHints,
  projectReadinessLabels,
  projectReadinessValues,
  type InternalNotesDefaults,
} from "@/features/portal/admin/internal-notes";
import { saveProjectInternalNotes } from "@/features/portal/admin/internal-notes-actions";

interface InternalNotesFormProps {
  readonly projectId: string;
  readonly defaults: InternalNotesDefaults;
}

export function InternalNotesForm({
  projectId,
  defaults,
}: InternalNotesFormProps) {
  const [state, action, pending] = useActionState(
    saveProjectInternalNotes,
    initialAdminActionState
  );

  return (
    <form action={action} className="admin-form">
      <input type="hidden" name="projectId" value={projectId} />

      <fieldset className="admin-field admin-readiness">
        <legend>רמת בשלות</legend>
        {projectReadinessValues.map((value) => (
          <label key={value} htmlFor={`readiness-${value}`}>
            <input
              type="radio"
              id={`readiness-${value}`}
              name="readiness"
              value={value}
              defaultChecked={defaults.readiness === value}
            />
            <span>
              <strong>{projectReadinessLabels[value]}</strong>
              <small>{projectReadinessHints[value]}</small>
            </span>
          </label>
        ))}
      </fieldset>

      {internalNotesFields.map((field) => (
        <div className="admin-field" key={field.name}>
          <label htmlFor={`notes-${field.name}`}>{field.label}</label>
          <textarea
            id={`notes-${field.name}`}
            name={field.name}
            defaultValue={defaults[field.name]}
            rows={field.rows}
            maxLength={field.maxLength}
            aria-invalid={Boolean(state.fieldErrors?.[field.name])}
            aria-describedby={`notes-${field.name}-help notes-${field.name}-error`}
          />
          <p id={`notes-${field.name}-help`} className="admin-field-help">
            {field.hint}
          </p>
          <p id={`notes-${field.name}-error`} className="portal-field-error">
            {state.fieldErrors?.[field.name]?.[0]}
          </p>
        </div>
      ))}

      {state.message && (
        <p
          className="admin-form-message"
          data-tone={state.status === "error" ? "attention" : undefined}
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.message}
        </p>
      )}

      <button
        type="submit"
        className="admin-button"
        disabled={pending}
        aria-busy={pending}
      >
        {pending ? "שומר…" : "שמירת ההערות"}
      </button>
    </form>
  );
}
