"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import * as Sentry from "@sentry/nextjs";

/**
 * Marketing-group error boundary (#931). Without one, a landing-page failure
 * escalated to the root `app/error.tsx`, which renders outside the `[locale]`
 * layout and so hardcodes English — a PT-BR visitor hitting a transient error
 * on the front door got an English page. This boundary renders inside that
 * layout, where `NextIntlClientProvider` is mounted, so it uses the same
 * `error` namespace as the platform boundary rather than inline translations.
 */
export default function MarketingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("error");
  const locale = useLocale();

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center bg-bg px-4 text-center">
      <h1 className="font-display text-6xl font-black text-primary">Oops!</h1>
      <p className="mt-4 text-xl font-semibold text-text">{t("title")}</p>
      <p className="mt-2 max-w-md text-text-3">{t("description")}</p>
      <div className="mt-8 flex items-center gap-4">
        <button
          onClick={reset}
          className="inline-flex items-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          {t("tryAgain")}
        </button>
        <Link
          href={`/${locale}`}
          className="inline-flex items-center rounded-lg border-[2.5px] border-border px-6 py-3 text-sm font-medium text-text transition-colors hover:bg-subtle"
        >
          {t("goHome")}
        </Link>
      </div>
    </div>
  );
}
