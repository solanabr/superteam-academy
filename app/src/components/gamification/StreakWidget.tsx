"use client";

import { cn } from "@/lib/utils";
import type { StreakData } from "@/types";

interface StreakWidgetProps {
  streak: StreakData;
  className?: string;
}

export function StreakWidget({ streak, className }: StreakWidgetProps) {
  const isHot = streak.currentStreak >= 7;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span
        className={cn(
          "text-xl transition-all",
          isHot && "drop-shadow-[0_0_8px_rgba(245,166,35,0.6)]"
        )}
      >
        🔥
      </span>
      <div className="font-mono">
        <span
          className={cn(
            "text-2xl font-bold",
            isHot ? "text-[#F5A623]" : "text-[#EDEDED]"
          )}
        >
          {streak.currentStreak}
        </span>
        <span className="text-xs text-[#666666] ml-1">
          {streak.currentStreak === 1 ? "day streak" : "day streak"}
        </span>
      </div>
    </div>
  );
}
