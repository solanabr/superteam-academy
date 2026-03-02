"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  Medal,
  Flame,
  Crown,
  TrendingUp,
  BookOpen,
  ChevronDown,
} from "lucide-react";
import { formatXP, xpProgress, truncateAddress } from "@/lib/utils";
import { useLearningProgress } from "@/lib/hooks/use-learning-progress";
import { useCourses } from "@/lib/hooks/use-courses";
import type { LeaderboardEntry } from "@/types";
import { LeaderboardContentSkeleton } from "@/components/gamification";
import { EmptyState } from "@/components/ui/empty-state";
import { EmptyLeaderboardIllustration } from "@/components/icons";

type TimeFilter = "weekly" | "monthly" | "allTime";

function toServiceTimeframe(f: TimeFilter): "weekly" | "monthly" | "alltime" {
  return f === "allTime" ? "alltime" : f;
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-500/20">
        <Crown className="h-4 w-4 text-yellow-400" />
      </div>
    );
  if (rank === 2)
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300/20">
        <Medal className="h-4 w-4 text-gray-300" />
      </div>
    );
  if (rank === 3)
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-700/20">
        <Medal className="h-4 w-4 text-amber-600" />
      </div>
    );
  return (
    <div className="flex h-8 w-8 items-center justify-center">
      <span className="text-sm font-bold text-muted-foreground">#{rank}</span>
    </div>
  );
}

function PodiumCard({
  entry,
  position,
}: {
  entry: LeaderboardEntry;
  position: 1 | 2 | 3;
}) {
  const t = useTranslations("leaderboard");
  const heights = { 1: "h-36", 2: "h-28", 3: "h-24" };
  const avatarSizes = { 1: "h-20 w-20", 2: "h-16 w-16", 3: "h-14 w-14" };
  const ringColors = {
    1: "ring-yellow-400",
    2: "ring-gray-300",
    3: "ring-amber-600",
  };
  const bgColors = {
    1: "from-yellow-500/20 to-yellow-600/5",
    2: "from-gray-300/20 to-gray-400/5",
    3: "from-amber-600/20 to-amber-700/5",
  };
  const rankLabels = {
    1: t("rankFirst"),
    2: t("rankSecond"),
    3: t("rankThird"),
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative mb-3">
        <div
          className={`${avatarSizes[position]} flex items-center justify-center rounded-full bg-muted ring-2 ${ringColors[position]} overflow-hidden`}
        >
          {entry.avatar ? (
            <Image
              src={entry.avatar}
              alt={entry.displayName || ""}
              width={80}
              height={80}
              className="h-full w-full object-cover"
              unoptimized
            />
          ) : (
            <span className="text-lg font-bold text-muted-foreground">
              {entry.displayName?.charAt(0) || "?"}
            </span>
          )}
        </div>
        <div
          className={`absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full px-2 py-0.5 text-xs font-bold ${
            position === 1
              ? "bg-yellow-500 text-black"
              : position === 2
                ? "bg-gray-300 text-black"
                : "bg-amber-600 text-white"
          }`}
        >
          {rankLabels[position]}
        </div>
      </div>

      <p className="mt-2 font-semibold">{entry.displayName}</p>
      <p className="text-sm text-xp font-medium">{formatXP(entry.xp)} {t("xp")}</p>
      <p className="text-xs text-muted-foreground">{t("level")} {entry.level}</p>

      <div
        className={`mt-3 w-24 ${heights[position]} rounded-t-lg bg-gradient-to-b ${bgColors[position]} border border-white/5`}
      />
    </div>
  );
}

export default function LeaderboardPage() {
  const t = useTranslations("leaderboard");
  const tGamification = useTranslations("gamification");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("allTime");
  const [courseFilter, setCourseFilter] = useState<string | undefined>(undefined);
  const [courseDropdownOpen, setCourseDropdownOpen] = useState(false);
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { getLeaderboard, xp, streak, isOnChain, walletAddress } = useLearningProgress();
  const { courses: allCourses } = useCourses();

  const courseOptions = useMemo(() =>
    allCourses.map((c) => ({ slug: c.slug, title: c.title })),
    [allCourses]
  );

  const selectedCourseTitle = useMemo(() =>
    courseFilter ? courseOptions.find((c) => c.slug === courseFilter)?.title : undefined,
    [courseFilter, courseOptions]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const entries = await getLeaderboard(toServiceTimeframe(timeFilter), courseFilter);
      if (cancelled) return;
      setData(entries);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [timeFilter, courseFilter, getLeaderboard]);

  const top3 = data.slice(0, 3);
  // Detect the current user by wallet address; fall back to userId string match
  const userEntry = data.find((e) =>
    (walletAddress && e.wallet === walletAddress) ||
    (!walletAddress && e.wallet === "local-learner")
  );
  const userRank = userEntry?.rank;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          {t("title")}
          {isOnChain && (
            <span className="ml-3 inline-block rounded-full bg-green-500/15 px-2.5 py-1 align-middle text-xs font-medium text-green-600 dark:text-green-400">
              {tGamification("onChain.rankings")}
            </span>
          )}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      {/* Filters Row */}
      <div className="mb-8 flex flex-wrap items-center gap-3">
        {/* Time Filters */}
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {(
            [
              { key: "weekly", label: t("weekly") },
              { key: "monthly", label: t("monthly") },
              { key: "allTime", label: t("allTime") },
            ] as { key: TimeFilter; label: string }[]
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setTimeFilter(tab.key)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                timeFilter === tab.key
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Course Filter Dropdown */}
        <div className="relative">
          <button
            onClick={() => setCourseDropdownOpen((o) => !o)}
            aria-expanded={courseDropdownOpen}
            aria-haspopup="listbox"
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              courseFilter
                ? "bg-st-green/15 text-st-green-light border border-st-green/30"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span className="max-w-[180px] truncate">
              {selectedCourseTitle ?? t("filter.allCourses")}
            </span>
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${courseDropdownOpen ? "rotate-180" : ""}`} />
          </button>
          {courseDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setCourseDropdownOpen(false)}
              />
              <div
                role="listbox"
                className="absolute left-0 top-full z-20 mt-1 w-64 rounded-lg border border-white/10 bg-card p-1 shadow-xl"
              >
                <button
                  role="option"
                  aria-selected={!courseFilter}
                  onClick={() => { setCourseFilter(undefined); setCourseDropdownOpen(false); }}
                  className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                    !courseFilter ? "bg-st-green/15 text-st-green-light" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {t("filter.allCourses")}
                </button>
                {courseOptions.map((c) => (
                  <button
                    key={c.slug}
                    role="option"
                    aria-selected={courseFilter === c.slug}
                    onClick={() => { setCourseFilter(c.slug); setCourseDropdownOpen(false); }}
                    className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors truncate ${
                      courseFilter === c.slug ? "bg-st-green/15 text-st-green-light" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {c.title}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <LeaderboardContentSkeleton />
      ) : !loading && data.length === 0 ? (
        <div className="glass rounded-xl">
          <EmptyState
            illustration={<EmptyLeaderboardIllustration className="h-full w-full" />}
            title={t("empty")}
            description={t("emptyHint")}
            action={{ label: t("startLearning"), href: "/courses" }}
          />
        </div>
      ) : (
        <>
          {/* Podium Section */}
          <div className="mb-12 flex items-end justify-center gap-4 sm:gap-8">
            <PodiumCard entry={top3[1]} position={2} />
            <PodiumCard entry={top3[0]} position={1} />
            <PodiumCard entry={top3[2]} position={3} />
          </div>

          {/* Full Leaderboard Table */}
          <div className="glass overflow-hidden rounded-xl">
            <div className="grid grid-cols-12 gap-2 border-b border-white/5 px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground sm:px-6">
              <div className="col-span-1">{t("rank")}</div>
              <div className="col-span-4 sm:col-span-3">{t("wallet")}</div>
              <div className="col-span-2 hidden sm:block">{t("walletColumn")}</div>
              <div className="col-span-2 text-right">{t("xp")}</div>
              <div className="col-span-2 text-right hidden sm:block">{t("level")}</div>
              <div className="col-span-2 sm:col-span-2 text-right">{tGamification("streak")}</div>
            </div>

            <div className="divide-y divide-white/5">
              {data.map((entry) => {
                const isCurrentUser =
                  (walletAddress && entry.wallet === walletAddress) ||
                  (!walletAddress && entry.wallet === "local-learner");
                return (
                  <div
                    key={entry.rank}
                    className={`grid grid-cols-12 gap-2 px-4 py-3 text-sm sm:px-6 transition-colors ${
                      isCurrentUser
                        ? "bg-st-green/10 border-l-2 border-l-st-green"
                        : "hover:bg-white/[0.02]"
                    }`}
                  >
                    <div className="col-span-1 flex items-center">
                      <RankBadge rank={entry.rank} />
                    </div>
                    <div className="col-span-4 sm:col-span-3 flex items-center gap-2">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-bold text-muted-foreground">
                        {entry.avatar ? (
                          <Image
                            src={entry.avatar}
                            alt={entry.displayName || ""}
                            width={32}
                            height={32}
                            className="h-full w-full object-cover"
                            unoptimized
                          />
                        ) : (
                          entry.displayName?.charAt(0) || "?"
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className={`truncate font-medium ${isCurrentUser ? "text-st-green-light" : ""}`}>
                          {isCurrentUser ? t("you") : entry.displayName}
                        </p>
                      </div>
                    </div>
                    <div className="col-span-2 hidden items-center sm:flex">
                      <span className="font-mono text-xs text-muted-foreground">
                        {truncateAddress(entry.wallet)}
                      </span>
                    </div>
                    <div className="col-span-2 flex items-center justify-end">
                      <span className="font-semibold text-xp">
                        {formatXP(entry.xp)}
                      </span>
                    </div>
                    <div className="col-span-2 hidden items-center justify-end sm:flex">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-level" />
                        <span className="text-level font-medium">{entry.level}</span>
                      </div>
                    </div>
                    <div className="col-span-2 flex items-center justify-end gap-1">
                      <Flame className="h-3 w-3 text-streak" />
                      <span className="text-streak font-medium">{entry.streak}d</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Current User Summary */}
          <div className="mt-6 glass rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-st-green/20 text-sm font-bold text-st-green">
                Y
              </div>
              <div>
                <p className="font-semibold">{t("yourRank")}</p>
                <p className="text-xs text-muted-foreground">
                  {userRank ? t("yourRankOut", { rank: userRank, total: data.length }) : t("learnersOnBoard", { total: data.length })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="text-center">
                <p className="font-bold text-xp">
                  {formatXP(xp)}
                </p>
                <p className="text-xs text-muted-foreground">{t("xp")}</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-level">
                  {xpProgress(xp).level}
                </p>
                <p className="text-xs text-muted-foreground">{t("level")}</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-streak">
                  {streak.currentStreak}d
                </p>
                <p className="text-xs text-muted-foreground">{tGamification("streak")}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
