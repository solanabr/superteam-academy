"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

export default function PlatformError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("error");

  useEffect(() => {
    console.error("[platform]", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8">
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
