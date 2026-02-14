"use client";

import { cn } from "@/lib/utils";

interface LevelBadgeProps {
  level: number;
  size?: "sm" | "md" | "lg";
}

export function LevelBadge({ level, size = "md" }: LevelBadgeProps) {
  const sizes = {
    sm: "h-6 w-6 text-[10px]",
    md: "h-8 w-8 text-xs",
    lg: "h-12 w-12 text-sm",
  };

  const tierColor =
    level >= 10 ? "from-xp-gold to-amber-600" :
    level >= 5 ? "from-solana-purple to-solana-cyan" :
    level >= 1 ? "from-solana-green to-emerald-600" :
    "from-gray-400 to-gray-500";

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-gradient-to-br font-bold text-white",
        sizes[size],
        tierColor
      )}
    >
      {level}
    </div>
  );
}
