"use client";

import { Zap } from "lucide-react";
import {
  calculateLevel,
  xpForLevel,
  xpProgressInLevel,
} from "@/config/constants";
import { Progress } from "@/components/ui/progress";

interface XpBadgeProps {
  xp: number;
  showProgress?: boolean;
  size?: "sm" | "md" | "lg";
}

export function XpBadge({ xp, showProgress = false, size = "md" }: XpBadgeProps) {
  const level = calculateLevel(xp);
  const progressPercent = xpProgressInLevel(xp);
  const nextLevelXp = xpForLevel(level + 1);
  const currentLevelXp = xpForLevel(level);
  const xpInLevel = xp - currentLevelXp;
  const xpNeeded = nextLevelXp - currentLevelXp;

  const sizeClasses = {
    sm: "text-xs gap-1 px-2 py-0.5",
    md: "text-sm gap-1.5 px-3 py-1",
    lg: "text-base gap-2 px-4 py-1.5",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <div className="inline-flex flex-col items-center gap-1">
      <div
        className={`inline-flex items-center rounded-full bg-violet-500/10 font-medium text-violet-500 ${sizeClasses[size]}`}
      >
        <Zap className={iconSizes[size]} />
        <span>{xp.toLocaleString()} XP</span>
        <span className="text-violet-400/70 ml-1">Lv.{level}</span>
      </div>
      {showProgress && (
        <div className="w-full max-w-[200px] space-y-1">
          <Progress value={progressPercent} className="h-1.5 bg-violet-500/10" />
          <p className="text-[10px] text-muted-foreground text-center">
            {xpInLevel}/{xpNeeded} XP to Level {level + 1}
          </p>
        </div>
      )}
    </div>
  );
}
