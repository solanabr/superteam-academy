"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";
import {
  BookOpen,
  BookMarked,
  Library,
  GraduationCap,
  Trophy,
  Flame,
  Zap,
  Crown,
  Code,
  Terminal,
  GitBranch,
  MessageSquare,
  Heart,
  Star,
  Timer,
  Lock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ACHIEVEMENT_DEFINITIONS,
  CATEGORIES,
  isAchievementUnlocked,
  type AchievementCategory,
  type AchievementDefinition,
} from "@/lib/gamification/achievements";

// Map icon names to Lucide components
const ICON_MAP: Record<string, React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>> = {
  BookOpen,
  BookMarked,
  Library,
  GraduationCap,
  Trophy,
  Flame,
  Zap,
  Crown,
  Code,
  Terminal,
  GitBranch,
  MessageSquare,
  Heart,
  Star,
  Timer,
};

// Category background colors for unlocked badges
const CATEGORY_BG: Record<AchievementCategory, string> = {
  progress: "from-blue-500/20 to-blue-500/5 border-blue-500/30",
  streaks: "from-orange-500/20 to-orange-500/5 border-orange-500/30",
  skills: "from-green-500/20 to-green-500/5 border-green-500/30",
  community: "from-purple-500/20 to-purple-500/5 border-purple-500/30",
  special: "from-yellow-500/20 to-yellow-500/5 border-yellow-500/30",
};

const CATEGORY_GLOW: Record<AchievementCategory, string> = {
  progress: "drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]",
  streaks: "drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]",
  skills: "drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]",
  community: "drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]",
  special: "drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]",
};

const CATEGORY_HEADER_ACCENT: Record<AchievementCategory, string> = {
  progress: "bg-blue-500",
  streaks: "bg-orange-500",
  skills: "bg-green-500",
  community: "bg-purple-500",
  special: "bg-yellow-500",
};

interface BadgeTileProps {
  achievement: AchievementDefinition;
  unlocked: boolean;
}

const BadgeTile = memo(function BadgeTile({ achievement, unlocked }: BadgeTileProps) {
  const t = useTranslations("achievements");
  const IconComponent = ICON_MAP[achievement.icon];
  const categoryColor = CATEGORIES.find((c) => c.key === achievement.category)?.color ?? "text-primary";

  return (
    <div
      className={cn(
        "relative flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all duration-200",
        unlocked
          ? cn(
              "bg-gradient-to-br",
              CATEGORY_BG[achievement.category],
              "hover:scale-[1.02] hover:shadow-lg"
            )
          : "border-border/30 bg-muted/20 opacity-50 grayscale"
      )}
      aria-label={
        unlocked
          ? t("unlocked")
          : t("locked")
      }
    >
      {/* Lock overlay for locked badges */}
      {!unlocked && (
        <div className="absolute right-2 top-2">
          <Lock className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
        </div>
      )}

      {/* Icon */}
      <div
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full",
          unlocked ? "bg-background/60" : "bg-muted/40"
        )}
      >
        {IconComponent && (
          <IconComponent
            className={cn(
              "h-6 w-6",
              unlocked ? cn(categoryColor, CATEGORY_GLOW[achievement.category]) : "text-muted-foreground"
            )}
            aria-hidden="true"
          />
        )}
      </div>

      {/* Name */}
      <p className={cn("text-xs font-semibold leading-tight", unlocked ? "" : "text-muted-foreground")}>
        {t(`badges.${achievement.id}.name` as never)}
      </p>

      {/* Description */}
      <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
        {t(`badges.${achievement.id}.description` as never)}
      </p>

      {/* XP reward */}
      {unlocked && (
        <Badge variant="outline" className={cn("mt-auto text-[10px] px-1.5 py-0", categoryColor)}>
          +{achievement.xpReward} {t("xpReward")}
        </Badge>
      )}
    </div>
  );
});

interface AchievementBadgesProps {
  unlockedBitmap?: bigint;
  compact?: boolean;
}

export const AchievementBadges = memo(function AchievementBadges({ unlockedBitmap = 0n, compact = false }: AchievementBadgesProps) {
  const t = useTranslations("achievements");

  const unlockedCount = ACHIEVEMENT_DEFINITIONS.filter((a) =>
    isAchievementUnlocked(unlockedBitmap, a.bitmapIndex)
  ).length;

  return (
    <div className="space-y-6">
      {/* Header summary */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Badge variant="secondary" className="shrink-0">
          {unlockedCount}/{ACHIEVEMENT_DEFINITIONS.length}
        </Badge>
      </div>

      {/* Categories */}
      {CATEGORIES.map(({ key, color }) => {
        const badges = ACHIEVEMENT_DEFINITIONS.filter((a) => a.category === key);
        const categoryUnlocked = badges.filter((a) =>
          isAchievementUnlocked(unlockedBitmap, a.bitmapIndex)
        ).length;

        return (
          <div key={key}>
            {/* Category header */}
            <div className="mb-3 flex items-center gap-2">
              <div className={cn("h-3 w-1 rounded-full", CATEGORY_HEADER_ACCENT[key])} aria-hidden="true" />
              <h3 className={cn("text-sm font-semibold capitalize", color)}>
                {t(`categories.${key}` as never)}
              </h3>
              <span className="text-xs text-muted-foreground">
                ({categoryUnlocked}/{badges.length})
              </span>
            </div>

            {/* Badge grid */}
            <div
              className={cn(
                "grid gap-3",
                compact
                  ? "grid-cols-3 sm:grid-cols-5"
                  : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
              )}
            >
              {badges.map((achievement) => (
                <BadgeTile
                  key={achievement.id}
                  achievement={achievement}
                  unlocked={isAchievementUnlocked(unlockedBitmap, achievement.bitmapIndex)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
});
