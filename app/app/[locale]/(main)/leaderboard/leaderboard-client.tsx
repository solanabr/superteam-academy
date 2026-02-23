"use client";

import { useTranslations } from "next-intl";
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table";

export default function LeaderboardPage() {
  const t = useTranslations("leaderboard");

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-content">{t("title")}</h1>
        <p className="mt-2 text-content-secondary">{t("subtitle")}</p>
      </div>
      <LeaderboardTable />
    </div>
  );
}
