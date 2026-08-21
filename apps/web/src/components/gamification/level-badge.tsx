import { cn } from "@/lib/utils";

/**
 * The level badge (spec: Leaderboard and Level, §1).
 *
 * A plate disc holding a stacked LV lock-up, wrapped in a progress ring — the
 * only ring in the system, so a badge is never mistaken for an achievement
 * patch. Flat fill, ink outline, hard offset shadow: no metal, no gradient.
 *
 * Mint belongs to progress alone: it fills the ring and the XP bar and is
 * never a band colour. The band ramp walks cream → amber → deep green → ink,
 * so rank is legible before the numeral is read.
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

/**
 * The spec's three disc sizes plus the inline lock-up. `pill` puts LV before
 * the numeral in a capsule, for rows too dense to carry a disc.
 */
export type LevelBadgeSize = "pill" | 44 | 72 | 104;

/** LV is hidden below 60px rather than shrunk further. */
const SHOWS_KICKER: Record<string, boolean> = {
  pill: true,
  44: false,
  72: true,
  104: true,
};

/** A pill has nowhere to put a ring. */
const SHOWS_RING: Record<string, boolean> = {
  pill: false,
  44: true,
  72: true,
  104: true,
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
  size = 44,
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
      style={ring !== null ? { ["--lv-pct" as string]: `${ring}%` } : undefined}
      role="img"
      aria-label={
        ring !== null
          ? `Level ${level}, ${Math.round(ring)}% to the next level`
          : `Level ${level}`
      }
    >
      {ring !== null && <span className="lv-ring" aria-hidden="true" />}
      <span className="lv-core">
        {SHOWS_KICKER[size] && <span className="lv-kicker">LV</span>}
        <span className="lv-num">{level}</span>
      </span>
    </div>
  );
}
