"use client";
// The owner edits repeatable phases, options and support plans with inline AI import.

import { useActionState, useState } from "react";
import { initialAdminActionState } from "@/features/portal/admin/action-state";
import { saveSystemPlanDraft } from "./actions";
import {
  buildSystemPlanPrompt,
  parseSystemPlanAutofill,
} from "./system-plan-autofill";
import type { SystemPlanEditorValues } from "./system-plan";

interface SystemPlanFormProps {
  readonly projectId: string;
  readonly documentId: string;
  readonly versionId: string;
  readonly idempotencyKey: string;
  readonly companyName: string;
  readonly projectName: string;
  readonly discoveryContext: string;
  readonly defaults: SystemPlanEditorValues;
}

/**
 * What the client reads. Nine fields, in the order they appear in the document.
 *
 * The editor used to ask for sixteen, five of which answered an engineer's questions rather
 * than the buyer's, and two of which ("מה לא כלול" and "עלויות צד שלישי") were the same
 * idea asked twice — which is how a document ends up long, repetitive, and padded with
 * whatever fills the box.
 */
const narrativeFields = [
  ["executiveSummary", "תקציר מנהלים", "מה בונים, למה עכשיו ומה הערך המרכזי ללקוח."],
  ["successMetrics", "מדדי הצלחה", "כיצד נמדוד אימוץ, חיסכון בזמן, דיוק או צמיחה."],
  ["solutionOverview", "הפתרון המוצע", "תמונת המערכת מקצה לקצה בשפה שהלקוח מבין."],
  ["modulesAndWorkflows", "מודולים ותהליכי עבודה", "כל מודול, האחריות שלו, הזרימה והחריגים החשובים."],
  ["paymentTerms", "תנאי תשלום", "אבני תשלום, מקדמה ותנאים להתחלת כל שלב."],
  ["exclusions", "מה אינו כלול", "גבולות ברורים, כולל רישיונות, ענן, סליקה וספקי צד שלישי."],
  ["clientResponsibilities", "אחריות הלקוח", "חומרים, החלטות, זמינות בעלי תפקידים ואישורי ספקים."],
  ["assumptionsAndRisks", "הנחות, סיכונים והחלטות פתוחות", "מה עשוי להשפיע על המחיר או לוח הזמנים."],
  ["warranty", "אחריות לאחר מסירה", "מה נחשב תקלה, מה נחשב שינוי ומה משך האחריות."],
] as const;

/** The technical appendix. Optional, and printed on its own page only when it has content. */
const appendixFields = [
  ["usersAndPermissions", "משתמשים והרשאות", "תפקידים, פעולות מותרות, אישורים והפרדת מידע."],
  ["integrationsAndData", "נתונים ואינטגרציות", "מקורות מידע, מערכות חיצוניות, יבוא, יצוא וסנכרון."],
  ["architectureAndSecurity", "ארכיטקטורה, אבטחה ופרטיות", "סביבות, הרשאות, גיבוי, ניטור, פרטיות וזמינות."],
  ["uxAccessibilityAndDevices", "חוויית שימוש, נגישות ומכשירים", "מובייל, דפדפנים, RTL, נגישות והתראות."],
  ["migrationAndRollout", "הסבה, הדרכה ועלייה לאוויר", "העברת מידע, פיילוט, הדרכה, השקה ותוכנית חזרה."],
] as const;

type NarrativeKey = (typeof narrativeFields)[number][0];
type AppendixKey = (typeof appendixFields)[number][0];

export function SystemPlanForm({
  projectId,
  documentId,
  versionId,
  idempotencyKey,
  companyName,
  projectName,
  discoveryContext,
  defaults,
}: SystemPlanFormProps) {
  const [state, action, pending] = useActionState(
    saveSystemPlanDraft,
    initialAdminActionState
  );
  const [values, setValues] = useState<SystemPlanEditorValues>(defaults);
  const [autofillPayload, setAutofillPayload] = useState("");
  const [message, setMessage] = useState<{
    readonly tone: "success" | "error";
    readonly text: string;
  } | null>(null);
  const prompt = buildSystemPlanPrompt({
    companyName,
    projectName,
    discoveryContext,
  });

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(prompt);
      setMessage({ tone: "success", text: "ה־Prompt הועתק. אפשר להדביק אותו ב־ChatGPT." });
    } catch {
      setMessage({ tone: "error", text: "ההעתקה נחסמה. אפשר להעתיק ידנית מהשדה." });
    }
  }

  function autofill() {
    try {
      setValues(parseSystemPlanAutofill(autofillPayload));
      setMessage({
        tone: "success",
        text: "המסמך מולא כטיוטה. יש לבדוק כל התחייבות, מחיר ולוח זמנים לפני שמירה.",
      });
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof Error ? error.message : "לא ניתן לפענח את הפלט.",
      });
    }
  }

  function updateNarrative(key: NarrativeKey, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  // An emptied appendix box means "this document has nothing to say here", which the schema
  // records as an absent field rather than as a stored blank string.
  function updateAppendix(key: AppendixKey, value: string) {
    setValues((current) => ({ ...current, [key]: value.trim() ? value : undefined }));
  }

  return (
    <form action={action} className="admin-form system-plan-editor">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="documentId" value={documentId} />
      <input type="hidden" name="versionId" value={versionId} />
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      <input type="hidden" name="contentPayload" value={JSON.stringify(values)} />

      <details className="document-autofill-shell" open>
        <summary>Auto Fill with AI</summary>
        <div className="document-autofill-content">
          <p className="admin-field-help">
            ה־Prompt כולל את הקשר האפיון ומנהל ראיון השלמה לפני יצירת JSON. המילוי אינו
            שומר ואינו מפרסם דבר באופן אוטומטי.
          </p>
          <label htmlFor="system-plan-prompt">Prompt מוכן</label>
          <textarea id="system-plan-prompt" value={prompt} rows={9} readOnly />
          <button type="button" className="admin-button" data-variant="secondary" onClick={copyPrompt}>
            העתקת ה־Prompt
          </button>
          <label htmlFor="system-plan-autofill">פלט JSON מ־ChatGPT</label>
          <textarea
            id="system-plan-autofill"
            value={autofillPayload}
            onChange={(event) => setAutofillPayload(event.target.value)}
            rows={9}
            dir="ltr"
            spellCheck={false}
            placeholder='{"schemaVersion":"systemize.system-plan.autofill.v1", ...}'
          />
          <button type="button" className="admin-button" onClick={autofill}>
            מילוי הטיוטה
          </button>
          {message && (
            <p
              className="admin-form-message"
              data-tone={message.tone === "error" ? "attention" : undefined}
              role={message.tone === "error" ? "alert" : "status"}
            >
              {message.text}
            </p>
          )}
        </div>
      </details>

      <div className="admin-field">
        <label htmlFor="system-plan-title">כותרת המסמך</label>
        <input
          id="system-plan-title"
          value={values.title}
          onChange={(event) => setValues((current) => ({ ...current, title: event.target.value }))}
          maxLength={180}
          required
        />
      </div>

      <div className="system-plan-editor-grid">
        {narrativeFields.map(([key, label, hint]) => (
          <div className="admin-field" key={key}>
            <label htmlFor={`system-plan-${key}`}>{label}</label>
            <textarea
              id={`system-plan-${key}`}
              value={values[key]}
              onChange={(event) => updateNarrative(key, event.target.value)}
              rows={key === "modulesAndWorkflows" ? 8 : 5}
              maxLength={key === "modulesAndWorkflows" ? 8_000 : 5_000}
              required
            />
            <p className="admin-field-help">{hint}</p>
          </div>
        ))}
      </div>

      <details className="system-plan-appendix-editor">
        <summary>נספח טכני — לא חובה</summary>
        <p className="admin-field-help">
          הפירוט ההנדסי. מודפס בעמוד נפרד בסוף המסמך, ורק אם מולא. שדה ריק פשוט
          לא יופיע.
        </p>
        <div className="system-plan-editor-grid">
          {appendixFields.map(([key, label, hint]) => (
            <div className="admin-field" key={key}>
              <label htmlFor={`system-plan-${key}`}>{label}</label>
              <textarea
                id={`system-plan-${key}`}
                value={values[key] ?? ""}
                onChange={(event) => updateAppendix(key, event.target.value)}
                rows={4}
                maxLength={5_000}
              />
              <p className="admin-field-help">{hint}</p>
            </div>
          ))}
        </div>
      </details>

      <fieldset className="system-plan-repeatable">
        <legend>שלבי ביצוע</legend>
        <p className="admin-field-help">
          כיצד מתקדמת העבודה על החלופה המומלצת. לשלב אין מחיר נפרד — המחיר היחיד
          במסמך הוא מחיר החלופה.
        </p>
        {values.phases.map((phase, index) => (
          <div className="system-plan-repeatable-card" key={`phase-${index}`}>
            <div className="system-plan-repeatable-head">
              <strong>שלב {index + 1}</strong>
              {values.phases.length > 2 && (
                <button
                  type="button"
                  className="admin-button"
                  data-variant="ghost"
                  onClick={() =>
                    setValues((current) => ({
                      ...current,
                      phases: current.phases.filter((_, itemIndex) => itemIndex !== index),
                    }))
                  }
                >
                  הסרת שלב
                </button>
              )}
            </div>
            <input
              aria-label={`שם שלב ${index + 1}`}
              value={phase.name}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  phases: current.phases.map((item, itemIndex) =>
                    itemIndex === index ? { ...item, name: event.target.value } : item
                  ),
                }))
              }
              placeholder="שם השלב"
              required
            />
            {(["outcome", "deliverables"] as const).map((field) => (
              <textarea
                key={field}
                aria-label={`${field === "outcome" ? "תוצאה" : "תוצרים"} של שלב ${index + 1}`}
                value={phase[field]}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    phases: current.phases.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, [field]: event.target.value } : item
                    ),
                  }))
                }
                placeholder={field === "outcome" ? "התוצאה בסיום השלב" : "התוצרים שיימסרו"}
                rows={3}
                required
              />
            ))}
            <input
              aria-label={`משך שלב ${index + 1}`}
              value={phase.timeline}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  phases: current.phases.map((item, itemIndex) =>
                    itemIndex === index ? { ...item, timeline: event.target.value } : item
                  ),
                }))
              }
              placeholder="משך משוער"
              required
            />
          </div>
        ))}
        {values.phases.length < 8 && (
          <button
            type="button"
            className="admin-button"
            data-variant="secondary"
            onClick={() =>
              setValues((current) => ({
                ...current,
                phases: [...current.phases, { name: "", outcome: "", deliverables: "", timeline: "" }],
              }))
            }
          >
            הוספת שלב
          </button>
        )}
      </fieldset>

      <fieldset className="system-plan-repeatable">
        <legend>חלופות פיתוח</legend>
        <p className="admin-field-help">החלופות צריכות להבדיל בהיקף, זמן, סיכון ומחיר — לא רק בשם.</p>
        {values.developmentOptions.map((option, index) => (
          <div className="system-plan-repeatable-card" key={`option-${index}`}>
            <div className="system-plan-repeatable-head">
              <label>
                <input
                  type="radio"
                  name="recommended-option"
                  checked={option.recommended}
                  onChange={() =>
                    setValues((current) => ({
                      ...current,
                      developmentOptions: current.developmentOptions.map((item, itemIndex) => ({
                        ...item,
                        recommended: itemIndex === index,
                      })),
                    }))
                  }
                />
                חלופה מומלצת
              </label>
              {values.developmentOptions.length > 2 && (
                <button
                  type="button"
                  className="admin-button"
                  data-variant="ghost"
                  onClick={() =>
                    setValues((current) => {
                      const remaining = current.developmentOptions.filter((_, itemIndex) => itemIndex !== index);
                      return {
                        ...current,
                        developmentOptions: remaining.some((item) => item.recommended)
                          ? remaining
                          : remaining.map((item, itemIndex) => ({ ...item, recommended: itemIndex === 0 })),
                      };
                    })
                  }
                >
                  הסרת חלופה
                </button>
              )}
            </div>
            {(["name", "bestFor", "scope", "timeline", "priceIls"] as const).map((field) =>
              field === "scope" ? (
                <textarea
                  key={field}
                  aria-label={`היקף חלופה ${index + 1}`}
                  value={option[field]}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      developmentOptions: current.developmentOptions.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, [field]: event.target.value } : item
                      ),
                    }))
                  }
                  rows={4}
                  placeholder="מה כלול ומה נדחה"
                  required
                />
              ) : (
                <input
                  key={field}
                  aria-label={`${field} בחלופה ${index + 1}`}
                  type={field === "priceIls" ? "number" : "text"}
                  min={field === "priceIls" ? "1" : undefined}
                  step={field === "priceIls" ? "0.01" : undefined}
                  value={option[field]}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      developmentOptions: current.developmentOptions.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, [field]: event.target.value } : item
                      ),
                    }))
                  }
                  placeholder={{ name: "שם החלופה", bestFor: "למי היא מתאימה", timeline: "משך משוער", priceIls: "מחיר בשקלים" }[field]}
                  required
                />
              )
            )}
          </div>
        ))}
        {values.developmentOptions.length < 4 && (
          <button
            type="button"
            className="admin-button"
            data-variant="secondary"
            onClick={() =>
              setValues((current) => ({
                ...current,
                developmentOptions: [...current.developmentOptions, { name: "", bestFor: "", scope: "", timeline: "", priceIls: "", recommended: false }],
              }))
            }
          >
            הוספת חלופה
          </button>
        )}
      </fieldset>

      <fieldset className="system-plan-repeatable">
        <legend>תחזוקה ותמיכה חודשית</legend>
        {values.supportPlans.map((plan, index) => (
          <div className="system-plan-repeatable-card" key={`support-${index}`}>
            <div className="system-plan-repeatable-head">
              <strong>מסלול {index + 1}</strong>
              {values.supportPlans.length > 1 && (
                <button
                  type="button"
                  className="admin-button"
                  data-variant="ghost"
                  onClick={() => setValues((current) => ({ ...current, supportPlans: current.supportPlans.filter((_, itemIndex) => itemIndex !== index) }))}
                >
                  הסרת מסלול
                </button>
              )}
            </div>
            <input
              aria-label={`שם מסלול תמיכה ${index + 1}`}
              value={plan.name}
              onChange={(event) => setValues((current) => ({ ...current, supportPlans: current.supportPlans.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item) }))}
              placeholder="שם המסלול"
              required
            />
            <textarea
              aria-label={`כיסוי מסלול תמיכה ${index + 1}`}
              value={plan.coverage}
              onChange={(event) => setValues((current) => ({ ...current, supportPlans: current.supportPlans.map((item, itemIndex) => itemIndex === index ? { ...item, coverage: event.target.value } : item) }))}
              rows={4}
              placeholder="עדכונים, בדיקות, תיקונים, ניטור והיקף שעות"
              required
            />
            <div className="system-plan-money-row">
              <input
                aria-label={`זמן תגובה במסלול ${index + 1}`}
                value={plan.responseTime}
                onChange={(event) => setValues((current) => ({ ...current, supportPlans: current.supportPlans.map((item, itemIndex) => itemIndex === index ? { ...item, responseTime: event.target.value } : item) }))}
                placeholder="זמן תגובה"
                required
              />
              <input
                aria-label={`מחיר חודשי במסלול ${index + 1}`}
                type="number"
                min="1"
                step="0.01"
                value={plan.monthlyPriceIls}
                onChange={(event) => setValues((current) => ({ ...current, supportPlans: current.supportPlans.map((item, itemIndex) => itemIndex === index ? { ...item, monthlyPriceIls: event.target.value } : item) }))}
                placeholder="מחיר חודשי בשקלים"
                required
              />
            </div>
          </div>
        ))}
        {values.supportPlans.length < 4 && (
          <button type="button" className="admin-button" data-variant="secondary" onClick={() => setValues((current) => ({ ...current, supportPlans: [...current.supportPlans, { name: "", coverage: "", responseTime: "", monthlyPriceIls: "" }] }))}>
            הוספת מסלול תמיכה
          </button>
        )}
      </fieldset>

      <fieldset className="system-plan-repeatable">
        <legend>תמחור שינויים עתידיים</legend>
        <div className="system-plan-price-grid">
          {([
            ["smallFeatureFromIls", "פיצ'ר קטן, החל מ־"],
            ["largeFeatureFromIls", "פיצ'ר גדול, החל מ־"],
            ["hourlyRateIls", "תעריף שעתי"],
          ] as const).map(([field, label]) => (
            <label key={field}>
              {label}
              <input
                type="number"
                min="1"
                step="0.01"
                value={values[field]}
                onChange={(event) => setValues((current) => ({ ...current, [field]: event.target.value }))}
                required
              />
            </label>
          ))}
        </div>
        <label htmlFor="system-plan-change-notes">מדיניות תמחור שינויים</label>
        <textarea
          id="system-plan-change-notes"
          value={values.changePricingNotes}
          onChange={(event) => setValues((current) => ({ ...current, changePricingNotes: event.target.value }))}
          rows={4}
          required
        />
      </fieldset>

      <div className="admin-field">
        <label htmlFor="system-plan-validity">תוקף ההצעה, ימים</label>
        <input
          id="system-plan-validity"
          type="number"
          min="1"
          max="90"
          value={values.validityDays}
          onChange={(event) => setValues((current) => ({ ...current, validityDays: Number(event.target.value) }))}
          required
        />
      </div>

      {state.message && (
        <p className="admin-form-message" data-tone={state.status === "error" ? "attention" : undefined} role={state.status === "error" ? "alert" : "status"}>
          {state.message}
        </p>
      )}
      <button type="submit" className="admin-button" disabled={pending} aria-busy={pending}>
        {pending ? "שומר גרסה…" : "שמירת טיוטה כגרסה חדשה"}
      </button>
    </form>
  );
}
