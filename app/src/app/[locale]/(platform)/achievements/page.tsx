"use client";

import { AchievementList } from "@/components/achievements/AchievementList";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";


export default function AchievementsPage() {
  const t = useTranslations("achievements");

  return (
    <main className="min-h-screen bg-void pt-4 pb-12">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-6">
          <nav className="flex items-center gap-2 text-xs font-mono text-text-muted mb-6 uppercase tracking-widest">
            <Link href="/dashboard" className="hover:text-solana transition-colors">Dashboard</Link>
            <span className="text-white/20">/</span>
            <span className="text-solana">{t("title")}</span>
          </nav>
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
