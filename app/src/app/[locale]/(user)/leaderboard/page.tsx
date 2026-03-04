"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAPIQuery } from "@/lib/api/useAPI";
import { Input } from "@/components/ui/input";

type LeaderboardEntry = {
  rank: number;
  user_id: string;
  username?: string;
  xp: number;
  level: number;
};

export default function LeaderboardPage() {
  const t = useTranslations("leaderboard");
  const t_common = useTranslations("common");
  const [period, set_period] = useState<"24h" | "7d" | "30d" | "all_time">("all_time");
  const [search, set_search] = useState("");

  const { data, isPending, error } = useAPIQuery<{ entries: LeaderboardEntry[] }>({
    queryKey: ["leaderboard", period],
    path: `/api/leaderboard?timeframe=${period}&limit=50&offset=0`,
  });

  const entries = data?.entries ?? [];
  const filtered = search
    ? entries.filter(
        (e) =>
          e.username?.toLowerCase().includes(search.toLowerCase()) ||
          e.user_id.toLowerCase().includes(search.toLowerCase()),
      )
    : entries;

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-semibold text-foreground">{t("title")}</h1>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <Input
          placeholder={t("searchByUsername")}
          value={search}
          onChange={(e) => set_search(e.target.value)}
          className="max-w-xs rounded-none"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => set_period("24h")}
            className={`border px-3 py-2 text-sm rounded-none ${period === "24h" ? "border-primary bg-primary/10" : "border-border"}`}
          >
            {t("last24h")}
          </button>
          <button
            type="button"
            onClick={() => set_period("7d")}
            className={`border px-3 py-2 text-sm rounded-none ${period === "7d" ? "border-primary bg-primary/10" : "border-border"}`}
          >
            {t("weekly")}
          </button>
          <button
            type="button"
            onClick={() => set_period("30d")}
            className={`border px-3 py-2 text-sm rounded-none ${period === "30d" ? "border-primary bg-primary/10" : "border-border"}`}
          >
            {t("monthly")}
          </button>
          <button
            type="button"
            onClick={() => set_period("all_time")}
            className={`border px-3 py-2 text-sm rounded-none ${period === "all_time" ? "border-primary bg-primary/10" : "border-border"}`}
          >
            {t("allTime")}
          </button>
        </div>
      </div>

      {isPending && (
        <p className="mt-4 text-sm text-muted-foreground">{t_common("loading")}</p>
      )}
      {error && (
        <p className="mt-4 text-sm text-destructive">{error.message}</p>
      )}
      {!isPending && !error && filtered.length === 0 && (
        <p className="mt-8 text-muted-foreground">{t("noResults")}</p>
      )}
      {!isPending && filtered.length > 0 && (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full border-collapse border border-border">
            <thead>
              <tr className="bg-muted/50">
                <th className="border border-border px-4 py-2 text-left text-sm font-medium">
                  {t("rank")}
                </th>
                <th className="border border-border px-4 py-2 text-left text-sm font-medium">
                  {t("user")}
                </th>
                <th className="border border-border px-4 py-2 text-left text-sm font-medium">
                  {t("xp")}
                </th>
                <th className="border border-border px-4 py-2 text-left text-sm font-medium">
                  {t("level")}
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.user_id} className="hover:bg-muted/30">
                  <td className="border border-border px-4 py-2 font-medium">
                    {e.rank}
                  </td>
                  <td className="border border-border px-4 py-2 text-sm">
                    {e.username ?? e.user_id.slice(0, 8)}…
                  </td>
                  <td className="border border-border px-4 py-2 text-sm">
                    {e.xp}
                  </td>
                  <td className="border border-border px-4 py-2 text-sm">
                    {e.level}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
