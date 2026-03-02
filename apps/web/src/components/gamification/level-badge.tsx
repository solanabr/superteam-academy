import { cn } from "@/lib/utils";

interface LevelBadgeProps {
  level: number;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

export type LevelTier = "seed" | "sprout" | "sapling" | "canopy" | "legend";

export function getLevelTier(level: number): LevelTier {
  if (level >= 50) return "legend";
  if (level >= 20) return "canopy";
  if (level >= 10) return "sapling";
  if (level >= 5) return "sprout";
  return "seed";
}

const sizeClasses = {
  xs: "w-[20px] h-[20px] text-[10px] border-[1.5px]",
  sm: "w-[32px] h-[32px] text-[13px] border-[2px]",
  md: "w-[44px] h-[44px] text-[16px] border-[2.5px]",
  lg: "w-[64px] h-[64px] text-[28px] border-[2.5px]",
  xl: "w-[96px] h-[96px] text-[42px] border-[3px]",
} as const;

/** Static tier → CSS class map so Tailwind can detect the literal strings during content scanning */
const tierClasses: Record<LevelTier, string> = {
  seed: "lv-seed",
  sprout: "lv-sprout",
  sapling: "lv-sapling",
  canopy: "lv-canopy",
  legend: "lv-legend",
};

export function LevelBadge({ level, size = "md", className }: LevelBadgeProps) {
  const tier = getLevelTier(level);

  return (
    <div
      className={cn(
        "level-badge",
        tierClasses[tier],
        sizeClasses[size],
        className
      )}
      role="img"
      aria-label={`Level ${level}`}
    >
      {level}
    </div>
  );
}
