import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "הדף לא נמצא",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main
      id="main-content"
      className="flex min-h-screen flex-col items-center justify-center px-(--spacing-page-x)"
    >
      <div className="max-w-md text-center">
        <p className="text-6xl font-bold text-text-muted">404</p>
        <h1 className="mt-4 text-2xl font-bold text-text-primary">
          הדף לא נמצא
        </h1>
        <p className="mt-3 text-text-secondary">
          הדף שחיפשת אינו קיים, או שהועבר לכתובת אחרת.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-text-on-primary hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          חזרה לדף הבית
        </Link>
      </div>
    </main>
  );
}
