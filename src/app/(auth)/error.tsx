"use client";
// This boundary needs reset interaction for failures in the external auth flow.

export default function AuthErrorBoundary({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main id="main-content" className="auth-gate">
      <div className="auth-gate-field" aria-hidden="true" />
      <section className="auth-gate-shell auth-gate-shell-single">
        <div className="auth-gate-action">
          <h1>הכניסה אינה זמינה כרגע</h1>
          <p className="auth-gate-lede" role="alert">
            אירעה שגיאה זמנית. לא נשמרו פרטי הזדהות.
          </p>
          <button
            type="button"
            className="auth-google-button auth-gate-form"
            onClick={reset}
          >
            ניסיון נוסף
          </button>
        </div>
      </section>
    </main>
  );
}
