import { cn } from "@/lib/utils";

/**
 * The level badge (spec: Profile Level and XP, 2a — "ring badge, LV lock-up,
 * colour by band").
 *
 * Replaces the metallic gradient sphere with the same flat, ink-outlined
 * construction the achievement patches use: a plate disc with a hard offset
 * shadow, a segmented progress ring, and an inner disc whose fill comes from
 * the level band. The ring is the only ring in the system — a patch never
 * gets one.
 *
 * `progress` is optional because most places that show a level (comment
 * bylines, the leaderboard, the header) know the level but not how far into
 * it the learner is. Without it the badge drops the ring and reads as a plain
 * banded disc rather than inventing a value.
 */
export type LevelBand =
  | "recruit"
  | "learner"
  | "builder"
  | "contributor"
  | "core";

/**
 * Bands walk cream → butter → green → deep green → ink, so a badge's rank is
 * legible without reading the number. The Solana gradient stays reserved for
 * flagship patches and never appears here.
 */
export function getLevelBand(level: number): LevelBand {
  if (level >= 20) return "core";
  if (level >= 11) return "contributor";
  if (level >= 6) return "builder";
  if (level >= 3) return "learner";
  return "recruit";
}

export type LevelBadgeSize = "xs" | "sm" | "md" | "lg" | "xl";

/** The LV kicker is dropped below 60px, where it stops being legible. */
const SHOWS_KICKER: Record<LevelBadgeSize, boolean> = {
  xs: false,
  sm: false,
  md: false,
  lg: true,
  xl: true,
};

/** Below 44px the ring's segments muddy into a smear, so it is dropped too. */
const SHOWS_RING: Record<LevelBadgeSize, boolean> = {
  xs: false,
  sm: false,
  md: true,
  lg: true,
  xl: true,
};

interface LevelBadgeProps {
  level: number;
  size?: LevelBadgeSize;
  /** Percent into the current level (0–100). Omit to render without the ring. */
  progress?: number;
  className?: string;
}

export function LevelBadge({
  level,
  size = "md",
  progress,
  className,
}: LevelBadgeProps) {
  const band = getLevelBand(level);
  const ring =
    progress !== undefined && SHOWS_RING[size]
      ? Math.max(0, Math.min(100, progress))
      : null;

  return (
    <div
      className={cn("lv-badge", className)}
      data-band={band}
      data-size={size}
      data-ring={ring !== null || undefined}
      style={ring !== null ? { ["--lv-pct" as string]: ring } : undefined}
      role="img"
      aria-label={
        ring !== null
          ? `Level ${level}, ${Math.round(ring)}% to the next level`
          : `Level ${level}`
      }
    >
      {ring !== null && (
        <>
          <span className="lv-ring" aria-hidden="true" />
          <span className="lv-ring-seg" aria-hidden="true" />
        </>
      )}
      <span className="lv-core">
        {SHOWS_KICKER[size] && <span className="lv-kicker">LV</span>}
        <span className="lv-num">{level}</span>
      </span>
    </div>
  );
}
