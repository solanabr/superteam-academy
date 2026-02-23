"use client";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { leaderboardService } from "@/lib/services/leaderboard-service";
import type { LeaderboardEntry, LeaderboardTimeframe } from "@/types";
import { Crown, TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

export default function LeaderboardPage() {
  const t = useTranslations("Leaderboard");
  const [timeframe, setTimeframe] = useState<LeaderboardTimeframe>("weekly");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    leaderboardService.getEntries(timeframe).then(setEntries);
  }, [timeframe]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold text-zinc-100">{t("title")}</h1>
        <p className="mt-2 text-zinc-400">{t("subtitle")}</p>
      </header>

      <div className="flex gap-2">
        <TimeframeButton current={timeframe} value="weekly" label={t("weekly")} onChange={setTimeframe} />
        <TimeframeButton current={timeframe} value="monthly" label={t("monthly")} onChange={setTimeframe} />
        <TimeframeButton current={timeframe} value="all-time" label={t("allTime")} onChange={setTimeframe} />
      </div>

      <section className="space-y-3">
        {entries.map((entry, index) => (
          <article key={entry.userId} className="flex items-center justify-between rounded-xl border border-white/10 bg-zinc-900/70 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex w-7 justify-center text-sm font-semibold text-zinc-200">#{index + 1}</div>
              <Avatar>
                <AvatarImage src={entry.avatar} alt={entry.username} />
              </Avatar>
              <div>
                <p className="text-sm font-semibold text-zinc-100">{entry.username}</p>
                <p className="text-xs text-zinc-400">{entry.country}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {index < 3 ? <Crown className="size-4 text-amber-300" /> : null}
              <Badge className="bg-zinc-800 text-zinc-100">Lv {entry.level}</Badge>
              <p className="text-sm text-zinc-200">{entry.xp.toLocaleString()} XP</p>
              <p className="flex items-center gap-1 text-xs text-[#14F195]"><TrendingUp className="size-3.5" />{entry.weeklyGain}</p>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

function TimeframeButton({
  current,
  value,
  label,
  onChange,
}: {
  current: LeaderboardTimeframe;
  value: LeaderboardTimeframe;
  label: string;
  onChange: (value: LeaderboardTimeframe) => void;
}) {
  return (
    <Button
      variant={current === value ? "default" : "outline"}
      className={current === value ? "bg-gradient-to-r from-[#9945FF] to-[#14F195] text-black" : "border-white/20 bg-transparent text-zinc-200"}
      onClick={() => onChange(value)}
    >
      {label}
    </Button>
  );
}
