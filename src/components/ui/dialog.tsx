"use client";
// Required: Dialog uses state, effects, and keyboard events for focus management

import React, { useEffect, useRef, useCallback, useId } from "react";

interface DialogProps {
  /** Whether the dialog is open. */
  open: boolean;
  /** Called when the dialog should close. */
  onClose: () => void;
  /** Dialog title for the heading and aria-labelledby. */
  title: string;
  /** Dialog content. */
  children: React.ReactNode;
  /** Optional description for aria-describedby. */
  description?: string;
  /** Additional presentation class for a feature-specific dialog. */
  className?: string;
}

/**
 * Accessible modal dialog.
 *
 * Uses the native <dialog> element for built-in focus trapping,
 * Escape key handling, and background interaction blocking.
 * Focus is restored to the trigger element on close.
 */
export function Dialog({
  open,
  onClose,
  title,
  children,
  description,
  className = "",
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const handleClose = useCallback(() => {
    onClose();
    // Restore focus to the element that triggered the dialog
    previousFocusRef.current?.focus();
    previousFocusRef.current = null;
  }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      // Save the currently focused element before opening
      previousFocusRef.current = document.activeElement as HTMLElement;
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    // Handle native dialog close (Escape key)
    const onDialogClose = () => {
      handleClose();
    };

    // Handle backdrop click
    const onBackdropClick = (e: MouseEvent) => {
      if (e.target === dialog) {
        handleClose();
      }
    };

    dialog.addEventListener("close", onDialogClose);
    dialog.addEventListener("click", onBackdropClick);

    return () => {
      dialog.removeEventListener("close", onDialogClose);
      dialog.removeEventListener("click", onBackdropClick);
    };
  }, [handleClose]);

  const generatedId = useId();
  const titleId = `${generatedId}-title`;
  const descId = description ? `${generatedId}-description` : undefined;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descId}
      className={[
        "m-auto w-full max-w-lg rounded-xl border border-border bg-surface-0 p-0 shadow-lg backdrop:bg-black/50",
        className,
      ].join(" ")}
    >
      <div className="p-6">
        <button
          type="button"
          className="dialog-close"
          aria-label="סגירת החלונית"
          onClick={() => dialogRef.current?.close()}
        >
          <span aria-hidden="true">×</span>
        </button>
        <h2
          id={titleId}
          className="text-lg font-semibold text-text-primary"
        >
          {title}
        </h2>
        {description && (
          <p id={descId} className="mt-1 text-sm text-text-secondary">
            {description}
          </p>
        )}
        <div className="mt-4">{children}</div>
      </div>
    </dialog>
  );
}
