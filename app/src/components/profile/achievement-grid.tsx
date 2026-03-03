"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { AchievementIcon } from "@/components/gamification";
import { EmptyState } from "@/components/ui/empty-state";
import { EmptyAchievementsIllustration } from "@/components/icons";
import type { Achievement } from "@/types";

interface AchievementGridProps {
  achievements: Achievement[];
  claimedCount: number;
  title: string;
  emptyMessage: string;
}

export function AchievementGrid({
  achievements,
  claimedCount,
  title,
  emptyMessage,
}: AchievementGridProps) {
  const t = useTranslations("profile");
  return (
    <section className="glass rounded-2xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">{title}</h2>
        <span className="text-sm text-muted-foreground">
          {t("achievementsCount", {
            claimed: claimedCount,
            total: achievements.length,
          })}
        </span>
      </div>
      {achievements.length > 0 ? (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {achievements.map((achievement) => {
            const unlocked = achievement.claimed;
            return (
              <div
                key={achievement.id}
                className={cn(
                  "group relative flex flex-col items-center rounded-xl border p-3 text-center transition-all",
                  unlocked
                    ? "border-achievement/30 bg-achievement/5 hover:border-achievement/50"
                    : "cursor-default border-dashed border-muted-foreground/25 bg-muted/20",
                )}
              >
                {/* Hover preview tooltip for locked badges */}
                {!unlocked && (
                  <div className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-50 w-44 -translate-x-1/2 scale-95 rounded-lg border border-white/10 bg-card px-3 py-2.5 text-left opacity-0 shadow-xl transition-all duration-150 group-hover:scale-100 group-hover:opacity-100">
                    <p className="mb-1 text-xs font-semibold text-foreground">
                      {achievement.name}
                    </p>
                    <p className="text-[11px] leading-snug text-muted-foreground">
                      {achievement.description}
                    </p>
                    <div className="mt-2 flex items-center gap-1">
                      <span className="rounded-full bg-xp/10 px-2 py-0.5 text-[10px] font-medium text-xp">
                        +{achievement.xpReward} XP
                      </span>
                    </div>
                    {/* Arrow */}
                    <div className="absolute -bottom-[5px] left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-45 border-b border-r border-white/10 bg-card" />
                  </div>
                )}

                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-full",
                    unlocked
                      ? "bg-achievement/10 text-achievement"
                      : "border-2 border-dashed border-muted-foreground/30 bg-muted/30",
                  )}
                >
                  <AchievementIcon
                    name={achievement.icon}
                    className={cn(
                      "h-5 w-5",
                      unlocked
                        ? "text-achievement"
                        : "text-muted-foreground/40",
                    )}
                  />
                </div>

                <p
                  className={cn(
                    "mt-2 w-full truncate text-xs font-semibold leading-tight",
                    unlocked ? "text-foreground" : "text-muted-foreground/60",
                  )}
                >
                  {achievement.name}
                </p>

                <p
                  className={cn(
                    "mt-0.5 text-[10px]",
                    unlocked ? "text-xp" : "text-muted-foreground/40",
                  )}
                >
                  +{achievement.xpReward} XP
                </p>

                {unlocked && (
                  <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-achievement text-[10px] font-bold text-white">
                    &#10003;
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          illustration={
            <EmptyAchievementsIllustration className="h-full w-full" />
          }
          title={emptyMessage}
          compact
        />
      )}
    </section>
  );
}
