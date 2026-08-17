"use client";

import "@/styles/globals.css";
import { useEffect, useState } from "react";
import * as Sentry from "@sentry/nextjs";

/**
 * Root-level error boundary. Unlike `error.tsx`, this catches errors thrown by
 * the root layout itself, so it must render its own `<html>`/`<body>`. Reports
 * the error to Sentry (no-op when `NEXT_PUBLIC_SENTRY_DSN` is unset).
 *
 * Inline translations: this renders outside the `[locale]` layout, so next-intl
 * is unavailable (same constraint as `error.tsx` / `not-found.tsx`).
 */

/**
 * The theme next-themes would have resolved, read straight from its storage
 * (#931). This boundary replaces the document, so the `ThemeProvider` that
 * normally stamps `data-theme` is gone — without this the dark tokens in
 * globals.css never apply and a dark-mode reader gets a white page. Duplicating
 * the lookup is the price of the "assume no providers" rule; it is pinned to
 * next-themes' defaults (storage key `theme`, `defaultTheme="light"`,
 * `enableSystem`) as configured in `app/[locale]/layout.tsx`.
 */
function storedTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  try {
    const stored = window.localStorage.getItem("theme");
    if (stored === "dark" || stored === "light") return stored;
    if (stored === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
  } catch {
    // Storage can throw outright (Safari private mode, blocked third-party
    // cookies). A themed error page is not worth a second error.
  }
  return "light";
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Initial state covers the client-render path (the common one) so the correct
  // theme is in the first commit; the effect covers the server-rendered path,
  // where this initializer ran on the server and could only answer "light".
  const [theme, setTheme] = useState(storedTheme);

  useEffect(() => {
    setTheme(storedTheme());
  }, []);

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en" data-theme={theme} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col items-center justify-center bg-bg px-4 text-center text-text">
        <h1 className="font-display text-6xl font-black text-primary">Oops!</h1>
        <p className="mt-4 text-xl font-semibold">Something Went Wrong</p>
        <p className="mt-2 max-w-md text-text-3">
          An unexpected error occurred.
        </p>
        <button
          onClick={reset}
          className="mt-8 inline-flex items-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Try Again
        </button>
      </body>
    </html>
  );
}
