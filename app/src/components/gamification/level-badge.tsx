"use client";

import { TrendingUp } from "lucide-react";
import { cn, xpProgress, formatXP } from "@/lib/utils";

interface LevelBadgeProps {
  xp: number;
  size?: "sm" | "md" | "lg";
  showProgress?: boolean;
  className?: string;
}

export function LevelBadge({ xp, size = "md", showProgress = false, className }: LevelBadgeProps) {
  const progress = xpProgress(xp);

  const sizeConfig = {
    sm: { ring: "h-8 w-8", text: "text-xs", icon: "h-3 w-3", strokeWidth: 2 },
    md: { ring: "h-10 w-10", text: "text-sm", icon: "h-4 w-4", strokeWidth: 2.5 },
    lg: { ring: "h-14 w-14", text: "text-lg", icon: "h-5 w-5", strokeWidth: 3 },
  };

  const config = sizeConfig[size];
  const circumference = 2 * Math.PI * 18;
  const dashOffset = circumference - (progress.progress / 100) * circumference;

  return (
    <div className={cn("inline-flex flex-col items-center gap-1", className)}>
      <div className={cn("relative flex items-center justify-center", config.ring)}>
        {/* Background circle */}
        <svg className="absolute inset-0" viewBox="0 0 40 40">
          <circle
            cx="20"
            cy="20"
            r="18"
            fill="none"
            stroke="currentColor"
            strokeWidth={config.strokeWidth}
            className="text-muted"
          />
          <circle
            cx="20"
            cy="20"
            r="18"
            fill="none"
            stroke="currentColor"
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="text-level transition-all duration-700"
            transform="rotate(-90 20 20)"
          />
        </svg>
        <span className={cn("font-bold text-level", config.text)}>
          {progress.level}
        </span>
      </div>
      {showProgress && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <TrendingUp className={config.icon} />
          <span>
            {formatXP(xp - progress.currentLevelXp)}/{formatXP(progress.nextLevelXp - progress.currentLevelXp)}
          </span>
        </div>
      )}
    </div>
  );
}
