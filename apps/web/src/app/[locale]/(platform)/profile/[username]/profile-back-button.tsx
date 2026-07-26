"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "@phosphor-icons/react";

export function ProfileBackButton() {
  const router = useRouter();
  const t = useTranslations("profile");

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="inline-flex items-center gap-1.5 font-display text-sm font-bold text-text-3 transition-colors hover:text-text"
    >
      <ArrowLeft size={14} weight="bold" />
      {t("backToLeaderboard")}
    </button>
  );
}
