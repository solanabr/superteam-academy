"use client";

import { memo, useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useRouter, usePathname } from "@/i18n/routing";
import { useWallet } from "@solana/wallet-adapter-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCw, Info, Star, Flame, Crown, Zap } from "lucide-react";
import { getLevel, formatXp, truncateAddress } from "@/lib/utils";
import logger from "@/lib/logger";
import { useProgressStore } from "@/stores/progress-store";
import type { TokenHolder } from "@/lib/solana/helius";

const PROFILE_NAME_KEY = "superteam-profile-name";
const PROFILE_AVATAR_KEY = "superteam-profile-avatar";

function useProfileData() {
  const [profileName] = useState(() =>
    typeof window !== "undefined" ? (localStorage.getItem(PROFILE_NAME_KEY) ?? "") : ""
  );
  const [profileAvatar] = useState(() =>
    typeof window !== "undefined" ? (localStorage.getItem(PROFILE_AVATAR_KEY) ?? "") : ""
  );

  return { profileName, profileAvatar };
}

const getAvatarGradient = (address: string) => {
  const hash = address.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue1 = hash % 360;
  const hue2 = (hue1 + 40) % 360;
  return `linear-gradient(135deg, hsl(${hue1}, 70%, 45%), hsl(${hue2}, 70%, 60%))`;
};

type TimeFilter = "allTime" | "monthly" | "weekly";

// ── Podium Section ─────────────────────────────────────────────────────────

interface PodiumEntryProps {
  entry: TokenHolder;
  rank: 1 | 2 | 3;
  isMe: boolean;
  profileName?: string;
  profileAvatar?: string;
}

const PODIUM_CONFIG = {
  1: {
    order: "order-2",
    height: "h-36",
    gradient: "from-yellow-400 to-amber-600",
    glowClass: "glow-gold",
    animClass: "podium-1st",
    labelColor: "text-yellow-600 dark:text-yellow-300",
    borderColor: "border-yellow-400/60",
    blockBg: "bg-gradient-to-t from-yellow-600 to-amber-500",
    rankLabel: "1st",
  },
  2: {
    order: "order-1",
    height: "h-24",
    gradient: "from-slate-300 to-slate-500",
    glowClass: "glow-silver",
    animClass: "podium-2nd",
    labelColor: "text-slate-500 dark:text-slate-300",
    borderColor: "border-slate-400/50",
    blockBg: "bg-gradient-to-t from-slate-600 to-slate-400",
    rankLabel: "2nd",
  },
  3: {
    order: "order-3",
    height: "h-16",
    gradient: "from-amber-600 to-amber-800",
    glowClass: "glow-bronze",
    animClass: "podium-3rd",
    labelColor: "text-amber-600 dark:text-amber-400",
    borderColor: "border-amber-600/50",
    blockBg: "bg-gradient-to-t from-amber-800 to-amber-600",
    rankLabel: "3rd",
  },
} as const;

function PodiumEntry({ entry, rank, isMe, profileName, profileAvatar }: PodiumEntryProps) {
  const cfg = PODIUM_CONFIG[rank];
  const avatarGradient = getAvatarGradient(entry.owner);
  const avatarLabel = entry.owner.slice(0, 2).toUpperCase();
  const level = getLevel(entry.amount);
  const displayName = isMe && profileName ? profileName : null;

  return (
    <div className={`flex flex-col items-center gap-2 ${cfg.order} ${cfg.animClass}`}>
      {/* Crown for 1st */}
      {rank === 1 && (
        <Crown
          className="h-6 w-6 text-yellow-400 animate-crown drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]"
          aria-hidden="true"
        />
      )}

      {/* Avatar bubble */}
      <div className={`relative ring-2 ${cfg.borderColor} shadow-lg rounded-full`}>
        <Avatar className="h-14 w-14">
          {isMe && profileAvatar && <AvatarImage src={profileAvatar} alt={profileName || entry.owner} />}
          <AvatarFallback
            className="text-sm font-bold text-white"
            style={{ background: avatarGradient }}
          >
            {avatarLabel}
          </AvatarFallback>
        </Avatar>
        {isMe && (
          <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-primary border-2 border-background" />
        )}
      </div>

      {/* Name/address + XP info */}
      <div className="flex flex-col items-center gap-1">
        {displayName ? (
          <span className="max-w-[80px] truncate text-xs font-medium text-foreground/90">
            {displayName}
          </span>
        ) : (
          <span className="max-w-[80px] truncate font-mono text-xs text-foreground/80">
            {truncateAddress(entry.owner, 4)}
          </span>
        )}
        <Badge
          className={`text-[10px] px-1.5 py-0 bg-gradient-to-r ${cfg.gradient} text-white border-0`}
        >
          Lv {level}
        </Badge>
        <span className={`text-xs font-semibold tabular-nums ${cfg.labelColor}`}>
          {formatXp(entry.amount)} XP
        </span>
      </div>

      {/* Podium block */}
      <div
        className={`w-20 sm:w-24 ${cfg.height} ${cfg.blockBg} ${cfg.glowClass} rounded-t-lg flex items-start justify-center pt-2`}
      >
        <span className="text-xs font-bold text-white/90">{cfg.rankLabel}</span>
      </div>
    </div>
  );
}

// ── Leaderboard Row (rank 4+) ───────────────────────────────────────────────

interface LeaderboardRowProps {
  entry: TokenHolder;
  idx: number;
  isMe: boolean;
  streak?: number;
  profileName?: string;
  profileAvatar?: string;
}

function getRankColor(idx: number): string {
  if (idx === 0) return "text-yellow-600 dark:text-yellow-500 font-bold";
  if (idx === 1) return "text-slate-500 dark:text-slate-400 font-bold";
  if (idx === 2) return "text-amber-700 dark:text-amber-600 font-bold";
  if (idx < 5)  return "text-primary/80 font-semibold";
  if (idx < 10) return "text-primary/50 font-medium";
  return "text-muted-foreground";
}

function getRowLeftBorder(idx: number): string {
  if (idx < 3)  return "border-l-2 border-l-yellow-500/60";
  if (idx < 5)  return "border-l-2 border-l-primary/40";
  if (idx < 10) return "border-l-2 border-l-primary/20";
  return "border-l-2 border-l-transparent";
}

const LeaderboardRow = memo(function LeaderboardRow({ entry, idx, isMe, streak, profileName, profileAvatar }: LeaderboardRowProps) {
  const t = useTranslations("leaderboard");
  const avatarGradient = getAvatarGradient(entry.owner);
  const avatarLabel = entry.owner.slice(0, 2).toUpperCase();
  const level = getLevel(entry.amount);
  const displayName = isMe && profileName ? profileName : null;

  const isTop3 = idx < 3;
  const evenRow = idx % 2 === 0;

  return (
    <div
      role="row"
      style={{ animationDelay: `${Math.min(idx * 30, 300)}ms` }}
      className={[
        "row-animate flex items-center gap-2 sm:gap-4 px-3 sm:px-6 py-3.5 transition-colors",
        getRowLeftBorder(idx),
        isTop3
          ? "bg-primary/5"
          : evenRow
          ? "bg-background"
          : "bg-muted/20",
        isMe
          ? "my-row-pulse"
          : "hover:bg-muted/30",
      ].join(" ")}
    >
      {/* Rank */}
      <div role="cell" className={`flex w-8 items-center justify-center shrink-0 text-sm ${getRankColor(idx)}`}>
        {idx + 1}
      </div>

      {/* Avatar */}
      <div role="cell" aria-hidden="true" className="shrink-0">
        <Avatar className="h-8 w-8">
          {isMe && profileAvatar && <AvatarImage src={profileAvatar} alt={profileName || entry.owner} />}
          <AvatarFallback
            className="text-xs font-bold text-white"
            style={{ background: avatarGradient }}
          >
            {avatarLabel}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Name / Address */}
      <div role="cell" className="flex flex-1 items-center gap-2 min-w-0">
        {displayName ? (
          <div className="min-w-0">
            <span className="block truncate text-sm font-medium">
              {displayName}
            </span>
            <span className="block truncate font-mono text-xs text-muted-foreground">
              {truncateAddress(entry.owner, 6)}
            </span>
          </div>
        ) : (
          <span className="truncate font-mono text-sm">
            {truncateAddress(entry.owner, 6)}
          </span>
        )}
        {isMe && (
          <Badge variant="secondary" className="shrink-0 text-xs">
            {t("you")}
          </Badge>
        )}
        {isMe && streak !== undefined && streak > 0 && (
          <span
            className="flex shrink-0 items-center gap-0.5 text-xs font-medium text-orange-500"
            title={t("streakDays", { count: streak })}
          >
            <Flame className="h-3.5 w-3.5" aria-hidden="true" />
            {streak}
          </span>
        )}
      </div>

      {/* Level + XP */}
      <div role="cell" className="flex shrink-0 items-center gap-1.5 sm:gap-3">
        <Badge variant="outline" className={`text-xs sm:text-sm ${isTop3 ? "border-primary/40 text-primary" : ""}`}>
          {t("level")} {level}
        </Badge>
        <span className={`font-medium tabular-nums text-xs sm:text-sm whitespace-nowrap ${isTop3 ? "text-foreground" : "text-muted-foreground"}`}>
          {formatXp(entry.amount)} XP
        </span>
      </div>
    </div>
  );
});

// ── Main Leaderboard Component ─────────────────────────────────────────────

interface LeaderboardProps {
  initialEntries?: TokenHolder[];
  courses?: { slug: string; title: string }[];
}

export function Leaderboard({ initialEntries = [], courses = [] }: LeaderboardProps) {
  const t = useTranslations("leaderboard");
  const { publicKey } = useWallet();
  const streakDays = useProgressStore((s) => s.streakDays);
  const { profileName, profileAvatar } = useProfileData();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read initial timeframe from URL (?tab=weekly|monthly|allTime)
  const urlTab = searchParams.get("tab") as TimeFilter | null;
  const validTabs: TimeFilter[] = ["allTime", "monthly", "weekly"];
  const initialTab: TimeFilter =
    urlTab && validTabs.includes(urlTab) ? urlTab : "allTime";

  const [holders, setHolders] = useState<TokenHolder[]>(
    initialTab === "allTime" ? initialEntries : []
  );
  const [loading, setLoading] = useState(initialTab !== "allTime");
  const [refreshing, setRefreshing] = useState(false);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>(initialTab);
  const [courseFilter, setCourseFilter] = useState<string>("all");

  /** Update URL when tab changes without triggering a full navigation. */
  const handleTabChange = useCallback(
    (filter: TimeFilter) => {
      setTimeFilter(filter);
      const params = new URLSearchParams(searchParams.toString());
      if (filter === "allTime") {
        params.delete("tab");
      } else {
        params.set("tab", filter);
      }
      const query = params.toString();
      router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  const fetchLeaderboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const res = await fetch(`/api/helius/leaderboard?timeframe=${timeFilter}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: TokenHolder[] = await res.json();
      setHolders(data);
    } catch (err) {
      logger.error("[Leaderboard] Failed to fetch leaderboard:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [timeFilter]);

  useEffect(() => {
    if (initialEntries.length === 0 || timeFilter !== "allTime") {
      fetchLeaderboard(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeFilter]);

  const top3 = holders.slice(0, 3) as TokenHolder[];
  const rest = holders.slice(3);

  // Compute total platform XP for the header counter
  const totalXp = holders.reduce((sum, h) => sum + h.amount, 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">

      {/* ── Header ── */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchLeaderboard(true)}
          disabled={refreshing}
          aria-label={t("refresh")}
          className="shrink-0 gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} aria-hidden="true" />
          <span className="hidden sm:inline">{t("refresh")}</span>
        </Button>
      </div>

      {/* ── Total XP Counter ── */}
      {!loading && totalXp > 0 && (
        <div className="mb-8 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 rounded-xl border border-yellow-500/20 bg-gradient-to-r from-yellow-500/5 via-amber-500/5 to-yellow-500/5 px-4 sm:px-6 py-3 sm:py-4 animate-fade-in">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500 dark:text-yellow-400 shrink-0" aria-hidden="true" />
            <span className="text-sm text-muted-foreground">Total Platform XP Earned</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="xp-counter-glow font-mono text-2xl font-bold text-yellow-500 dark:text-yellow-400 tabular-nums">
              {formatXp(totalXp)}
            </span>
            <span className="text-sm font-medium text-yellow-600/70 dark:text-yellow-500/70">XP</span>
          </div>
        </div>
      )}

      {/* ── Filters row ── */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        {/* Time filter — pill tabs */}
        <div
          role="group"
          aria-label={t("timeFilter")}
          className="flex gap-1 rounded-lg border border-border bg-muted/40 p-1 overflow-x-auto"
        >
          {(["allTime", "monthly", "weekly"] as TimeFilter[]).map((filter) => (
            <button
              key={filter}
              role="tab"
              aria-selected={timeFilter === filter}
              onClick={() => handleTabChange(filter)}
              className={[
                "rounded-md px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap",
                timeFilter === filter
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              {t(`filters.${filter}`)}
            </button>
          ))}
        </div>

        {/* Course filter — select dropdown */}
        {courses.length > 0 && (
          <Select value={courseFilter} onValueChange={setCourseFilter}>
            <SelectTrigger
              aria-label={t("courseFilter")}
              className="h-9 w-full sm:w-[180px] border-border bg-muted/40 text-sm"
            >
              <SelectValue placeholder={t("filters.allCourses")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filters.allCourses")}</SelectItem>
              {courses.map((course) => (
                <SelectItem key={course.slug} value={course.slug}>
                  {course.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Filter notes */}
      {timeFilter !== "allTime" && (
        <p className="mb-4 flex items-center gap-1.5 rounded-md border border-border/50 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          <Info className="h-3 w-3 shrink-0" aria-hidden="true" />
          {t("cumulativeNote")}
        </p>
      )}
      {courseFilter !== "all" && (
        <p className="mb-4 flex items-center gap-1.5 rounded-md border border-border/50 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          <Info className="h-3 w-3 shrink-0" aria-hidden="true" />
          {t("courseFilterNote")}
        </p>
      )}

      {/* ── Loading State ── */}
      {loading ? (
        <div>
          {/* Podium skeleton */}
          <div className="mb-8 flex items-end justify-center gap-4 px-4">
            {[1, 0, 2].map((i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <Skeleton className="h-14 w-14 rounded-full" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className={`w-24 ${i === 0 ? "h-36" : i === 1 ? "h-24" : "h-16"} rounded-t-lg`} />
              </div>
            ))}
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2 sm:gap-4 px-3 sm:px-6 py-4">
                    <Skeleton className="h-5 w-8 shrink-0" />
                    <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                    <Skeleton className="h-4 flex-1 min-w-0" />
                    <Skeleton className="h-6 w-16 sm:w-24 shrink-0" />
                    <Skeleton className="h-4 w-12 sm:w-16 shrink-0 hidden sm:block" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : holders.length === 0 ? (

        /* ── Empty State ── */
        <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
          <div className="animate-empty-float rounded-full bg-muted p-6 mb-4">
            <Star className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {timeFilter === "allTime" ? t("empty") : t("emptyPeriod")}
          </h3>
          <p className="text-muted-foreground max-w-md">
            {timeFilter === "allTime"
              ? t("emptyDescription")
              : t("emptyPeriodDescription")}
          </p>
        </div>
      ) : (
        <div>

          {/* ── Podium (top 3) ── */}
          {top3.length > 0 && (
            <div
              className="mb-10 flex items-end justify-center gap-2 sm:gap-4 px-2 sm:px-4"
              aria-label="Top 3 podium"
              role="region"
            >
              {top3.length >= 2 && (
                <PodiumEntry
                  entry={top3[1]!}
                  rank={2}
                  isMe={!!(publicKey && top3[1]!.owner === publicKey.toBase58())}
                  profileName={profileName}
                  profileAvatar={profileAvatar}
                />
              )}
              {top3.length >= 1 && (
                <PodiumEntry
                  entry={top3[0]!}
                  rank={1}
                  isMe={!!(publicKey && top3[0]!.owner === publicKey.toBase58())}
                  profileName={profileName}
                  profileAvatar={profileAvatar}
                />
              )}
              {top3.length >= 3 && (
                <PodiumEntry
                  entry={top3[2]!}
                  rank={3}
                  isMe={!!(publicKey && top3[2]!.owner === publicKey.toBase58())}
                  profileName={profileName}
                  profileAvatar={profileAvatar}
                />
              )}
            </div>
          )}

          {/* ── Top 3 in list (always shown in table too, for completeness) ── */}
          <Card>
            <CardContent className="p-0" aria-live="polite" aria-atomic="false">
              <div role="table" aria-label={t("title")} className="divide-y divide-border/50">
                <div role="rowgroup">
                  <div role="row" className="sr-only">
                    <div role="columnheader">{t("rank")}</div>
                    <div role="columnheader">{t("address")}</div>
                    <div role="columnheader">{t("level")}</div>
                    <div role="columnheader">{t("xp")}</div>
                  </div>
                </div>
                <div role="rowgroup">
                  {/* Top 3 rows */}
                  {top3.map((entry, idx) => {
                    const isMe = !!(publicKey && entry.owner === publicKey.toBase58());
                    return (
                      <LeaderboardRow
                        key={entry.owner}
                        entry={entry}
                        idx={idx}
                        isMe={isMe}
                        streak={isMe ? streakDays : undefined}
                        profileName={profileName}
                        profileAvatar={profileAvatar}
                      />
                    );
                  })}

                  {/* Divider between podium entries and rest */}
                  {rest.length > 0 && (
                    <div className="flex items-center gap-3 px-6 py-2 bg-muted/10">
                      <div className="h-px flex-1 bg-border/40" />
                      <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60">
                        Rank 4+
                      </span>
                      <div className="h-px flex-1 bg-border/40" />
                    </div>
                  )}

                  {/* Rank 4+ rows */}
                  {rest.map((entry, i) => {
                    const idx = i + 3;
                    const isMe = !!(publicKey && entry.owner === publicKey.toBase58());
                    return (
                      <LeaderboardRow
                        key={entry.owner}
                        entry={entry}
                        idx={idx}
                        isMe={isMe}
                        streak={isMe ? streakDays : undefined}
                        profileName={profileName}
                        profileAvatar={profileAvatar}
                      />
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  );
}
