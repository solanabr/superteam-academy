import { cn } from "@/lib/utils";

/**
 * Learner-facing progress bar — the dashboard XP bar's construction (ink
 * outline, muted track, solid mint fill, pill radius) in three sizes.
 *
 * Lesson counts are discrete, so `segmented` renders one cell per lesson
 * instead of a continuous fill. Past `SEGMENT_CAP` cells the ticks stop
 * reading as countable units and turn into noise, so the bar falls back to a
 * smooth fill on its own.
 */

/** Above this many units, segments read as noise — render a smooth fill. */
export const SEGMENT_CAP = 24;

type Size = "card" | "slim" | "micro";

interface ProgressBarProps {
  /** Units completed (lessons done). */
  value: number;
  /** Total units (lessons in the course). */
  max?: number;
  /** Render one cell per unit rather than a continuous fill. */
  segmented?: boolean;
  size?: Size;
  /**
   * Visual fill (0..1) overriding `value / max` — for endowed progress, where
   * an enrolled learner with nothing completed still gets a first tick. Never
   * changes the reported `aria-valuenow`, which stays the honest count.
   */
  displayFraction?: number;
  className?: string;
  /** Accessible name; the visible fraction usually carries the meaning. */
  "aria-label"?: string;
}

const sizeClass: Record<Size, string> = {
  card: "",
  slim: "seg-track--slim",
  micro: "seg-track--micro",
};

export function ProgressBar({
  value,
  max = 100,
  segmented = false,
  size = "card",
  displayFraction,
  className,
  "aria-label": ariaLabel,
}: ProgressBarProps) {
  const total = Math.max(0, max);
  const done = Math.min(Math.max(0, value), total);
  const earned = total > 0 ? done / total : 0;
  const fraction = Math.min(Math.max(displayFraction ?? earned, 0), 1);

  const useSegments = segmented && total > 0 && total <= SEGMENT_CAP;
  // An endowed fill with nothing completed still lights one cell — otherwise
  // the head-start the ring used to show would vanish in the segmented bar.
  const lit = done === 0 && fraction > 0 ? 1 : done;

  return (
    <div
      className={cn("seg-track", sizeClass[size], className)}
      role="progressbar"
      aria-valuenow={done}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-label={ariaLabel}
    >
      {useSegments ? (
        Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={cn("seg-cell", i < lit && "seg-cell--on")}
            data-filled={i < lit}
          />
        ))
      ) : (
        <div className="seg-fill" style={{ width: `${fraction * 100}%` }} />
      )}
    </div>
  );
}
