"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Trophy,
  Star,
  Flame,
  Crown,
  Medal,
  RefreshCw,
  Filter,
  Info
} from "lucide-react";
import { useLeaderboard } from "@/hooks/use-leaderboard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSession } from "next-auth/react";
import type { CourseCardData } from "@/types/course";

type Timeframe = "weekly" | "monthly" | "alltime";

interface LeaderboardViewProps {
  courses: CourseCardData[];
}

function formatRelativeTime(dateStr: string, t: (key: string, values?: Record<string, string | number | Date>) => string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.round(diffMs / (60 * 1000));
  if (diffMin < 1) return t("justNow");
  if (diffMin < 60) return t("minutesAgo", { count: diffMin });
  const diffHours = Math.round(diffMin / 60);
  if (diffHours < 24) return t("hoursAgo", { count: diffHours });
  return date.toLocaleDateString();
}

function getRankIcon(rank: number) {
  if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
  if (rank === 3) return <Medal className="h-5 w-5 text-amber-700" />;
  return (
    <span className="text-sm font-bold text-muted-foreground">#{rank}</span>
  );
}

export default function LeaderboardView({ courses }: LeaderboardViewProps) {
  const t = useTranslations("leaderboard");
  const tc = useTranslations("common");
  const { data: session } = useSession();

  const [timeframe, setTimeframe] = useState<Timeframe>("alltime");
  const [courseId, setCourseId] = useState<string>("all");

  const {
    entries,
    userRank,
    userEntry,
    lastSyncedAt,
    loading,
    refreshing,
    refresh
  } = useLeaderboard({
    timeframe,
    courseId: courseId === "all" ? undefined : courseId
  });

  const top3 = entries.slice(0, 3);
  const remaining = entries.slice(3);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header & Refresh */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="flex flex-col items-end gap-2 text-right">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={refresh}
            disabled={refreshing || !session}
            title={!session ? t("signInToRefresh") : ""}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {!session ? t("signInToRefresh") : t("refreshOnChain")}
          </Button>
          <div className="flex flex-col items-end space-y-1">
            {lastSyncedAt && (
              <p className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase tracking-wider">
                <Info className="h-3 w-3" />
                {t("lastSyncedOnChain", { date: formatRelativeTime(lastSyncedAt, t) })}
              </p>
            )}
            <p className="text-[9px] text-muted-foreground italic">
              {t("autoRefreshNotice")}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <Tabs
          value={timeframe}
          onValueChange={(v) => setTimeframe(v as Timeframe)}
          className="flex-1"
        >
          <TabsList>
            <TabsTrigger value="weekly">{t("weekly")}</TabsTrigger>
            <TabsTrigger value="monthly">{t("monthly")}</TabsTrigger>
            <TabsTrigger value="alltime">{t("allTime")}</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={courseId} onValueChange={setCourseId}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("allCourses")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allCourses")}</SelectItem>
              {courses.filter((c) => c.courseId).map((course) => (
                <SelectItem key={course.slug} value={course.courseId!}>
                  {course.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Current User Highlight */}
      {userRank > 0 && (
        <Card className="mb-6 border-primary/40 bg-primary/5">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
              <span className="font-bold text-primary">#{userRank}</span>
            </div>
            <div className="flex-1">
              <p className="font-semibold">{t("yourRank")}</p>
              <p className="text-sm text-muted-foreground">
                {userEntry?.totalXP.toLocaleString() ?? "???"} {tc("xp")} &middot; {tc("level")} {userEntry?.level ?? "?"}
              </p>
            </div>
            {userRank <= 10 && <Crown className="h-6 w-6 text-yellow-500" />}
          </CardContent>
        </Card>
      )}

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      ) : entries.length === 0 ? (
        <Card className="border-dashed py-20 text-center">
          <Trophy className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <p className="mt-4 text-muted-foreground">{t("noData")}</p>
        </Card>
      ) : (
        <>
          {/* Top 3 */}
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            {top3.map((entry) => (
              <Card
                key={entry.userId}
                className={
                  entry.rank === 1 ? "border-yellow-500/50 bg-yellow-500/5 shadow-lg shadow-yellow-500/5" : ""
                }
              >
                <CardContent className="flex flex-col items-center p-6 text-center">
                  {getRankIcon(entry.rank)}
                  <div className="group relative mt-3 h-16 w-16 overflow-hidden rounded-full border-2 border-primary/20 bg-primary/10">
                    {entry.avatarUrl ? (
                      <img
                        src={entry.avatarUrl}
                        alt={entry.displayName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-primary">
                        {entry.displayName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <p className="mt-2 line-clamp-1 font-semibold">{entry.displayName}</p>
                  <p className="text-xs text-muted-foreground">@{entry.username}</p>
                  <div className="mt-3 flex items-center gap-3">
                    <span className="flex items-center gap-1 text-sm font-medium">
                      <Star className="h-3.5 w-3.5 text-primary" />
                      {entry.totalXP.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1 text-sm font-medium">
                      <Flame className="h-3.5 w-3.5 text-orange-500" />
                      {entry.currentStreak}d
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Remaining entries */}
          <Card>
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-lg">{t("topLearners")}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {remaining.map((entry) => (
                  <div
                    key={entry.userId}
                    className={`flex items-center gap-4 p-4 transition-colors hover:bg-accent/50 ${entry.userId === session?.user?.id ? "bg-primary/5" : ""
                      }`}
                  >
                    <div className="flex h-8 w-8 items-center justify-center">
                      {getRankIcon(entry.rank)}
                    </div>
                    <div className="flex h-8 w-8 overflow-hidden items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {entry.avatarUrl ? (
                        <img
                          src={entry.avatarUrl}
                          alt={entry.displayName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        entry.displayName.charAt(0)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium">{entry.displayName}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        @{entry.username}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="hidden sm:flex items-center gap-1 text-muted-foreground">
                        <Star className="h-3.5 w-3.5" />
                        {entry.totalXP.toLocaleString()}
                      </div>
                      <div className="hidden sm:flex items-center gap-1 text-muted-foreground">
                        <Flame className="h-3.5 w-3.5" />
                        {entry.currentStreak}d
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {t("levelShort")} {entry.level}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
