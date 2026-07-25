"use client";
// Required: error boundaries must be Client Components to catch render errors

/**
 * Self-contained by design: this boundary replaces the root layout, so it may not
 * depend on app providers, the theme stylesheet, or the loaded webfont.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="he" dir="rtl">
      <body
        style={{
          fontFamily:
            'Heebo, Arial, ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f5f6f7",
          color: "#1a1a1a",
          padding: "1rem",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: "28rem" }}>
          <h1
            style={{ fontSize: "1.5rem", fontWeight: 700, marginBlockEnd: "1rem" }}
          >
            משהו השתבש
          </h1>
          <p
            style={{
              fontSize: "1rem",
              color: "#666",
              marginBlockEnd: "1.5rem",
            }}
          >
            אירעה שגיאה בלתי צפויה. אפשר לנסות שוב.
          </p>
          {error.digest && (
            <p
              style={{
                fontSize: "0.875rem",
                color: "#999",
                marginBlockEnd: "1rem",
              }}
            >
              מזהה שגיאה: {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={reset}
            style={{
              padding: "0.625rem 1.25rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "#fff",
              backgroundColor: "#12a3a0",
              border: "none",
              borderRadius: "0.5rem",
              cursor: "pointer",
            }}
          >
            נסה שוב
          </button>
        </div>
      </body>
    </html>
  );
}
