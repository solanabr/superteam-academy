"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { leaderboardService } from "@/lib/services/leaderboard-service";
import { useUserStore } from "@/lib/store/user-store";
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
  const profile = useUserStore((state) => state.profile);

  useEffect(() => {
    leaderboardService
      .getEntriesWithUser(timeframe, {
        userId: profile.id,
        username: profile.displayName,
        avatar: profile.avatar,
        xp: profile.xp,
      })
      .then(setEntries);
  }, [timeframe, profile]);

  const topThree = entries.slice(0, 3);
  const remaining = entries.slice(3);
  const maxXp = useMemo(() => Math.max(...entries.map((entry) => entry.xp), 1), [entries]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold text-foreground">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
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
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Rank #{index + 1}</span>
              <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 1.8, delay: index * 0.12 }}>
                <Crown className={`size-4 ${index === 0 ? "text-amber-300" : index === 1 ? "text-muted-foreground" : "text-orange-300"}`} />
              </motion.div>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <Avatar className="size-12 border border-border">
                <AvatarImage src={entry.avatar} alt={entry.username} />
                <AvatarFallback>{entry.username.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-foreground">{entry.username}</p>
                <p className="text-xs text-muted-foreground">{entry.country}</p>
              </div>
            </div>
            <p className="mt-3 text-lg font-semibold text-foreground">{entry.xp.toLocaleString()} XP</p>
            <p className="flex items-center gap-1 text-xs text-[#ffd23f]">
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
              className={`rounded-xl border px-4 py-3 ${
                entry.isCurrentUser
                  ? "border-st-yellow/50 bg-st-yellow/5 ring-1 ring-st-yellow/30"
                  : "border-border bg-card"
              }`}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: index * 0.04 }}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <motion.div
                    className="inline-flex w-8 justify-center rounded-full border border-border bg-st-dark px-2 py-1 text-sm font-semibold text-foreground/90"
                    animate={{ scale: [1, 1.03, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: index * 0.07 }}
                  >
                    {rank}
                  </motion.div>
                  <Avatar className="border border-border">
                    <AvatarImage src={entry.avatar} alt={entry.username} />
                    <AvatarFallback>{entry.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{entry.username}</p>
                    <p className="text-xs text-muted-foreground">Lv {entry.level}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {entry.badges.map((badge) => (
                    <Badge key={`${entry.userId}-${badge}`} variant="outline" className="border-border text-muted-foreground">
                      {badge}
                    </Badge>
                  ))}
                  <span className="text-sm text-foreground/90">{entry.xp.toLocaleString()} XP</span>
                </div>
              </div>

              <Progress value={ratio} className="mt-3 h-1.5 bg-secondary" />
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
          ? "bg-gradient-to-r from-[#2f6b3f] to-[#ffd23f] text-st-dark"
          : "border-border bg-transparent text-foreground/90"
      }
      onClick={() => onChange(value)}
    >
      {label}
    </Button>
  );
}
