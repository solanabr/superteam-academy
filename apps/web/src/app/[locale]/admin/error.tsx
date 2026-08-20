"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import * as Sentry from "@sentry/nextjs";

/**
 * Admin-console error boundary (#1133). `/admin` sits outside `(platform)` and
 * `(marketing)`, so before this file a server throw in the panel escalated to
 * the root `app/error.tsx` — a full-screen, hardcoded-English page that took
 * the console shell and nav rail with it. Living in the `admin` segment, this
 * boundary renders in the layout's children slot, so the rail stays usable and
 * the reader can retry or click to another screen.
 *
 * It cannot catch a throw from `admin/layout.tsx` itself (Next boundaries do
 * not wrap their own layout) — a failing `requireAdmin()` still escalates.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("error");

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <h2 className="font-display text-xl font-semibold text-text">
        {t("title")}
      </h2>
      <p className="text-text-3">{t("description")}</p>
      <button
        onClick={reset}
        className="inline-flex items-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
      >
        {t("tryAgain")}
      </button>
    </div>
  );
}
