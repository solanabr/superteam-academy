"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

interface PageErrorProps {
  section?: string;
  reset: () => void;
  showGoHome?: boolean;
}

export function PageError({
  section,
  reset,
  showGoHome = false,
}: PageErrorProps) {
  const t = useTranslations("errors");
  const title = section ? t(`${section}Title`) : t("title");
  const description = section ? t(`${section}Description`) : t("description");

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="mb-4 text-2xl font-bold text-[var(--c-text)]">
          {title}
        </h1>
        <p className="mb-6 text-[var(--c-text-2)]">{description}</p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={reset}
            className="rounded-[2px] border border-[var(--solana-green)] bg-transparent px-6 py-2.5 text-sm font-medium text-[var(--solana-green)] transition-colors hover:bg-[var(--solana-green)] hover:text-black"
          >
            {t("tryAgain")}
          </button>
          {showGoHome && (
            <Link
              href="/"
              className="rounded-[2px] border border-[var(--c-border)] bg-transparent px-6 py-2.5 text-sm font-medium text-[var(--c-text-2)] transition-colors hover:border-[var(--c-border-hovered)] hover:text-[var(--c-text)]"
            >
              {t("goHome")}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
