"use client";
// The owner needs inline validation and pending feedback while saving a new version.

import { useActionState } from "react";
import {
  initialAdminActionState,
} from "@/features/portal/admin/action-state";
import { saveIntroductorySummaryDraft } from "./actions";

interface IntroductorySummaryFormProps {
  readonly projectId: string;
  readonly documentId: string;
  readonly versionId: string;
  readonly idempotencyKey: string;
  readonly defaults: {
    readonly title: string;
    readonly currentSituation: string;
    readonly operationalFriction: string;
    readonly desiredOutcomes: string;
    readonly scopeAndAssumptions: string;
    readonly openQuestions: string;
    readonly discoveryIncludes: string;
    readonly deliverables: string;
    readonly estimatedTimeline: string;
    readonly priceIls: string;
    readonly paymentTerms: string;
    readonly exclusions: string;
    readonly validityDays: number;
  };
}

const narrativeFields = [
  {
    name: "currentSituation",
    label: "המצב הקיים כפי שתואר",
    hint: "איך העבודה מתנהלת היום, באילו כלים ומי מעורב.",
  },
  {
    name: "operationalFriction",
    label: "בעיות וחיכוך תפעולי",
    hint: "כפילויות, טעויות, המתנות, חוסר שקיפות ועבודה ידנית.",
  },
  {
    name: "desiredOutcomes",
    label: "תוצאות עסקיות רצויות",
    hint: "מה צריך להשתפר בפועל ואיך נדע שהפרויקט הצליח.",
  },
  {
    name: "scopeAndAssumptions",
    label: "היקף ידוע והנחות",
    hint: "מה כבר ברור ומה עדיין מבוסס על הנחה.",
  },
  {
    name: "openQuestions",
    label: "שאלות ועובדות שדורשות אימות",
    hint: "החלטות, נתונים או מגבלות שנבדוק באפיון.",
  },
  {
    name: "discoveryIncludes",
    label: "מה כולל שלב האפיון והתכנון",
    hint: "הפעולות ש־SYSTEMIZE תבצע בשלב בתשלום.",
  },
  {
    name: "deliverables",
    label: "התוצרים שהלקוח יקבל",
    hint: "מסמכים, החלטות, חלופות ותכנית עבודה.",
  },
  {
    name: "estimatedTimeline",
    label: "לוח זמנים משוער",
    hint: "משך משוער ותלויות מרכזיות.",
  },
  {
    name: "paymentTerms",
    label: "תנאי תשלום",
    hint: "מועד, אבני דרך ותנאים מסחריים.",
  },
  {
    name: "exclusions",
    label: "מה לא כלול",
    hint: "גבולות ברורים שמונעים פרשנות שונה.",
  },
] as const;

export function IntroductorySummaryForm({
  projectId,
  documentId,
  versionId,
  idempotencyKey,
  defaults,
}: IntroductorySummaryFormProps) {
  const [state, action, pending] = useActionState(
    saveIntroductorySummaryDraft,
    initialAdminActionState
  );

  return (
    <form action={action} className="admin-form document-editor">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="documentId" value={documentId} />
      <input type="hidden" name="versionId" value={versionId} />
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />

      {/*
        The commercial boundary, stated where the writing happens. The summary's job is
        to prove the client was understood and to define what the paid stage delivers —
        not to hand over the plan that stage is being paid to produce. Candid judgement
        about budget, readiness and risk belongs in the internal notes panel instead.
      */}
      <p className="admin-field-help document-editor-boundary">
        המסמך הזה מוכיח שהבנו את הלקוח ומגדיר מה כולל שלב האפיון בתשלום. הוא
        אינו כולל את הפתרון עצמו, ארכיטקטורה או תכנית יישום — אלה התוצרים
        שהלקוח משלם עבורם. התרשמות, תקציב וסיכונים נרשמים בהערות הפנימיות.
      </p>

      <div className="admin-field">
        <label htmlFor="document-title">כותרת המסמך</label>
        <input
          id="document-title"
          name="title"
          defaultValue={defaults.title}
          maxLength={160}
          required
          aria-invalid={Boolean(state.fieldErrors?.title)}
          aria-describedby="document-title-error"
        />
        <p id="document-title-error" className="portal-field-error">
          {state.fieldErrors?.title?.[0]}
        </p>
      </div>

      {narrativeFields.map((field) => (
        <div className="admin-field" key={field.name}>
          <label htmlFor={`document-${field.name}`}>{field.label}</label>
          <textarea
            id={`document-${field.name}`}
            name={field.name}
            defaultValue={defaults[field.name]}
            rows={5}
            maxLength={field.name === "estimatedTimeline" || field.name === "paymentTerms" ? 1_000 : 4_000}
            required
            aria-invalid={Boolean(state.fieldErrors?.[field.name])}
            aria-describedby={`document-${field.name}-help document-${field.name}-error`}
          />
          <p id={`document-${field.name}-help`} className="admin-field-help">
            {field.hint}
          </p>
          <p
            id={`document-${field.name}-error`}
            className="portal-field-error"
          >
            {state.fieldErrors?.[field.name]?.[0]}
          </p>
        </div>
      ))}

      <div className="document-editor-commercial">
        <div className="admin-field">
          <label htmlFor="document-price">מחיר האפיון והתכנון, ₪</label>
          <input
            id="document-price"
            name="priceIls"
            type="number"
            inputMode="decimal"
            min="1"
            max="1000000"
            step="0.01"
            defaultValue={defaults.priceIls}
            required
            aria-invalid={Boolean(state.fieldErrors?.priceIls)}
            aria-describedby="document-price-error"
          />
          <p id="document-price-error" className="portal-field-error">
            {state.fieldErrors?.priceIls?.[0]}
          </p>
        </div>
        <div className="admin-field">
          <label htmlFor="document-validity">תוקף ההצעה, ימים</label>
          <input
            id="document-validity"
            name="validityDays"
            type="number"
            min="1"
            max="90"
            step="1"
            defaultValue={defaults.validityDays}
            required
            aria-invalid={Boolean(state.fieldErrors?.validityDays)}
            aria-describedby="document-validity-error"
          />
          <p id="document-validity-error" className="portal-field-error">
            {state.fieldErrors?.validityDays?.[0]}
          </p>
        </div>
      </div>

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
        {pending ? "שומר גרסה…" : "שמירת טיוטה כגרסה חדשה"}
      </button>
    </form>
  );
}
