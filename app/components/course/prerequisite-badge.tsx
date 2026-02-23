"use client";

import { useTranslations } from "next-intl";

export function PrerequisiteBadge({
  prerequisiteCourseId,
  isMet,
}: {
  prerequisiteCourseId: string;
  isMet: boolean;
}) {
  const t = useTranslations("courses");

  return (
    <div
      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
        isMet
          ? "border-solana-green/30 bg-solana-green/5 text-solana-green"
          : "border-yellow-400/30 bg-yellow-400/5 text-yellow-400"
      }`}
    >
      {isMet ? (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
        </svg>
      )}
      <span>
        {t("prerequisite")}: {prerequisiteCourseId}
      </span>
    </div>
  );
}
