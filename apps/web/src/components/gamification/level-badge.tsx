"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface LevelBadgeProps {
  level: number;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs border-[2.5px]",
  md: "h-14 w-14 text-[22px] border-[3px]",
  lg: "h-16 w-16 text-2xl border-[3px]",
} as const;

export type LevelTier = "seed" | "sprout" | "sapling" | "canopy";

export function getLevelTier(level: number): LevelTier {
  if (level >= 20) return "canopy";
  if (level >= 10) return "sapling";
  if (level >= 5) return "sprout";
  return "seed";
}

function getLevelStyles(tier: LevelTier): string {
  switch (tier) {
    case "canopy":
      return "bg-gradient-to-br from-[#FDE68A] to-[#F59E0B] border-accent-dark text-[#78350F] shadow-[0_0_20px_rgba(245,158,11,0.3)] dark:shadow-[0_0_20px_rgba(251,191,36,0.25)]";
    case "sapling":
      return "border-accent bg-accent-light text-accent-dark shadow-[0_0_14px_rgba(245,158,11,0.2)] dark:shadow-[0_0_14px_rgba(251,191,36,0.15)]";
    case "sprout":
      return "border-secondary-light bg-secondary-bg text-secondary";
    case "seed":
      return "border-primary bg-primary-light text-primary";
  }
}

export function LevelBadge({
  level,
  size = "md",
  showName = false,
  className,
}: LevelBadgeProps) {
  const t = useTranslations("gamification");
  const tier = getLevelTier(level);

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-full font-display font-black transition-all duration-150",
          sizeClasses[size],
          getLevelStyles(tier)
        )}
        role="img"
        aria-label={`Level ${level}`}
      >
        {level}
      </div>
      {showName && (
        <span className="mt-1 font-display text-xs font-bold text-text-3">
          {t(`tier_${tier}`)}
        </span>
      )}
    </div>
  );
}
