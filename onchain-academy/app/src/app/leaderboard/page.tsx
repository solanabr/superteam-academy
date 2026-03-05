"use client";

import { useEffect, useState } from "react";
import { Trophy, Medal, ShieldCheck, Flame } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { learningProgressService } from "@/services/learning-progress-service";
import { getMockLeaderboard } from "@/data/mock-leaderboard";
import type { LeaderboardEntry, Timeframe } from "@/types/domain";
import { trackEvent } from "@/lib/analytics";
import { useLocale } from "@/providers/locale-provider";
import { contentService } from "@/services/content-service";
import type { CourseSummary } from "@/types/domain";

export default function LeaderboardPage(): React.JSX.Element {
  const { t } = useLocale();
  const { publicKey } = useWallet();
  const [timeframe, setTimeframe] = useState<Timeframe>("weekly");
  const [courseFilter, setCourseFilter] = useState("all");
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const timeframes: { label: string; value: Timeframe }[] = [
    { label: t("leaderboard.timeframe.weekly"), value: "weekly" },
    { label: t("leaderboard.timeframe.monthly"), value: "monthly" },
    { label: t("leaderboard.timeframe.allTime"), value: "all-time" },
  ];

  useEffect(() => {
    void contentService
      .getCourses()
      .then((rows) => setCourses(rows))
      .catch(() => setCourses([]));
  }, []);

  useEffect(() => {
    trackEvent("leaderboard_filter_changed", {
      timeframe,
      courseFilter: courseFilter === "all" ? null : courseFilter,
    });
    setStatus("loading");
    void learningProgressService
      .getLeaderboard(
        timeframe,
        courseFilter === "all" ? undefined : courseFilter,
      )
      .then((rows) => {
        setEntries(rows.length > 0 ? rows : getMockLeaderboard(timeframe));
        setStatus("ready");
      })
      .catch(() => {
        setEntries(getMockLeaderboard(timeframe));
        setStatus("ready");
      });
  }, [timeframe, courseFilter]);

  function getRankIcon(rank: number) {
    switch (rank) {
      case 1:
        return (
          <Trophy className="h-6 w-6 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" />
        );
      case 2:
        return (
          <Medal className="h-6 w-6 text-gray-400 drop-shadow-[0_0_8px_rgba(156,163,175,0.6)]" />
        );
      case 3:
        return (
          <Medal className="h-6 w-6 text-amber-700 drop-shadow-[0_0_8px_rgba(180,83,9,0.6)]" />
        );
      default:
        return (
          <span className="font-mono text-muted-foreground font-bold text-lg w-6 text-center">
            {rank}
          </span>
        );
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-fade-in pb-20">
      <header className="text-center space-y-4 pt-8 pb-4">
        <div className="mx-auto h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(52,211,153,0.2)]">
          <Trophy className="h-8 w-8 text-primary" />
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
          {t("leaderboard.titlePrefix")}{" "}
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {t("leaderboard.titleHighlight")}
          </span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {t("leaderboard.subtitle")}
        </p>
      </header>

      <Tabs
        defaultValue="weekly"
        onValueChange={(v) => setTimeframe(v as Timeframe)}
        className="w-full"
      >
        <div className="max-w-sm mx-auto mb-5">
          <select
            value={courseFilter}
            onChange={(event) => setCourseFilter(event.target.value)}
            className="w-full h-10 px-3 rounded-md border border-border/60 bg-background/50 text-sm outline-none focus:border-primary"
          >
            <option value="all">{t("leaderboard.filterAllCourses")}</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        </div>
        <div className="flex justify-center mb-8">
          <TabsList className="bg-muted/40 border border-border/50 p-1 h-14 rounded-2xl backdrop-blur-md">
            {timeframes.map((tf) => (
              <TabsTrigger
                key={tf.value}
                value={tf.value}
                className="px-8 h-full rounded-xl text-sm font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md transition-all"
              >
                {tf.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {timeframes.map((tf) => (
          <TabsContent key={tf.value} value={tf.value} className="outline-none">
            {status === "loading" ? (
              <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground space-y-4">
                <div className="relative h-12 w-12">
                  <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin" />
                  <div className="absolute inset-2 rounded-full border-t-2 border-secondary animate-spin opacity-50" />
                </div>
                <p className="font-medium animate-pulse font-mono text-sm">
                  {t("leaderboard.loading")}
                </p>
              </div>
            ) : status === "error" ? (
              <div className="flex flex-col items-center justify-center h-[400px] text-destructive">
                <p>{t("leaderboard.error")}</p>
              </div>
            ) : entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                <p>{t("leaderboard.empty")}</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* ── Top 3 Podium ── */}
                {entries.length >= 3 && (
                  <div className="grid grid-cols-3 gap-4 mb-2">
                    {/* Reorder: 2nd · 1st · 3rd */}
                    {([1, 0, 2] as const).map((pos) => {
                      const e = entries[pos];
                      if (!e) return null;
                      const isPrimary = pos === 0;
                      const configs = [
                        {
                          label: "rank-gold",
                          ring: "#facc15",
                          size: "text-5xl",
                          trophy: (
                            <Trophy className="h-5 w-5 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.7)]" />
                          ),
                        },
                        {
                          label: "rank-silver",
                          ring: "#9ca3af",
                          size: "text-3xl",
                          trophy: <Medal className="h-5 w-5 text-gray-400" />,
                        },
                        {
                          label: "rank-bronze",
                          ring: "#b45309",
                          size: "text-3xl",
                          trophy: <Medal className="h-5 w-5 text-amber-700" />,
                        },
                      ] as const;
                      const cfg = configs[pos];
                      return (
                        <div
                          key={e.walletAddress}
                          className={`podium-card ${cfg.label} flex flex-col items-center text-center p-5 gap-3 ${isPrimary ? "py-7 -mt-4" : ""}`}
                        >
                          <div className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                            {cfg.trophy}
                            <span>#{e.rank}</span>
                          </div>
                          <div
                            className="h-12 w-12 rounded-full flex items-center justify-center font-bold text-base border-2"
                            style={{
                              borderColor: cfg.ring,
                              color: cfg.ring,
                              background: `${cfg.ring}18`,
                            }}
                          >
                            {e.displayName.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground text-sm leading-tight">
                              {e.displayName}
                            </p>
                            <p className="font-mono text-[10px] text-muted-foreground mt-0.5">
                              {e.walletAddress.slice(0, 4)}…
                              {e.walletAddress.slice(-4)}
                            </p>
                          </div>
                          <div
                            className={`font-mono font-bold ${cfg.size} leading-none`}
                            style={{
                              color: "#f59e0b",
                              textShadow: "0 0 16px rgba(245,158,11,0.4)",
                            }}
                          >
                            {e.xp.toLocaleString()}
                          </div>
                          <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest -mt-2">
                            XP
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ── Full Table ── */}
                <Card className="border-border/50 bg-background/40 backdrop-blur-xl shadow-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border/40 bg-muted/20">
                          <th className="px-6 py-4 text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-[0.15em] w-24 text-center">
                            {t("leaderboard.columns.rank")}
                          </th>
                          <th className="px-6 py-4 text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-[0.15em]">
                            {t("leaderboard.columns.developer")}
                          </th>
                          <th className="px-6 py-4 text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-[0.15em] text-right">
                            {t("leaderboard.columns.totalXp")}
                          </th>
                          <th className="px-6 py-4 text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-[0.15em] text-center">
                            {t("leaderboard.columns.level")}
                          </th>
                          <th className="px-6 py-4 text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-[0.15em] text-center">
                            {t("leaderboard.columns.streak")}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/20">
                        {entries.map((entry, idx) => {
                          const isCurrentUser =
                            publicKey &&
                            entry.walletAddress === publicKey.toBase58();
                          return (
                            <tr
                              key={`${entry.walletAddress}-${entry.rank}`}
                              className={`row-enter group transition-colors hover:bg-muted/10 ${
                                isCurrentUser
                                  ? "ring-inset ring-1 ring-primary/40 bg-primary/8"
                                  : ""
                              }`}
                              style={{ animationDelay: `${idx * 40}ms` }}
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex justify-center items-center">
                                  {getRankIcon(entry.rank)}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-sm border ${
                                      idx === 0
                                        ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/25"
                                        : idx === 1
                                          ? "bg-gray-400/15 text-gray-400 border-gray-400/25"
                                          : idx === 2
                                            ? "bg-amber-700/15 text-amber-700 border-amber-700/25"
                                            : "bg-secondary/8 text-secondary border-secondary/15"
                                    }`}
                                  >
                                    {entry.displayName
                                      .substring(0, 2)
                                      .toUpperCase()}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm">
                                      {entry.displayName}
                                      {isCurrentUser ? (
                                        <span className="ml-2 text-[9px] font-mono uppercase tracking-widest text-primary/70 border border-primary/30 px-1.5 py-0.5 rounded-full">
                                          you
                                        </span>
                                      ) : null}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground font-mono">
                                      {entry.walletAddress.slice(0, 4)}…
                                      {entry.walletAddress.slice(-4)}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <div
                                  className="font-mono font-bold text-base"
                                  style={
                                    idx < 10
                                      ? {
                                          color: "#f59e0b",
                                          textShadow:
                                            "0 0 12px rgba(245,158,11,0.35)",
                                        }
                                      : { color: "var(--fg-secondary)" }
                                  }
                                >
                                  {entry.xp.toLocaleString()}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 border border-primary/20 text-primary rounded-full font-mono font-bold text-xs">
                                  <ShieldCheck className="h-3.5 w-3.5" />{" "}
                                  {entry.level}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <div className="inline-flex items-center gap-1 text-orange-500 font-mono font-bold text-sm">
                                  <Flame className="h-3.5 w-3.5 fill-orange-500/25" />{" "}
                                  {entry.streak}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
