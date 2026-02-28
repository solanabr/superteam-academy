"use client";

import { Flame } from "lucide-react";
import { useStreak } from "@/lib/hooks/use-service";
import { cn } from "@/lib/utils";

interface StreakFlameProps {
  size?: "sm" | "md" | "lg";
}

export function StreakFlame({ size = "md" }: StreakFlameProps) {
  const { data: streak } = useStreak();
  const current = streak?.current ?? 0;
  const isActive = current > 0;

  const sizes = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <div className="flex items-center gap-1.5">
      <Flame
        className={cn(
          sizes[size],
          isActive ? "text-streak-orange" : "text-muted-foreground",
          isActive && "animate-pulse",
        )}
      />
      <span
        className={cn(
          "font-bold",
          size === "sm" ? "text-xs" : size === "md" ? "text-sm" : "text-base",
          isActive ? "text-streak-orange" : "text-muted-foreground",
        )}
      >
        {current}
      </span>
    </div>
  );
}
