"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Lock } from "lucide-react";
import type { Achievement } from "@/types";

interface AchievementCardProps {
  achievement: Achievement;
  size?: "sm" | "md";
  className?: string;
}

const categoryColors: Record<string, string> = {
  progress: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  streak: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
  skill: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400",
  community: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
  special: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
};

export function AchievementCard({
  achievement,
  size = "md",
  className,
}: AchievementCardProps) {
  const progressPercent =
    achievement.maxProgress && achievement.progress
      ? Math.min((achievement.progress / achievement.maxProgress) * 100, 100)
      : achievement.isEarned
        ? 100
        : 0;

  return (
    <div
      className={cn(
        "group relative rounded-xl border bg-card transition-all",
        achievement.isEarned
          ? "border-primary/20 shadow-sm"
          : "opacity-60 hover:opacity-80",
        size === "sm" && "p-3",
        size === "md" && "p-4",
        className
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={cn(
            "flex items-center justify-center rounded-lg shrink-0",
            achievement.isEarned
              ? "bg-primary/10"
              : "bg-muted",
            size === "sm" && "h-10 w-10",
            size === "md" && "h-12 w-12"
          )}
        >
          {achievement.iconUrl ? (
            <span className={cn(size === "sm" ? "text-lg" : "text-2xl")}>
              {achievement.iconUrl}
            </span>
          ) : achievement.isEarned ? (
            <CheckCircle2
              className={cn(
                "text-primary",
                size === "sm" ? "h-5 w-5" : "h-6 w-6"
              )}
            />
          ) : (
            <Lock
              className={cn(
                "text-muted-foreground",
                size === "sm" ? "h-4 w-4" : "h-5 w-5"
              )}
            />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <p
              className={cn(
                "font-semibold truncate",
                size === "sm" ? "text-sm" : "text-base"
              )}
            >
              {achievement.name}
            </p>
            {achievement.isEarned && (
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
            )}
          </div>

          <p
            className={cn(
              "text-muted-foreground line-clamp-2",
              size === "sm" ? "text-xs" : "text-sm"
            )}
          >
            {achievement.description}
          </p>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="secondary"
              className={cn(
                "text-[10px] px-1.5 py-0",
                categoryColors[achievement.category]
              )}
            >
              {achievement.category}
            </Badge>
            {achievement.xpReward > 0 && (
              <span className="text-[10px] font-medium text-muted-foreground">
                +{achievement.xpReward} XP
              </span>
            )}
          </div>

          {/* Progress bar for unearned */}
          {!achievement.isEarned && achievement.maxProgress && (
            <div className="pt-1 space-y-0.5">
              <Progress value={progressPercent} className="h-1" />
              <p className="text-[10px] text-muted-foreground">
                {achievement.progress ?? 0}/{achievement.maxProgress}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
