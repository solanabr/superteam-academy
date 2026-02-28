"use client";

import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakCounterProps {
  currentStreak: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const sizeStyles = {
  sm: { text: "text-xs", icon: "h-3 w-3", gap: "gap-0.5" },
  md: { text: "text-sm", icon: "h-4 w-4", gap: "gap-1" },
  lg: { text: "text-base", icon: "h-5 w-5", gap: "gap-1.5" },
};

export function StreakCounter({ currentStreak, size = "md", showLabel = true, className }: StreakCounterProps) {
  const config = sizeStyles[size];
  const isActive = currentStreak > 0;

  return (
    <span
      className={cn(
        "inline-flex items-center font-semibold",
        config.gap,
        config.text,
        isActive ? "text-streak" : "text-muted-foreground",
        className,
      )}
    >
      <Flame className={cn(config.icon, isActive && "animate-flame")} />
      <span>{currentStreak}{showLabel ? "d" : ""}</span>
    </span>
  );
}
