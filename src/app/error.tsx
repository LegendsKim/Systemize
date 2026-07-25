"use client";
// Required: route error boundaries must be Client Components

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main
      id="main-content"
      className="flex min-h-screen flex-col items-center justify-center px-(--spacing-page-x)"
    >
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold text-text-primary">משהו השתבש</h1>
        <p className="mt-3 text-text-secondary">
          אירעה שגיאה בלתי צפויה. אפשר לנסות שוב.
        </p>
        {error.digest && (
          <p className="mt-2 text-sm text-text-muted">
            מזהה שגיאה: {error.digest}
          </p>
        )}
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-text-on-primary hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          נסה שוב
        </button>
      </div>
    </main>
  );
}
