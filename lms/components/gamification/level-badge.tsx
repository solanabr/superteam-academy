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
    level >= 10
      ? "from-[#ffd23f] to-[#008c4c]"
      : level >= 5
        ? "from-[#008c4c] to-[#2f6b3f]"
        : level >= 1
          ? "from-[#ffd23f] to-[#f7eacb]"
          : "from-[#8a9a8e] to-[#2f6b3f]";

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-gradient-to-br font-bold text-white",
        sizes[size],
        tierColor,
      )}
    >
      {level}
    </div>
  );
}
