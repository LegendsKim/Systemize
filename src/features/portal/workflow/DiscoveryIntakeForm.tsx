"use client";
// This guided document needs local step navigation, live counters, draft autosave and
// accessible Server Action feedback.

import {
  useActionState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { IntakeStatus } from "@/lib/supabase/types";
import { autosaveClientIntake, saveClientIntake } from "./actions";
import { initialIntakeActionState } from "./action-state";
import { describeAnswerProgress } from "./answer-progress";
import {
  emptyIntakeAnswers,
  intakeFieldNames,
  intakeSections,
  type IntakeAnswers,
  type IntakeFieldName,
} from "./intake";
import {
  emptyLocalIntakeDraft,
  localDraftDiffers,
  localIntakeDraftSnapshot,
  purgeExpiredIntakeDrafts,
  subscribeToLocalIntakeDraft,
  writeLocalIntakeDraft,
} from "./intake-draft";
import {
  intakeMaximumAnswerLength,
  intakeReplyMaximumLength,
} from "./schemas";

interface DiscoveryIntakeFormProps {
  readonly projectId: string;
  readonly projectName: string;
  readonly initialAnswers: IntakeAnswers;
  readonly initialClientReply: string;
  readonly initialStep: number;
  readonly status: IntakeStatus;
  readonly reviewNote: string | null;
  /** When the server row was last written, so a stale local draft never wins. */
  readonly serverSavedAt: string | null;
  readonly idempotencyKey: string;
}

type AutosaveState = "idle" | "saving" | "saved" | "failed";

/** Quiet typing before the durable save runs, in milliseconds. */
const serverAutosaveDelay = 2_500;
const localAutosaveDelay = 400;
const autosaveTimeout = 8_000;

export function DiscoveryIntakeForm({
  projectId,
  projectName,
  initialAnswers,
  initialClientReply,
  initialStep,
  status,
  reviewNote,
  serverSavedAt,
  idempotencyKey,
}: DiscoveryIntakeFormProps) {
  const [state, action, pending] = useActionState(
    saveClientIntake,
    initialIntakeActionState
  );
  /*
   * Which step is on screen, and why.
   *
   * A navigation is remembered together with the action result it was made against. When
   * a submission comes back rejected, `state` is a new object, the remembered navigation
   * stops applying, and the form lands on the first step that actually has an error —
   * instead of leaving the client on step five reading "complete the marked fields" with
   * no marked field in sight.
   */
  const [navigation, setNavigation] = useState<{
    readonly step: number;
    readonly forState: unknown;
  } | null>(null);
  const [edits, setEdits] = useState<Partial<Record<IntakeFieldName, string>>>(
    {}
  );
  const [replyEdit, setReplyEdit] = useState<string | null>(null);
  const [autosave, setAutosave] = useState<AutosaveState>("idle");
  const [autosaveRevision, setAutosaveRevision] = useState(0);

  const locked = status === "submitted" || status === "approved";
  const revision = status === "changes_requested";

  /*
   * The device's own copy, read through an external store rather than an effect.
   *
   * The server snapshot is empty, so the first client render still matches the server's;
   * the stored draft only appears on the pass after hydration. Reading it this way also
   * means no state has to be synchronised into place after mount — the values below are
   * derived, and derived state cannot fall out of step with what it was derived from.
   */
  const storedDraft = useSyncExternalStore(
    subscribeToLocalIntakeDraft,
    () => localIntakeDraftSnapshot(projectId),
    emptyLocalIntakeDraft
  );

  const hasEdits = Object.keys(edits).length > 0 || replyEdit !== null;
  const serverSavedTime = serverSavedAt ? Date.parse(serverSavedAt) : 0;
  /*
   * A local draft is only worth offering when it was written after the last server write
   * and actually holds different text — otherwise it is the same document twice.
   */
  const restorable =
    !locked &&
    storedDraft !== null &&
    storedDraft.savedAt > serverSavedTime &&
    localDraftDiffers(storedDraft, initialAnswers, initialClientReply)
      ? storedDraft
      : null;

  const submitted = state.values;
  const answers = useMemo(() => {
    const resolved = emptyIntakeAnswers();
    for (const name of intakeFieldNames) {
      resolved[name] =
        edits[name] ??
        submitted?.answers[name] ??
        restorable?.answers[name] ??
        initialAnswers[name];
    }
    return resolved;
  }, [edits, initialAnswers, restorable, submitted]);

  const clientReply =
    replyEdit ??
    submitted?.clientReply ??
    restorable?.clientReply ??
    initialClientReply;

  const firstErrorStep = state.fieldErrors
    ? intakeSections.findIndex((section) =>
        section.fields.some((field) => state.fieldErrors?.[field.name])
      ) + 1
    : 0;
  const step =
    navigation && navigation.forState === state
      ? navigation.step
      : firstErrorStep > 0
        ? firstErrorStep
        : Math.min(Math.max(restorable?.step ?? initialStep, 1), 5);
  const goToStep = (value: number) =>
    setNavigation({ step: Math.min(Math.max(value, 1), 5), forState: state });

  // The latest values, readable from a listener that must not be re-bound per keystroke.
  const latest = useRef({ answers, clientReply, step });
  useEffect(() => {
    latest.current = { answers, clientReply, step };
  }, [answers, clientReply, step]);

  const lastPersisted = useRef({
    answers: initialAnswers,
    clientReply: initialClientReply,
  });
  const savingRef = useRef(false);
  const saveRequestedWhileBusy = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Bounded storage: old drafts for any project leave the device on arrival.
  useEffect(() => {
    purgeExpiredIntakeDrafts(Date.now());
  }, []);

  const persistToServer = useCallback(async () => {
    if (locked) return;
    if (savingRef.current) {
      saveRequestedWhileBusy.current = true;
      return;
    }

    const snapshot = latest.current;
    const unchanged =
      snapshot.clientReply === lastPersisted.current.clientReply &&
      intakeFieldNames.every(
        (name) => snapshot.answers[name] === lastPersisted.current.answers[name]
      );
    if (unchanged) return;

    savingRef.current = true;
    saveRequestedWhileBusy.current = false;
    if (mountedRef.current) setAutosave("saving");
    let saved = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    try {
      /*
       * An explicit ceiling, per §5. A timeout does not prove the write failed — the
       * draft upsert is last-write-wins, so the next autosave reconciles either way.
       */
      const result = await Promise.race([
        autosaveClientIntake({
          projectId,
          currentStep: snapshot.step,
          answers: snapshot.answers,
          clientReply: snapshot.clientReply,
        }),
        new Promise<never>((_, reject) => {
          timeoutId = setTimeout(
            () => reject(new Error("autosave_timeout")),
            autosaveTimeout
          );
        }),
      ]);

      if (result.status === "saved") {
        saved = true;
        lastPersisted.current = {
          answers: snapshot.answers,
          clientReply: snapshot.clientReply,
        };
        if (mountedRef.current) setAutosave("saved");
      } else if (mountedRef.current) {
        setAutosave("failed");
      }
    } catch {
      if (mountedRef.current) setAutosave("failed");
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      savingRef.current = false;
      const current = latest.current;
      const changedWhileSaving =
        current.clientReply !== lastPersisted.current.clientReply ||
        intakeFieldNames.some(
          (name) =>
            current.answers[name] !== lastPersisted.current.answers[name]
        );
      if (
        saved &&
        mountedRef.current &&
        (saveRequestedWhileBusy.current || changedWhileSaving)
      ) {
        saveRequestedWhileBusy.current = false;
        setAutosaveRevision((value) => value + 1);
      }
    }
  }, [locked, projectId]);

  // The device copy first: it costs nothing and it is what survives a closed tab.
  useEffect(() => {
    if (locked || !hasEdits) return;
    const timer = setTimeout(() => {
      writeLocalIntakeDraft(projectId, {
        answers,
        clientReply,
        step,
        savedAt: Date.now(),
      });
    }, localAutosaveDelay);
    return () => clearTimeout(timer);
  }, [answers, clientReply, hasEdits, locked, projectId, step]);

  // The durable copy, once the typing stops.
  useEffect(() => {
    if (locked || !hasEdits) return;
    // A completed in-flight save increments this revision when newer text is waiting.
    void autosaveRevision;
    const timer = setTimeout(() => {
      void persistToServer();
    }, serverAutosaveDelay);
    return () => clearTimeout(timer);
  }, [
    answers,
    autosaveRevision,
    clientReply,
    hasEdits,
    locked,
    persistToServer,
  ]);

  // Leaving the page is the moment the debounce would otherwise lose.
  useEffect(() => {
    if (locked) return;
    const flush = () => {
      if (document.visibilityState === "hidden") void persistToServer();
    };
    document.addEventListener("visibilitychange", flush);
    return () => document.removeEventListener("visibilitychange", flush);
  }, [locked, persistToServer]);

  const section = intakeSections[step - 1];
  if (!section) {
    return null;
  }

  const setAnswer = (name: IntakeFieldName, value: string) => {
    setAutosave("idle");
    setEdits((current) => ({ ...current, [name]: value }));
  };

  const autosaveLabel =
    autosave === "saving"
      ? "שומר…"
      : autosave === "saved"
        ? "נשמר אוטומטית"
        : autosave === "failed"
          ? "השמירה האוטומטית נכשלה. הטקסט נשמר במכשיר — אפשר ללחוץ על שמירת טיוטה."
          : "";

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
            המסמך נועד להכין אותנו לפגישה ממוקדת. כל מה שנכתב נשמר אוטומטית,
            גם אם סוגרים את החלון.
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

      {restorable && !hasEdits && (
        <p className="workflow-notice" role="status">
          שוחזרה הטיוטה האחרונה שנשמרה במכשיר הזה.
        </p>
      )}

      {reviewNote && revision && (
        <aside className="workflow-notice workflow-notice-attention intake-review">
          <strong>הערה מ־SYSTEMIZE</strong>
          <p>{reviewNote}</p>

          <label className="intake-reply" htmlFor="intake-client-reply">
            <span>התגובה שלך להערה</span>
            <small>
              אפשר לענות כאן ישירות. התגובה נשלחת אלינו יחד עם השאלון המעודכן.
            </small>
          </label>
          <textarea
            id="intake-client-reply"
            name="clientReply"
            rows={4}
            value={clientReply}
            maxLength={intakeReplyMaximumLength}
            onChange={(event) => {
              setAutosave("idle");
              setReplyEdit(event.target.value);
            }}
            aria-describedby="intake-client-reply-count"
          />
          <small id="intake-client-reply-count" className="intake-counter">
            {clientReply.length} מתוך {intakeReplyMaximumLength} תווים
          </small>

          <button
            type="submit"
            name="intent"
            value="submit"
            className="portal-primary-action"
            disabled={pending}
          >
            {pending ? "שולח…" : "שליחה מחודשת לבדיקה"}
          </button>
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
                onClick={() => goToStep(itemStep)}
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
            item.fields.map((field) => {
              const value = answers[field.name];
              const progress = describeAnswerProgress(
                value.length,
                field.required,
                intakeMaximumAnswerLength
              );
              const error = state.fieldErrors?.[field.name]?.[0];

              return (
                <label
                  key={field.name}
                  className="intake-field"
                  hidden={sectionIndex !== step - 1}
                >
                  <span>
                    {field.label}
                    {field.required && (
                      <>
                        <b className="intake-required" aria-hidden="true">
                          {" *"}
                        </b>
                        <span className="portal-visually-hidden">
                          {" "}
                          (שדה חובה)
                        </span>
                      </>
                    )}
                  </span>
                  <small>{field.hint}</small>
                  <textarea
                    name={field.name}
                    rows={field.rows}
                    value={value}
                    disabled={locked}
                    onChange={(event) =>
                      setAnswer(field.name, event.target.value)
                    }
                    aria-invalid={Boolean(error)}
                    aria-describedby={`${field.name}-count ${field.name}-error`}
                    maxLength={intakeMaximumAnswerLength}
                  />
                  <small
                    id={`${field.name}-count`}
                    className="intake-counter"
                    data-tone={progress.tone}
                  >
                    {progress.label}
                  </small>
                  <b id={`${field.name}-error`} className="portal-field-error">
                    {error}
                  </b>
                </label>
              );
            })
          )}
        </div>
      </section>

      {state.message && (
        <p className="workflow-form-message" role="alert">
          {state.message}
        </p>
      )}

      <p className="intake-autosave" role="status" aria-live="polite">
        {autosaveLabel}
      </p>

      <footer className="intake-actions">
        <div>
          {step > 1 && (
            <button
              type="button"
              className="portal-secondary-button"
              onClick={() => goToStep(step - 1)}
            >
              הקודם
            </button>
          )}
          {step < intakeSections.length && (
            <button
              type="button"
              className="portal-primary-action"
              onClick={() => goToStep(step + 1)}
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
            {/*
              A correction can be sent from wherever it was made. Requiring the client to
              walk back to the last step to re-submit was friction with no purpose.
            */}
            {(step === intakeSections.length || revision) && (
              <button
                type="submit"
                name="intent"
                value="submit"
                className="portal-primary-action"
                disabled={pending}
              >
                {revision ? "שליחה מחודשת לבדיקה" : "שליחה לבדיקה"}
              </button>
            )}
          </div>
        )}
      </footer>
    </form>
  );
}
