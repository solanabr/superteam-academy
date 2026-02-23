"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { leaderboardService } from "@/lib/services/leaderboard-service";
import type { LeaderboardEntry, LeaderboardTimeframe } from "@/types";
import { motion } from "framer-motion";
import { Crown, TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

const podiumStyles = [
  "border-amber-300/45 bg-amber-400/10",
  "border-zinc-300/35 bg-zinc-200/10",
  "border-orange-500/35 bg-orange-400/10",
] as const;

export default function LeaderboardPage() {
  const t = useTranslations("Leaderboard");
  const [timeframe, setTimeframe] = useState<LeaderboardTimeframe>("weekly");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    leaderboardService.getEntries(timeframe).then(setEntries);
  }, [timeframe]);

  const topThree = entries.slice(0, 3);
  const remaining = entries.slice(3);
  const maxXp = useMemo(() => Math.max(...entries.map((entry) => entry.xp), 1), [entries]);

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

      <section className="grid gap-4 md:grid-cols-3">
        {topThree.map((entry, index) => (
          <motion.article
            key={entry.userId}
            className={`rounded-2xl border p-4 ${podiumStyles[index]}`}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: index * 0.08 }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wide text-zinc-400">Rank #{index + 1}</span>
              <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 1.8, delay: index * 0.12 }}>
                <Crown className={`size-4 ${index === 0 ? "text-amber-300" : index === 1 ? "text-zinc-300" : "text-orange-300"}`} />
              </motion.div>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <Avatar className="size-12 border border-white/20">
                <AvatarImage src={entry.avatar} alt={entry.username} />
                <AvatarFallback>{entry.username.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-zinc-100">{entry.username}</p>
                <p className="text-xs text-zinc-400">{entry.country}</p>
              </div>
            </div>
            <p className="mt-3 text-lg font-semibold text-zinc-100">{entry.xp.toLocaleString()} XP</p>
            <p className="flex items-center gap-1 text-xs text-[#14F195]">
              <TrendingUp className="size-3.5" />+{entry.weeklyGain}
            </p>
          </motion.article>
        ))}
      </section>

      <section className="space-y-3">
        {remaining.map((entry, index) => {
          const rank = index + 4;
          const ratio = Math.round((entry.xp / maxXp) * 100);
          return (
            <motion.article
              key={entry.userId}
              className="rounded-xl border border-white/10 bg-zinc-900/70 px-4 py-3"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: index * 0.04 }}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <motion.div
                    className="inline-flex w-8 justify-center rounded-full border border-white/10 bg-zinc-950 px-2 py-1 text-sm font-semibold text-zinc-200"
                    animate={{ scale: [1, 1.03, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: index * 0.07 }}
                  >
                    {rank}
                  </motion.div>
                  <Avatar className="border border-white/15">
                    <AvatarImage src={entry.avatar} alt={entry.username} />
                    <AvatarFallback>{entry.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold text-zinc-100">{entry.username}</p>
                    <p className="text-xs text-zinc-400">Lv {entry.level}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {entry.badges.map((badge) => (
                    <Badge key={`${entry.userId}-${badge}`} variant="outline" className="border-white/20 text-zinc-300">
                      {badge}
                    </Badge>
                  ))}
                  <span className="text-sm text-zinc-200">{entry.xp.toLocaleString()} XP</span>
                </div>
              </div>

              <Progress value={ratio} className="mt-3 h-1.5 bg-zinc-800" />
            </motion.article>
          );
        })}
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
      className={
        current === value
          ? "bg-gradient-to-r from-[#9945FF] to-[#14F195] text-black"
          : "border-white/20 bg-transparent text-zinc-200"
      }
      onClick={() => onChange(value)}
    >
      {label}
    </Button>
  );
}
