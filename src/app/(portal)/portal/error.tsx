"use client";
// This boundary provides recovery interaction for authenticated provider failures.

export default function PortalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main id="main-content" className="portal-main">
      <section className="portal-empty-state">
        <h1>לא הצלחנו לטעון את האזור האישי</h1>
        <p role="alert">המידע שלך לא השתנה. אפשר לנסות לטעון אותו מחדש.</p>
        <button type="button" className="portal-primary-action" onClick={reset}>
          ניסיון נוסף
        </button>
      </section>
    </main>
  );
}
