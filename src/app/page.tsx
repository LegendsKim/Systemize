import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Systemize Boilerplate",
  description: "Systemize boilerplate home page.",
};

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-(--spacing-page-x)">
      <h1 className="text-4xl font-bold text-text-primary">Systemize</h1>
      <p className="mt-4 text-lg text-text-secondary">
        Production-grade Next.js boilerplate.
      </p>
    </div>
  );
}
