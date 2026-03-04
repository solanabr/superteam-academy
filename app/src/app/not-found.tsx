import Link from "next/link";

export default function RootNotFound() {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-background text-foreground antialiased">
        <div className="w-full max-w-md rounded-xl border border-border/50 bg-card p-10 text-center space-y-6">
          <p className="text-7xl font-bold" aria-hidden="true">
            404
          </p>

          <div className="space-y-2">
            <h1 className="text-xl font-semibold">Page not found</h1>
            <p className="text-sm text-muted-foreground">
              The page you&apos;re looking for doesn&apos;t exist or has been moved.
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/en"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-8 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Go to homepage
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
