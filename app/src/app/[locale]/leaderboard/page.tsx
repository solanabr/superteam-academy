"use client";

import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { FilterBar } from "@/components/ui/filter-bar";
import { MarketplaceCard } from "@/components/ui/marketplace-card";
import { MarketplaceShell } from "@/components/ui/marketplace-shell";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";
import { PremiumEmptyState } from "@/components/ui/premium-empty-state";
import { SegmentedFilter } from "@/components/ui/segmented-filter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { courses } from "@/lib/data/courses";
import { useLeaderboard } from "@/lib/hooks/use-leaderboard";
import { cn } from "@/lib/utils";
import {
  Crown,
  Database,
  Eye,
  EyeOff,
  Flame,
  Info,
  Medal,
  Trophy,
  Zap,
} from "lucide-react";
import type { LeaderboardTimeframe } from "@/types";

function rankIcon(rank: number) {
  switch (rank) {
    case 1:
      return <Crown className="h-5 w-5 text-foreground" />;
    case 2:
      return <Medal className="h-5 w-5 text-muted-foreground" />;
    case 3:
      return <Medal className="h-5 w-5 text-foreground/80" />;
    default:
      return <span className="w-5 text-center text-sm font-medium text-muted-foreground">{rank}</span>;
  }
}

function rankRowClass(rank: number, isCurrentUser: boolean) {
  if (isCurrentUser) {
    return "border-border bg-muted/60";
  }

  if (rank <= 3) {
    return "border-border/70 bg-muted/40";
  }

  return "border-transparent";
}

export default function LeaderboardPage() {
  const t = useTranslations("leaderboard");
  const tc = useTranslations("common");
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const {
    entries,
    userRank,
    isLoading,
    error,
    timeframe,
    setTimeframe,
    courseSlug,
    setCourseSlug,
    onChainAvailable,
    showOnChain,
    setShowOnChain,
  } = useLeaderboard(50);
  const selectedCourse = courseSlug ?? "all";
  const selectedCourseMeta = courses.find((course) => course.slug === courseSlug);
  const effectiveShowOnChain = !courseSlug && showOnChain;

  const timeframes: Array<{ value: LeaderboardTimeframe; label: string }> = [
    { value: "alltime", label: t("allTime") },
    { value: "monthly", label: t("monthly") },
    { value: "weekly", label: t("weekly") },
  ];

  const loadingTable = (
    <div className="divide-y divide-border/60">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-4">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  );

  return (
    <PageShell
      hero={
        <PageHeader
          badge={{ variant: "brand", icon: Trophy, label: t("title") }}
          title={t("title")}
          description={t("subtitle")}
        />
      }
    >
      <MarketplaceShell
        filters={
          <div className="space-y-4">
            <MarketplaceCard accent>
              <CardContent className="space-y-3 p-5">
                <div className="text-sm font-medium text-foreground">{t("title")}</div>
                <SegmentedFilter
                  ariaLabel={t("title")}
                  value={timeframe}
                  onValueChange={(value) => setTimeframe(value as LeaderboardTimeframe)}
                  options={timeframes}
                />
              </CardContent>
            </MarketplaceCard>

            <MarketplaceCard accent>
              <CardContent className="space-y-3 p-5">
                <div className="text-sm font-medium text-foreground">Course</div>
                <Select
                  value={selectedCourse}
                  onValueChange={(value) => setCourseSlug(value === "all" ? null : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All courses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All courses</SelectItem>
                    {courses.map((course) => (
                      <SelectItem key={course.slug} value={course.slug}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Filter rankings by learner XP earned inside a specific course.
                </p>
              </CardContent>
            </MarketplaceCard>

            {userRank !== null && userRank > 0 ? (
              <MarketplaceCard>
                <CardContent className="flex items-center gap-3 p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border/70 bg-muted/40">
                    <Trophy className="h-5 w-5 text-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("yourRank")}</p>
                    <p className="text-2xl font-semibold text-foreground">#{userRank}</p>
                  </div>
                </CardContent>
              </MarketplaceCard>
            ) : null}

            <MarketplaceCard>
              <CardContent className="space-y-4 p-5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl border border-border/70 bg-muted/40">
                    <Database className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{t("showOnChain")}</p>
                    <p className="text-sm text-muted-foreground">{t("showOnChainDesc")}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowOnChain(!showOnChain)}
                  disabled={!onChainAvailable || !!courseSlug}
                  className="w-full justify-center gap-2 rounded-xl"
                >
                  {effectiveShowOnChain ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  {effectiveShowOnChain ? t("on") : t("off")}
                </Button>
                {courseSlug ? (
                  <div className="flex items-start gap-2 rounded-2xl border border-border/70 bg-muted/40 p-3 text-sm text-muted-foreground">
                    <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>On-chain balances stay global, so course filters show local per-course XP only.</span>
                  </div>
                ) : null}
                {!courseSlug && showOnChain && !onChainAvailable ? (
                  <div className="flex items-start gap-2 rounded-2xl border border-border/70 bg-muted/40 p-3 text-sm text-muted-foreground">
                    <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>{t("onChainUnavailable")}</span>
                  </div>
                ) : null}
              </CardContent>
            </MarketplaceCard>
          </div>
        }
        toolbar={
          <FilterBar
            sticky
            resultsSlot={t("learnerCount", { count: entries.length })}
            actionsSlot={
              <>
                {selectedCourseMeta ? (
                  <Badge variant="outline" className="border-border/70 bg-background/70 text-muted-foreground">
                    {selectedCourseMeta.title}
                  </Badge>
                ) : null}
                <Badge variant="outline" className="border-border/70 bg-background/70 text-muted-foreground">
                  {effectiveShowOnChain && onChainAvailable ? t("onChainLabel") : tc("xp")}
                </Badge>
              </>
            }
          />
        }
        content={
          <MarketplaceCard accent className="overflow-hidden">
            <div className="border-b border-border/70 bg-card px-4 py-4">
              <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground md:grid-cols-[auto_minmax(0,1fr)_auto_auto]">
                <span>{t("title")}</span>
                <span className="sr-only">{t("title")}</span>
                <span className="hidden md:inline">{tc("level")}</span>
                <span>{tc("xp")}</span>
              </div>
            </div>
            {isLoading ? (
              loadingTable
            ) : error ? (
              <PremiumEmptyState
                icon={Info}
                title={t("loadError")}
                description={t("subtitle")}
                className="m-4"
              />
            ) : entries.length === 0 ? (
              <PremiumEmptyState
                icon={Trophy}
                title={t("noData")}
                description={t("subtitle")}
                className="m-4"
              />
            ) : (
              <div className="divide-y divide-border/60 bg-card">
                {entries.map((entry) => {
                  const isCurrentUser = entry.userId === currentUserId;

                  return (
                    <div
                      key={entry.userId}
                      tabIndex={0}
                      className={cn(
                        "marketplace-card-hover grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border px-4 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 md:grid-cols-[auto_minmax(0,1fr)_auto_auto]",
                        rankRowClass(entry.rank, isCurrentUser)
                      )}
                    >
                      <div className="flex w-9 items-center justify-center">
                        {rankIcon(entry.rank)}
                      </div>
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar className="h-10 w-10 border border-border/70">
                          <AvatarImage src={entry.avatarUrl ?? undefined} />
                          <AvatarFallback className="bg-muted/40 text-xs">
                            {entry.username?.charAt(0).toUpperCase() ?? "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {entry.username}
                            {isCurrentUser ? (
                              <Badge variant="outline" className="marketplace-pill ms-2 text-[10px]">
                                {t("you")}
                              </Badge>
                            ) : null}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {tc("level")} {entry.level}
                          </p>
                        </div>
                      </div>
                      <div className="hidden items-center gap-3 text-sm md:flex">
                        {entry.currentStreak > 0 ? (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Flame className="h-4 w-4" />
                            {entry.currentStreak}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                        {effectiveShowOnChain && onChainAvailable ? (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Database className="h-4 w-4" />
                            {entry.onChainXP?.toLocaleString() ?? "—"}
                          </span>
                        ) : null}
                      </div>
                      <div className="flex items-center justify-end gap-1 text-sm font-medium text-foreground">
                        <Zap className="h-4 w-4 text-muted-foreground" />
                        <span>{entry.totalXP.toLocaleString()}</span>
                        <span className="text-xs font-normal text-muted-foreground">{tc("xp")}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </MarketplaceCard>
        }
      />
    </PageShell>
  );
}
