"use client";

import { cn } from "@/lib/utils";

interface LevelBadgeProps {
  level: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

function getTierColor(level: number) {
  if (level >= 50) return "from-yellow-400 to-yellow-600 shadow-yellow-500/30";
  if (level >= 21) return "from-superteam-purple to-purple-600 shadow-purple-500/30";
  if (level >= 11) return "from-superteam-blue to-blue-600 shadow-blue-500/30";
  if (level >= 6) return "from-superteam-green to-green-600 shadow-green-500/30";
  return "from-zinc-400 to-zinc-600 shadow-zinc-500/30";
}

const SIZES = {
  sm: "w-7 h-7 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-lg",
};

export function LevelBadge({ level, size = "md", className }: LevelBadgeProps) {
  return (
    <div
      className={cn(
        "rounded-full bg-gradient-to-br flex items-center justify-center font-bold text-white shadow-lg",
        getTierColor(level),
        SIZES[size],
        className
      )}
    >
      {level}
    </div>
  );
}
