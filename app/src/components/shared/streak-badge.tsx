"use client";

import { cn } from "@/lib/utils";
import { Flame } from "lucide-react";

interface StreakBadgeProps {
  streak: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function StreakBadge({ streak, size = "md", className }: StreakBadgeProps) {
  if (streak === 0) return null;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-semibold",
        streak >= 30
          ? "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400"
          : streak >= 7
            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400"
            : "bg-muted text-muted-foreground",
        size === "sm" && "px-2 py-0.5 text-[10px]",
        size === "md" && "px-2.5 py-1 text-xs",
        size === "lg" && "px-3 py-1.5 text-sm",
        className
      )}
    >
      <Flame
        className={cn(
          streak >= 7 && "text-orange-500",
          size === "sm" && "h-3 w-3",
          size === "md" && "h-3.5 w-3.5",
          size === "lg" && "h-4 w-4"
        )}
      />
      {streak}
    </div>
  );
}
