"use client";
// Required: submission state, per-field error state, and offline detection on submit.

import { useCallback, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Button, Field, Input, StatusMessage, Textarea } from "@/components/ui";
import { leadFieldOrder, leadForm, leadStates, type LeadFieldName } from "../lead-content";
import { parseLeadFormData, toFieldErrors, type LeadFieldErrors } from "../lead-schemas";
import type { LeadResult } from "../lead-types";
import { submitLead } from "../actions";

/**
 * The site's single conversion surface.
 *
 * The smallest coherent interactive subtree: the section around it, its heading and
 * its copy are all server-rendered, and only the form itself is a client component.
 *
 * The same schema runs here and in the Server Action. This copy exists to save a
 * round trip and to put the error next to the field immediately, it is never the
 * authority, and a visitor who defeats it gets the identical message from the server.
 */

/** A transport outcome the Server Action never got to report on. */
type TransportFailure = "offline" | "error";

function fieldId(name: LeadFieldName): string {
  return `lead-${name}`;
}

/**
 * One idempotency key per form session, generated in the browser and enforced by a
 * unique constraint in the database. A retry of the same submission carries the same
 * key; a genuinely new submission gets a fresh one.
 */
function useIdempotencyKey() {
  const keyRef = useRef<string>("");

  const currentKey = useCallback(() => {
    if (!keyRef.current) {
      keyRef.current = crypto.randomUUID();
    }
    return keyRef.current;
  }, []);

  const rotateKey = useCallback(() => {
    keyRef.current = "";
  }, []);

  return { currentKey, rotateKey };
}

export function LeadForm() {
  const { currentKey, rotateKey } = useIdempotencyKey();
  const formRef = useRef<HTMLFormElement>(null);
  const [result, setResult] = useState<LeadResult | null>(null);
  const [fieldErrors, setFieldErrors] = useState<LeadFieldErrors>({});
  const [transportFailure, setTransportFailure] = useState<TransportFailure | null>(null);
  const [isPending, startTransition] = useTransition();

  /** An announced error is only actionable if the visitor can reach the field. */
  const focusFirstInvalid = useCallback((errors: LeadFieldErrors) => {
    const first = leadFieldOrder.find((name) => errors[name]?.length);
    if (first) {
      document.getElementById(fieldId(first))?.focus();
    }
  }, []);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);
    setTransportFailure(null);

    const formData = new FormData(event.currentTarget);

    const parsed = parseLeadFormData(formData);
    if (!parsed.success) {
      const errors = toFieldErrors(parsed.error);
      setFieldErrors(errors);
      focusFirstInvalid(errors);
      return;
    }
    setFieldErrors({});

    // Read at submit time, never during render: the initial server and client render
    // must not depend on browser state (AGENTS.md §3).
    if (navigator.onLine === false) {
      setTransportFailure("offline");
      return;
    }

    startTransition(async () => {
      try {
        const response = await submitLead(currentKey(), formData);
        setResult(response);

        if (response.status === "validation_error") {
          setFieldErrors(response.errors);
          focusFirstInvalid(response.errors);
          return;
        }
        if (response.status === "success") {
          formRef.current?.reset();
          rotateKey();
          return;
        }
        if (response.status === "duplicate") {
          rotateKey();
        }
      } catch {
        // The action never reached the server, or its response was lost. The key is
        // deliberately kept so a retry reconciles to the same row.
        setTransportFailure(navigator.onLine === false ? "offline" : "error");
      }
    });
  }

  const status = resolveStatus(result, transportFailure);

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      noValidate
      aria-label={leadForm.label}
      className="lead-form"
    >
      {status && (
        <StatusMessage variant={status.variant}>
          <strong className="lead-status-title">{status.title}</strong>
          <span>{status.body}</span>
        </StatusMessage>
      )}

      <div className="lead-form-grid">
        <div className="lead-command">
          <span className="lead-command-label" aria-hidden="true">
            01 SET_CONTACT_NAME()
          </span>
          <Field
            id={fieldId("full_name")}
            label={leadForm.fields.full_name.label}
            error={fieldErrors.full_name?.[0]}
            required
          >
            <Input
              id={fieldId("full_name")}
              name="full_name"
              type="text"
              autoComplete={leadForm.fields.full_name.autoComplete}
              placeholder={leadForm.fields.full_name.placeholder}
              maxLength={200}
              disabled={isPending}
              error={Boolean(fieldErrors.full_name?.length)}
              errorId={`${fieldId("full_name")}-error`}
            />
          </Field>
        </div>

        <div className="lead-command">
          <span className="lead-command-label" aria-hidden="true">
            02 SET_BUSINESS_CONTEXT()
          </span>
          <Field
            id={fieldId("business_name")}
            label={leadForm.fields.business_name.label}
            error={fieldErrors.business_name?.[0]}
            required
          >
            <Input
              id={fieldId("business_name")}
              name="business_name"
              type="text"
              autoComplete={leadForm.fields.business_name.autoComplete}
              placeholder={leadForm.fields.business_name.placeholder}
              maxLength={200}
              disabled={isPending}
              error={Boolean(fieldErrors.business_name?.length)}
              errorId={`${fieldId("business_name")}-error`}
            />
          </Field>
        </div>

        <div className="lead-command">
          <span className="lead-command-label" aria-hidden="true">
            03 SET_PHONE_NUM()
          </span>
          <Field
            id={fieldId("phone")}
            label={leadForm.fields.phone.label}
            hint={leadForm.fields.phone.hint}
            error={fieldErrors.phone?.[0]}
            required
          >
            <Input
              id={fieldId("phone")}
              name="phone"
              type="tel"
              inputMode="tel"
              dir="ltr"
              autoComplete={leadForm.fields.phone.autoComplete}
              placeholder={leadForm.fields.phone.placeholder}
              maxLength={32}
              disabled={isPending}
              error={Boolean(fieldErrors.phone?.length)}
              errorId={`${fieldId("phone")}-error`}
              hintId={`${fieldId("phone")}-hint`}
            />
          </Field>
        </div>

        <div className="lead-command">
          <span className="lead-command-label" aria-hidden="true">
            04 FETCH_CONTACT_EMAIL()
          </span>
          <Field
            id={fieldId("email")}
            label={leadForm.fields.email.label}
            error={fieldErrors.email?.[0]}
            required
          >
            <Input
              id={fieldId("email")}
              name="email"
              type="email"
              inputMode="email"
              dir="ltr"
              autoComplete={leadForm.fields.email.autoComplete}
              placeholder={leadForm.fields.email.placeholder}
              maxLength={320}
              disabled={isPending}
              error={Boolean(fieldErrors.email?.length)}
              errorId={`${fieldId("email")}-error`}
            />
          </Field>
        </div>
      </div>

      <div className="lead-command lead-command--wide">
        <span className="lead-command-label" aria-hidden="true">
          05 DESCRIBE_PROCESS()
        </span>
        <Field
          id={fieldId("message")}
          label={leadForm.fields.message.label}
          hint={leadForm.fields.message.hint}
          error={fieldErrors.message?.[0]}
          required
        >
          <Textarea
            id={fieldId("message")}
            name="message"
            rows={5}
            maxLength={5000}
            placeholder={leadForm.fields.message.placeholder}
            disabled={isPending}
            error={Boolean(fieldErrors.message?.length)}
            errorId={`${fieldId("message")}-error`}
            hintId={`${fieldId("message")}-hint`}
          />
        </Field>
      </div>

      <div className="lead-form-actions">
        <Button
          type="submit"
          size="lg"
          disabled={isPending}
          aria-busy={isPending}
          className="lead-submit"
        >
          {isPending ? leadForm.submit.pending : leadForm.submit.idle}
        </Button>
        <p className="lead-privacy-note">
          {leadForm.privacyNote}{" "}
          <Link href="/privacy">למדיניות הפרטיות</Link>
        </p>
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------- */

interface ResolvedStatus {
  variant: "success" | "error" | "warning" | "info";
  title: string;
  body: string;
}

/**
 * Offline and rate-limited read as their own states, because the recovery action
 * differs: reconnect, wait, or nothing the visitor can do (docs/PRODUCT.md §4, J1).
 * A transport failure takes precedence, it is the more recent fact.
 */
function resolveStatus(
  result: LeadResult | null,
  transportFailure: TransportFailure | null
): ResolvedStatus | null {
  if (transportFailure === "offline") {
    return { variant: "warning", ...leadStates.offline };
  }
  if (transportFailure === "error") {
    return { variant: "error", ...leadStates.error };
  }
  if (!result) return null;

  switch (result.status) {
    case "success":
      return { variant: "success", ...leadStates.success };
    case "duplicate":
      return { variant: "info", ...leadStates.duplicate };
    case "rate_limited":
      return { variant: "warning", ...leadStates.rateLimited };
    case "error":
      return { variant: "error", ...leadStates.error };
    case "validation_error":
      return {
        variant: "error",
        title: leadStates.validationSummary,
        body: "",
      };
  }
}
