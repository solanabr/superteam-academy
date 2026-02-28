"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { useTranslations } from "next-intl";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors");

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body className="flex min-h-screen items-center justify-center bg-background font-sans">
        <div className="text-center">
          <h2 className="text-2xl font-bold">{t("global.title")}</h2>
          <p className="mt-2 text-muted-foreground">
            {t("global.description")}
          </p>
          <button
            onClick={reset}
            className="mt-4 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            {t("global.tryAgain")}
          </button>
        </div>
      </body>
    </html>
  );
}
