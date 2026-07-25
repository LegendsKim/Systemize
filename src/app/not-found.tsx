import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-(--spacing-page-x)">
      <div className="text-center" style={{ maxWidth: "28rem" }}>
        <p className="text-6xl font-bold text-text-muted">404</p>
        <h1 className="mt-4 text-2xl font-bold text-text-primary">
          Page not found
        </h1>
        <p className="mt-3 text-text-secondary">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-text-on-primary hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
