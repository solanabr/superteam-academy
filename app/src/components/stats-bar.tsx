"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { calculateLevel } from "@/types/gamification";
import { Star, Zap, Flame, Trophy } from "lucide-react";

interface StatsBarProps {
  xp: number;
  streak: number;
  coursesCompleted: number;
  /** true while XP / streak are still loading */
  loadingStats: boolean;
  /** true while courses completed count is still loading */
  loadingCourses: boolean;
  /** "cards" layout (dashboard) or "compact" layout (profile) */
  variant?: "cards" | "compact";
}

export function StatsBar({
  xp,
  streak,
  coursesCompleted,
  loadingStats,
  loadingCourses,
  variant = "cards",
}: StatsBarProps) {
  const tc = useTranslations("common");
  const td = useTranslations("dashboard");
  const tp = useTranslations("profile");

  const levelInfo = calculateLevel(xp);

  if (variant === "compact") {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-border p-3 text-center">
          {loadingStats ? (
            <Skeleton className="mx-auto h-8 w-16 mb-1" />
          ) : (
            <p className="text-2xl font-bold text-primary">
              {xp.toLocaleString()}
            </p>
          )}
          <p className="text-xs text-muted-foreground">{tc("xp")}</p>
        </div>
        <div className="rounded-lg border border-border p-3 text-center">
          {loadingStats ? (
            <Skeleton className="mx-auto h-8 w-20 mb-1" />
          ) : (
            <>
              <p className="text-2xl font-bold">
                {tc("level")} {levelInfo.level}
              </p>
              <p className="text-xs text-muted-foreground">
                {Math.round(levelInfo.progress * 100)}% {tp("toNextLevel")}
              </p>
            </>
          )}
          {loadingStats && <p className="text-xs text-muted-foreground">&nbsp;</p>}
        </div>
        <div className="rounded-lg border border-border p-3 text-center">
          {loadingStats ? (
            <Skeleton className="mx-auto h-8 w-8 mb-1" />
          ) : (
            <p className="text-2xl font-bold">{streak}</p>
          )}
          <p className="text-xs text-muted-foreground">
            {tc("streak")} ({tc("days")})
          </p>
        </div>
        <div className="rounded-lg border border-border p-3 text-center">
          {loadingCourses ? (
            <Skeleton className="mx-auto h-8 w-8 mb-1" />
          ) : (
            <p className="text-2xl font-bold">{coursesCompleted}</p>
          )}
          <p className="text-xs text-muted-foreground">{tc("completed")}</p>
        </div>
      </div>
    );
  }

  // "cards" variant — dashboard style
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Star className="h-6 w-6 text-primary" />
          </div>
          <div>
            {loadingStats ? (
              <Skeleton className="h-7 w-20 mb-1" />
            ) : (
              <p className="text-2xl font-bold">{xp.toLocaleString()}</p>
            )}
            <p className="text-xs text-muted-foreground">{td("totalXP")}</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gold/10">
            <Zap className="h-6 w-6 text-gold" />
          </div>
          <div>
            {loadingStats ? (
              <Skeleton className="h-7 w-20 mb-1" />
            ) : (
              <p className="text-2xl font-bold">{tc("level")} {levelInfo.level}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {loadingStats ? "\u00A0" : `${Math.round(levelInfo.progress * 100)}% ${tp("toNextLevel")}`}
            </p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-500/10">
            <Flame className="h-6 w-6 text-orange-500" />
          </div>
          <div>
            {loadingStats ? (
              <Skeleton className="h-7 w-12 mb-1" />
            ) : (
              <p className="text-2xl font-bold">{streak}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {tc("streak")} ({tc("days")})
            </p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-brand/10">
            <Trophy className="h-6 w-6 text-green-brand" />
          </div>
          <div>
            {loadingCourses ? (
              <Skeleton className="h-7 w-8 mb-1" />
            ) : (
              <p className="text-2xl font-bold">{coursesCompleted}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {td("coursesCompleted")}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
