"use client";

import { AchievementList } from "@/components/achievements/AchievementList";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { PlatformNavbar } from "@/components/navigation/PlatformNavbar";

export default function AchievementsPage() {
  const t = useTranslations("achievements");

  return (
    <main className="min-h-screen bg-void pt-20 pb-12">
      <PlatformNavbar />
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-text-muted hover:text-white transition-colors mb-4"
          >
            <span className="material-symbols-outlined notranslate text-sm">arrow_back</span>
            <span className="text-sm font-medium">{t("back_to_dashboard")}</span>
          </Link>
          <h1 className="font-display text-text-primary text-2xl font-semibold">{t("title")}</h1>
          <p className="text-text-secondary mt-2 text-sm">
            {t("subtitle")}
          </p>
        </div>

        <AchievementList />
      </div>
    </main>
  );
}
