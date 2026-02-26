"use client";

import { cn } from "@/lib/utils";
import { LevelRing } from "./level-ring";
import { XPDisplay } from "@/components/shared";
import { Trophy, Flame } from "lucide-react";

interface GamificationStatsProps {
  xp: number;
  streak: number;
  achievementsEarned: number;
  achievementsTotal: number;
  className?: string;
}

export function GamificationStats({
  xp,
  streak,
  achievementsEarned,
  achievementsTotal,
  className,
}: GamificationStatsProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 sm:gap-6 flex-wrap",
        className
      )}
    >
      {/* Level ring */}
      <LevelRing xp={xp} size={56} />

      {/* XP */}
      <div className="space-y-0.5">
        <XPDisplay xp={xp} showLevel={false} size="lg" />
        <XPDisplay xp={xp} showLevel={false} showProgress size="sm" />
      </div>

      {/* Streak */}
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-orange-100 dark:bg-orange-950">
          <Flame className="h-5 w-5 text-orange-500" />
        </div>
        <div>
          <p className="text-lg font-bold leading-none">{streak}</p>
          <p className="text-[10px] text-muted-foreground">day streak</p>
        </div>
      </div>

      {/* Achievements */}
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-yellow-100 dark:bg-yellow-950">
          <Trophy className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
        </div>
        <div>
          <p className="text-lg font-bold leading-none">
            {achievementsEarned}
            <span className="text-xs font-normal text-muted-foreground">
              /{achievementsTotal}
            </span>
          </p>
          <p className="text-[10px] text-muted-foreground">achievements</p>
        </div>
      </div>
    </div>
  );
}
