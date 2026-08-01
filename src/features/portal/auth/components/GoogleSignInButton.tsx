"use client";
// Required: the submit button reads the parent form's pending state to stay honest about
// the redirect to Google, which is otherwise several silent seconds of nothing.

import { useFormStatus } from "react-dom";
import { GoogleGlyph } from "@/components/brand/GoogleGlyph";

interface GoogleSignInButtonProps {
  /** The label in the resting state. The pending label is fixed. */
  readonly label: string;
}

/**
 * The single action on the entrance screen.
 *
 * `useFormStatus` is the whole reason this is a client component. Submitting starts a
 * Server Action that ends in a redirect to Google's consent screen, and on a slow
 * connection that is two or three seconds during which the previous button gave no signal
 * at all. A visitor reads silence as breakage and clicks again. Disabling on pending also
 * removes the double-submit outright.
 */
export function GoogleSignInButton({ label }: GoogleSignInButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="auth-google-button"
      data-pending={pending ? "true" : undefined}
      disabled={pending}
    >
      <span className="auth-google-chip" aria-hidden="true">
        {pending ? (
          <span className="auth-spinner" />
        ) : (
          <GoogleGlyph className="auth-google-glyph" />
        )}
      </span>
      {pending ? "מעבירים אותך ל-Google…" : label}
    </button>
  );
}
