"use client";

import { Zap } from "lucide-react";
import { formatXP, cn } from "@/lib/utils";

interface XPBadgeProps {
  xp: number;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
}

const sizeStyles = {
  sm: "text-xs gap-0.5",
  md: "text-sm gap-1",
  lg: "text-base gap-1.5",
};

const iconSizes = {
  sm: "h-3 w-3",
  md: "h-3.5 w-3.5",
  lg: "h-4 w-4",
};

export function XPBadge({
  xp,
  size = "md",
  showIcon = true,
  className,
}: XPBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-semibold text-xp",
        sizeStyles[size],
        className,
      )}
    >
      {showIcon && <Zap className={iconSizes[size]} />}
      {formatXP(xp)} XP
    </span>
  );
}
