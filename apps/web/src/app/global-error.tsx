"use client";

import "@/styles/globals.css";
import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

/**
 * Root-level error boundary. Unlike `error.tsx`, this catches errors thrown by
 * the root layout itself, so it must render its own `<html>`/`<body>`. Reports
 * the error to Sentry (no-op when `NEXT_PUBLIC_SENTRY_DSN` is unset).
 *
 * Inline translations: this renders outside the `[locale]` layout, so next-intl
 * is unavailable (same constraint as `error.tsx` / `not-found.tsx`).
 */
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
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <h1 className="text-6xl font-black">Oops!</h1>
        <p className="mt-4 text-xl font-semibold">Something Went Wrong</p>
        <p className="mt-2 max-w-md">An unexpected error occurred.</p>
        <button
          onClick={reset}
          className="mt-8 inline-flex items-center rounded-lg px-6 py-3 text-sm font-medium underline"
        >
          Try Again
        </button>
      </body>
    </html>
  );
}
