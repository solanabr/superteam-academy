import { cn } from "@/lib/utils";

/**
 * The level badge (spec: Leaderboard and Level, §1).
 *
 * A hexagon carrying a stacked LV lock-up in the band's fill. The silhouette
 * is the point: achievement patches are square, squircle, circle and notched,
 * so the hexagon belongs to the level badge and to nothing else. There is no
 * ring and no stitch — progress is not on the badge at all, it lives in the
 * XP bar.
 *
 * Built from two clipped hexagons rather than a bordered element, because a
 * clip-path crops a border away: the outline is the layer underneath, showing
 * through the inset of the fill above it. The hard shadow is a drop-shadow
 * filter for the same reason — a box-shadow would draw a rectangle around the
 * six sides.
 */
export type LevelBand = "recruit" | "learner" | "contributor" | "core";

/**
 * Four bands, inclusive maxima. If the XP curve moves, redistribute these
 * thresholds — the spec is explicit that a fifth colour is not an option.
 */
export function getLevelBand(level: number): LevelBand {
  if (level >= 20) return "core";
  if (level >= 10) return "contributor";
  if (level >= 3) return "learner";
  return "recruit";
}

/** Heights; the hexagon's width is 0.88 × its height. */
export type LevelBadgeSize = 30 | 44 | 72 | 104;

/** LV is hidden below 60px rather than shrunk — there the numeral stands alone. */
const SHOWS_KICKER: Record<number, boolean> = {
  30: false,
  44: false,
  72: true,
  104: true,
};

interface LevelBadgeProps {
  level: number;
  size?: LevelBadgeSize;
  className?: string;
}

export function LevelBadge({ level, size = 44, className }: LevelBadgeProps) {
  return (
    <div
      className={cn("lv-badge", className)}
      data-band={getLevelBand(level)}
      data-size={size}
      role="img"
      aria-label={`Level ${level}`}
    >
      <span className="lv-hex-outline" aria-hidden="true" />
      <span className="lv-hex-fill" aria-hidden="true" />
      <span className="lv-core">
        {SHOWS_KICKER[size] && <span className="lv-kicker">LV</span>}
        <span className="lv-num">{level}</span>
      </span>
    </div>
  );
}
