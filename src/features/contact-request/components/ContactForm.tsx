"use client";
// Required: form state, effects, and event handlers for interactive form

import { useState, useRef, useTransition, useCallback } from "react";
import { Button, Field, Input, Textarea, StatusMessage } from "@/components/ui";
import { contactRequestSchema } from "../schemas";
import type { ContactRequestResult } from "../types";
import { submitContactRequest } from "../actions";

function useIdempotencyKey() {
  const keyRef = useRef<string>("");

  const getKey = useCallback(() => {
    if (!keyRef.current) {
      keyRef.current = crypto.randomUUID();
    }
    return keyRef.current;
  }, []);

  const refreshKey = useCallback(() => {
    keyRef.current = crypto.randomUUID();
  }, []);

  return { getKey, refreshKey };
}

export function ContactForm() {
  const { getKey, refreshKey } = useIdempotencyKey();
  const [result, setResult] = useState<ContactRequestResult | null>(null);
  const [clientErrors, setClientErrors] = useState<Record<string, string[]>>(
    {}
  );
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setClientErrors({});
    setResult(null);

    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries());

    // Client-side validation
    const validation = contactRequestSchema.safeParse(data);
    if (!validation.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of validation.error.issues) {
        const field = issue.path[0];
        if (typeof field === "string") {
          if (!fieldErrors[field]) fieldErrors[field] = [];
          fieldErrors[field].push(issue.message);
        }
      }
      setClientErrors(fieldErrors);
      return;
    }

    startTransition(async () => {
      const response = await submitContactRequest(getKey(), formData);
      setResult(response);

      if (response.status === "success") {
        formRef.current?.reset();
        refreshKey();
      } else if (response.status === "duplicate") {
        refreshKey();
      }
    });
  }

  const nameError = clientErrors["name"]?.[0] ??
    (result?.status === "validation_error" ? result.errors["name"]?.[0] : undefined);
  const emailError = clientErrors["email"]?.[0] ??
    (result?.status === "validation_error" ? result.errors["email"]?.[0] : undefined);
  const messageError = clientErrors["message"]?.[0] ??
    (result?.status === "validation_error" ? result.errors["message"]?.[0] : undefined);

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="flex flex-col gap-6"
      noValidate
    >
      {/* Status messages */}
      {result?.status === "success" && (
        <StatusMessage variant="success">
          Your message has been sent successfully. We&apos;ll get back to you
          soon.
        </StatusMessage>
      )}

      {result?.status === "duplicate" && (
        <StatusMessage variant="info">
          This message was already received. No duplicate was created.
        </StatusMessage>
      )}

      {result?.status === "rate_limited" && (
        <StatusMessage variant="warning">
          Too many requests. Please wait a moment and try again.
        </StatusMessage>
      )}

      {result?.status === "error" && (
        <StatusMessage variant="error">{result.message}</StatusMessage>
      )}

      {/* Form fields */}
      <Field id="name" label="Name" error={nameError} required>
        <Input
          id="name"
          name="name"
          autoComplete="name"
          disabled={isPending}
          required
          error={!!nameError}
          errorId="name-error"
        />
      </Field>

      <Field id="email" label="Email" error={emailError} required>
        <Input
          id="email"
          type="email"
          name="email"
          autoComplete="email"
          disabled={isPending}
          required
          error={!!emailError}
          errorId="email-error"
        />
      </Field>

      <Field id="message" label="Message" error={messageError} required>
        <Textarea
          id="message"
          name="message"
          disabled={isPending}
          required
          rows={5}
          error={!!messageError}
          errorId="message-error"
        />
      </Field>

      <Button
        type="submit"
        disabled={isPending}
        loading={isPending}
      >
        Send message
      </Button>
    </form>
  );
}
