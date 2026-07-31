"use client";
// This guided document needs local step navigation and accessible Server Action feedback.

import { useActionState, useState } from "react";
import type { IntakeStatus } from "@/lib/supabase/types";
import {
  saveClientIntake,
} from "./actions";
import { initialWorkflowActionState } from "./action-state";
import {
  intakeSections,
  type IntakeAnswers,
} from "./intake";

interface DiscoveryIntakeFormProps {
  readonly projectId: string;
  readonly projectName: string;
  readonly initialAnswers: IntakeAnswers;
  readonly initialStep: number;
  readonly status: IntakeStatus;
  readonly reviewNote: string | null;
  readonly idempotencyKey: string;
}

export function DiscoveryIntakeForm({
  projectId,
  projectName,
  initialAnswers,
  initialStep,
  status,
  reviewNote,
  idempotencyKey,
}: DiscoveryIntakeFormProps) {
  const [state, action, pending] = useActionState(
    saveClientIntake,
    initialWorkflowActionState
  );
  const [step, setStep] = useState(Math.min(Math.max(initialStep, 1), 5));
  const locked = status === "submitted" || status === "approved";

  const section = intakeSections[step - 1];
  if (!section) {
    return null;
  }

  return (
    <form action={action} className="intake-document">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="currentStep" value={step} />
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />

      <header className="intake-document-header">
        <div>
          <p className="portal-eyebrow">מסמך היכרות חסוי</p>
          <h1>אפיון ראשוני · {projectName}</h1>
          <p>
            המסמך נועד להכין אותנו לפגישה ממוקדת. אפשר לשמור טיוטה ולחזור
            בכל שלב.
          </p>
        </div>
        <div className="intake-confidentiality">
          <span aria-hidden="true">↗</span>
          <div>
            <strong>פרטי בינך לבין SYSTEMIZE</strong>
            <p>המידע אינו משותף עם לקוחות אחרים או גורם חיצוני.</p>
          </div>
        </div>
      </header>

      {reviewNote && status === "changes_requested" && (
        <aside className="workflow-notice workflow-notice-attention">
          <strong>הערה מ־SYSTEMIZE</strong>
          <p>{reviewNote}</p>
        </aside>
      )}

      <ol className="intake-stepper" aria-label="שלבי המסמך">
        {intakeSections.map((item, index) => {
          const itemStep = index + 1;
          return (
            <li
              key={item.title}
              data-state={
                itemStep < step
                  ? "complete"
                  : itemStep === step
                    ? "current"
                    : "upcoming"
              }
            >
              <button
                type="button"
                onClick={() => setStep(itemStep)}
                aria-current={itemStep === step ? "step" : undefined}
              >
                <span>{itemStep < step ? "✓" : itemStep}</span>
                <strong>{item.title}</strong>
              </button>
            </li>
          );
        })}
      </ol>

      <section className="intake-section" aria-labelledby={`intake-step-${step}`}>
        <div className="intake-section-heading">
          <p className="portal-eyebrow">{section.eyebrow}</p>
          <h2 id={`intake-step-${step}`}>{section.title}</h2>
          <p>{section.description}</p>
        </div>

        <div className="intake-fields">
          {intakeSections.flatMap((item, sectionIndex) =>
            item.fields.map((field) => (
              <label
                key={field.name}
                className="intake-field"
                hidden={sectionIndex !== step - 1}
              >
                <span>
                  {field.label}
                  {field.required && <em> נדרש</em>}
                </span>
                <small>{field.hint}</small>
                <textarea
                  name={field.name}
                  rows={field.rows}
                  defaultValue={initialAnswers[field.name]}
                  disabled={locked}
                  aria-invalid={Boolean(state.fieldErrors?.[field.name])}
                  aria-describedby={`${field.name}-error`}
                  maxLength={5000}
                />
                <b id={`${field.name}-error`} className="portal-field-error">
                  {state.fieldErrors?.[field.name]?.[0]}
                </b>
              </label>
            ))
          )}
        </div>
      </section>

      {state.message && (
        <p className="workflow-form-message" role="alert">
          {state.message}
        </p>
      )}

      <footer className="intake-actions">
        <div>
          {step > 1 && (
            <button
              type="button"
              className="portal-secondary-button"
              onClick={() => setStep((value) => value - 1)}
            >
              הקודם
            </button>
          )}
          {step < intakeSections.length && (
            <button
              type="button"
              className="portal-primary-action"
              onClick={() => setStep((value) => value + 1)}
            >
              לשלב הבא
            </button>
          )}
        </div>

        {!locked && (
          <div>
            <button
              type="submit"
              name="intent"
              value="save"
              className="portal-secondary-button"
              disabled={pending}
            >
              {pending ? "שומר…" : "שמירת טיוטה"}
            </button>
            {step === intakeSections.length && (
              <button
                type="submit"
                name="intent"
                value="submit"
                className="portal-primary-action"
                disabled={pending}
              >
                שליחה לבדיקה
              </button>
            )}
          </div>
        )}
      </footer>
    </form>
  );
}
