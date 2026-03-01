"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { levelFromXp } from "@/lib/solana/constants";
import { useWallet } from "@solana/wallet-adapter-react";
import { useQuery } from "@tanstack/react-query";
import { Crown, Loader2, TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

type Timeframe = "all-time" | "monthly" | "weekly";

interface LeaderboardRow {
  rank: number;
  wallet: string;
  xp: number;
  level: number;
  isCurrentUser: boolean;
}

async function fetchLeaderboard(timeframe: Timeframe): Promise<LeaderboardRow[]> {
  const res = await fetch(`/api/leaderboard?timeframe=${timeframe}`);
  if (!res.ok) return [];
  const { leaderboard } = (await res.json()) as {
    leaderboard: Array<{ rank: number; wallet: string; xp: number; level: number }>;
  };
  return (leaderboard ?? []).map((e) => ({ ...e, isCurrentUser: false }));
}

const podiumStyles = [
  "border-warning/45 bg-podium-gold",
  "border-muted-foreground/35 bg-podium-silver",
  "border-warning/35 bg-podium-bronze",
] as const;

const timeframeOptions: { value: Timeframe; label: string }[] = [
  { value: "all-time", label: "All Time" },
  { value: "monthly", label: "Monthly" },
  { value: "weekly", label: "Weekly" },
];

export default function LeaderboardPage() {
  const t = useTranslations("Leaderboard");
  const { publicKey } = useWallet();
  const [timeframe, setTimeframe] = useState<Timeframe>("all-time");

  const { data: rows, isLoading } = useQuery({
    queryKey: ["leaderboard", timeframe],
    queryFn: () => fetchLeaderboard(timeframe),
    staleTime: 30_000,
  });

  const entries = useMemo(() => {
    if (!rows) return [];
    const walletStr = publicKey?.toBase58();
    return rows.map((r) => ({
      ...r,
      isCurrentUser: r.wallet === walletStr,
    }));
  }, [rows, publicKey]);

  const topThree = entries.slice(0, 3);
  const remaining = entries.slice(3);
  const maxXp = useMemo(() => Math.max(...entries.map((e) => e.xp), 1), [entries]);

  function shortWallet(w: string) {
    return w.length > 12 ? `${w.slice(0, 4)}...${w.slice(-4)}` : w;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">{t("title")}</h1>
          <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="flex gap-1 rounded-lg border border-border bg-secondary/50 p-1">
          {timeframeOptions.map((opt) => (
            <Button
              key={opt.value}
              size="sm"
              variant={timeframe === opt.value ? "default" : "ghost"}
              className="text-xs"
              onClick={() => setTimeframe(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-secondary/50 px-6 py-10 text-center">
          <p className="text-base font-medium text-foreground/90">No XP holders yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Complete lessons to earn XP and appear on the leaderboard.</p>
        </div>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            {topThree.map((entry, index) => (
              <article
                key={entry.wallet}
                className={`rounded-2xl border p-4 ${podiumStyles[index]}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">Rank #{entry.rank}</span>
                  <Crown className={`size-4 ${index === 0 ? "text-warning" : index === 1 ? "text-muted-foreground" : "text-warning"}`} />
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <Avatar className="size-12 border border-border">
                    <AvatarFallback>{shortWallet(entry.wallet).slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-foreground">{shortWallet(entry.wallet)}</p>
                    <p className="text-xs text-muted-foreground">Lv {entry.level}</p>
                  </div>
                </div>
                <p className="mt-3 text-lg font-semibold text-foreground">{entry.xp.toLocaleString()} XP</p>
                {entry.isCurrentUser && (
                  <p className="flex items-center gap-1 text-xs text-st-yellow">
                    <TrendingUp className="size-3.5" /> You
                  </p>
                )}
              </article>
            ))}
          </section>

          <section className="space-y-3">
            {remaining.map((entry, index) => {
              const ratio = Math.round((entry.xp / maxXp) * 100);
              return (
                <article
                  key={entry.wallet}
                  className={`rounded-xl border px-4 py-3 ${
                    entry.isCurrentUser
                      ? "border-st-yellow/50 bg-st-yellow/5 ring-1 ring-st-yellow/30"
                      : "border-border bg-card"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="inline-flex w-8 justify-center rounded-full border border-border bg-secondary px-2 py-1 text-sm font-semibold text-foreground/90">
                        {entry.rank}
                      </div>
                      <Avatar className="border border-border">
                        <AvatarFallback>{shortWallet(entry.wallet).slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{shortWallet(entry.wallet)}</p>
                        <p className="text-xs text-muted-foreground">Lv {entry.level}</p>
                      </div>
                    </div>
                    <span className="text-sm text-foreground/90">{entry.xp.toLocaleString()} XP</span>
                  </div>
                  <Progress value={ratio} className="mt-3 h-1.5 bg-secondary" />
                </article>
              );
            })}
          </section>
        </>
      )}
    </div>
  );
}
