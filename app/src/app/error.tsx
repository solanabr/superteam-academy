"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
    console.error("Root error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="mb-4 text-2xl font-bold text-[var(--c-text)]">
          Something went wrong
        </h1>
        <p className="mb-6 text-[var(--c-text-2)]">
          An unexpected error occurred. Please try again or return to the home
          page.
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={reset}
            className="rounded-[2px] border border-[var(--solana-green)] bg-transparent px-6 py-2.5 text-sm font-medium text-[var(--solana-green)] transition-colors hover:bg-[var(--solana-green)] hover:text-black"
          >
            Try again
          </button>
          <a
            href="/"
            className="rounded-[2px] border border-[var(--c-border)] bg-transparent px-6 py-2.5 text-sm font-medium text-[var(--c-text-2)] transition-colors hover:border-[var(--c-border-hovered)] hover:text-[var(--c-text)]"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}
