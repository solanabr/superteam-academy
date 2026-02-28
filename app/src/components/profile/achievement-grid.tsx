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
          {t("achievementsCount", { claimed: claimedCount, total: achievements.length })}
        </span>
      </div>
      {achievements.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {achievements.map((achievement) => {
            const unlocked = achievement.claimed;
            return (
              <div
                key={achievement.id}
                title={achievement.description}
                className={cn(
                  "group relative flex flex-col items-center rounded-xl border p-3 text-center transition-all",
                  unlocked
                    ? "border-achievement/30 bg-achievement/5 hover:border-achievement/50"
                    : "border-white/5 bg-muted/30 opacity-50 grayscale"
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full",
                    unlocked
                      ? "bg-achievement/10 text-achievement"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <AchievementIcon name={achievement.icon} />
                </div>
                <p className="mt-2 text-xs font-semibold leading-tight">
                  {achievement.name}
                </p>
                <p
                  className={cn(
                    "mt-0.5 text-xs",
                    unlocked ? "text-xp" : "text-muted-foreground"
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
          illustration={<EmptyAchievementsIllustration className="h-full w-full" />}
          title={emptyMessage}
          compact
        />
      )}
    </section>
  );
}
