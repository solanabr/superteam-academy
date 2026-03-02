import Link from "next/link";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
        <span className="text-4xl font-bold text-primary">404</span>
      </div>
      <h1 className="mt-6 font-heading text-3xl font-bold">Page not found</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/"
          className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Go Home
        </Link>
        <Link
          href="/courses"
          className="rounded-xl border border-border px-6 py-3 text-sm font-semibold transition-colors hover:bg-muted"
        >
          Browse Courses
        </Link>
      </div>
    </div>
  );
}
