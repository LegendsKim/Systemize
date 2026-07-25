import React from "react";

interface FieldProps {
  /** Unique ID for the input element. Required for label association. */
  id: string;
  /** Visible label text. */
  label: string;
  /** Error message. When present, the field is marked as invalid. */
  error?: string;
  /** Hint text displayed below the input. */
  hint?: string;
  /** Whether the field is required. */
  required?: boolean;
  /** The input element(s) to render inside the field. */
  children: React.ReactNode;
}

/**
 * Accessible form field wrapper.
 *
 * Associates a label with input, displays error and hint text,
 * and manages aria-describedby and aria-invalid attributes.
 */
export function Field({
  id,
  label,
  error,
  hint,
  required = false,
  children,
}: FieldProps) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-text-primary">
        {label}
        {required && (
          <span className="ms-1 text-error" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {hint && !error && (
        <p id={hintId} className="text-xs text-text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs text-error">
          {error}
        </p>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Error state — marks input as aria-invalid. */
  error?: boolean;
  /** ID of the error description element for aria-describedby. */
  errorId?: string;
  /** ID of the hint description element for aria-describedby. */
  hintId?: string;
}

/**
 * Accessible text input.
 *
 * Uses native <input> element with proper aria attributes.
 */
export function Input({
  error = false,
  errorId,
  hintId,
  className = "",
  ...props
}: InputProps) {
  const describedBy = [error && errorId, hintId].filter(Boolean).join(" ");

  return (
    <input
      aria-invalid={error || undefined}
      aria-describedby={describedBy || undefined}
      className={[
        "rounded-md border px-3 py-2 text-sm text-text-primary",
        "bg-surface-0 placeholder:text-text-muted",
        "focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary",
        "disabled:cursor-not-allowed disabled:opacity-50",
        error
          ? "border-error focus-visible:outline-error"
          : "border-border hover:border-border-strong",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}

/* -------------------------------------------------------------------------- */

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
  errorId?: string;
  hintId?: string;
}

/**
 * Accessible textarea.
 */
export function Textarea({
  error = false,
  errorId,
  hintId,
  className = "",
  ...props
}: TextareaProps) {
  const describedBy = [error && errorId, hintId].filter(Boolean).join(" ");

  return (
    <textarea
      aria-invalid={error || undefined}
      aria-describedby={describedBy || undefined}
      className={[
        "rounded-md border px-3 py-2 text-sm text-text-primary",
        "bg-surface-0 placeholder:text-text-muted",
        "focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary",
        "disabled:cursor-not-allowed disabled:opacity-50 resize-y",
        error
          ? "border-error focus-visible:outline-error"
          : "border-border hover:border-border-strong",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
