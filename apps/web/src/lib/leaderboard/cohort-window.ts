import type { CohortLeaderboardEntry } from "@superteam-lms/types";

/** Default nearby-rank radius for the "you ±3" strip (LX-B9b). */
export const COHORT_STRIP_RADIUS = 3;

/** ~30-person weekly cohorts — the Duolingo shape (spec LX-B9b). Mirrors the
 *  LEAGUE_COHORT_CAPACITY constant in 20260726200000_cohort_leagues.sql. */
export const COHORT_CAPACITY = 30;

/**
 * A clamped, centered sliding window of ranks for the "you ±radius" strip.
 *
 * Returns the inclusive 1-indexed `[lo, hi]` rank range to show: a window of
 * size `min(total, 2*radius+1)` that contains `myRank` and is as centered as the
 * edges allow. At rank 1 it slides to `[1, W]`; at the last rank it slides to the
 * final `W`; in between it is `myRank ± radius`. This is the pure, testable
 * mirror of what the cohort board's snapshot rows are sliced by — kept out of
 * SQL so the edge behavior has one implementation and one set of unit tests.
 */
export function cohortStripWindow(
  myRank: number,
  total: number,
  radius: number = COHORT_STRIP_RADIUS
): { lo: number; hi: number } {
  if (total <= 0) return { lo: 1, hi: 0 };
  const r = Math.max(0, radius);
  const win = Math.min(total, 2 * r + 1);
  // lo clamped into [1, total - win + 1] so the window never runs off either end.
  const lo = Math.max(1, Math.min(myRank - r, total - win + 1));
  return { lo, hi: lo + win - 1 };
}

/**
 * Slice a full cohort board (ordered by rank ascending, ranks contiguous 1..n)
 * down to the viewer's "you ±radius" neighborhood. Returns [] when the viewer is
 * absent (should not happen — assignment adds them — but fail closed rather than
 * mislabel someone else as "you").
 */
export function deriveCohortStrip(
  entries: readonly CohortLeaderboardEntry[],
  radius: number = COHORT_STRIP_RADIUS
): CohortLeaderboardEntry[] {
  const you = entries.find((e) => e.isYou);
  if (!you) return [];
  const { lo, hi } = cohortStripWindow(you.rank, entries.length, radius);
  return entries.filter((e) => e.rank >= lo && e.rank <= hi);
}
