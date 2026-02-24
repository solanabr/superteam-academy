"use client";

import { cn } from "@/lib/utils";
import { xpProgress } from "@/lib/constants";
import { Progress } from "@/components/ui/progress";

interface XPDisplayProps {
  xp: number;
  showLevel?: boolean;
  showProgress?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function XPDisplay({
  xp,
  showLevel = true,
  showProgress = false,
  size = "md",
  className,
}: XPDisplayProps) {
  const { level, nextLevelXp } = xpProgress(xp);

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex items-center gap-2">
        {showLevel && (
          <span
            className={cn(
              "inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground font-bold",
              size === "sm" && "h-5 w-5 text-[10px]",
              size === "md" && "h-6 min-w-6 px-1 text-xs",
              size === "lg" && "h-8 min-w-8 px-1.5 text-sm"
            )}
          >
            {level}
          </span>
        )}
        <span
          className={cn(
            "font-semibold tabular-nums",
            size === "sm" && "text-xs",
            size === "md" && "text-sm",
            size === "lg" && "text-lg"
          )}
        >
          {xp.toLocaleString()} XP
        </span>
      </div>
      {showProgress && (
        <div className="mt-1.5 space-y-1">
          <Progress value={(xp / nextLevelXp) * 100} className="h-1.5" />
          <p className="text-[10px] text-muted-foreground">
            {xp.toLocaleString()} / {nextLevelXp.toLocaleString()} XP to level {level + 1}
          </p>
        </div>
      )}
    </div>
  );
}
