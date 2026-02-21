"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body className="flex min-h-screen items-center justify-center bg-background font-sans">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Something went wrong</h2>
          <p className="mt-2 text-muted-foreground">
            An unexpected error occurred. The team has been notified.
          </p>
          <button
            onClick={reset}
            className="mt-4 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
