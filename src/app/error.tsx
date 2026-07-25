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
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-(--spacing-page-x)">
      <div className="text-center" style={{ maxWidth: "28rem" }}>
        <h1 className="text-2xl font-bold text-text-primary">
          Something went wrong
        </h1>
        <p className="mt-3 text-text-secondary">
          An unexpected error occurred. Please try again.
        </p>
        {error.digest && (
          <p className="mt-2 text-sm text-text-muted">
            Error ID: {error.digest}
          </p>
        )}
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-text-on-primary hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
