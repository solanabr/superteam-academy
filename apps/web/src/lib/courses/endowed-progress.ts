/**
 * Endowed-progress derivation (LX-B12). Presentation-only: turns the honest
 * completed/total lesson counts a course card already has into the fill a
 * progress display should render.
 *
 * Two mechanics, both framing — never inflation:
 *   1. A non-zero *first tick* the moment a learner is enrolled, before any
 *      lesson is completed, so no progress bar renders 0%. Because this fill
 *      is not yet earned, it is always paired with a stated reason
 *      (`reasonKey`) — unexplained head-starts backfire (UIU-06).
 *   2. Near-goal intensification: a flag callers use to raise progress-UI
 *      emphasis as a course approaches completion.
 *
 * The honest counts pass through untouched; only the visual fill and its
 * reason are derived. Callers MUST keep rendering the honest completed/total
 * counts alongside — the endowed fill never claims a lesson that isn't done.
 */

/**
 * Visual fill (0..1) granted for enrolling, before any lesson is completed.
 * Small enough to read as "you've started", never as a completed lesson.
 */
export const ENDOWED_FIRST_TICK_FRACTION = 0.06;

/**
 * Earned fraction (0..1) at or above which — while still incomplete — a course
 * enters near-goal intensification.
 */
export const NEAR_GOAL_THRESHOLD = 0.75;

/** i18n reason keys for a pre-credited (not-yet-earned) tick. */
export type EndowedReasonKey = "enrolledFirstStep";

export interface EndowedProgress {
  /** Honest earned fraction: completed / total (0 when nothing is done). */
  earnedFraction: number;
  /**
   * Fraction a progress bar/ring should visually fill. Never 0 once enrolled:
   * equals `earnedFraction` once any lesson is earned, otherwise the endowed
   * first tick.
   */
  displayFraction: number;
  /**
   * i18n key stating why `displayFraction` exceeds `earnedFraction`, or null
   * when the fill is fully earned and needs no explanation.
   */
  reasonKey: EndowedReasonKey | null;
  /** True approaching completion — callers raise progress-UI emphasis. */
  nearGoal: boolean;
  /** True when every lesson is complete. */
  isComplete: boolean;
}

/**
 * Derive the endowed-progress view for one enrolled course. Pure — the inputs
 * are the honest lesson counts the card already holds.
 */
export function deriveEndowedProgress(
  completedLessons: number,
  totalLessons: number
): EndowedProgress {
  const total = Math.max(0, totalLessons);
  const completed = Math.min(Math.max(0, completedLessons), total || Infinity);
  const earnedFraction = total > 0 ? completed / total : 0;
  const isComplete = total > 0 && completed >= total;

  // Before the first lesson is earned, the fill is pre-credited — endow the
  // first tick and state its reason. Once any lesson is earned, the fill is
  // the honest earned fraction and carries no reason.
  const preCredited = completed === 0;
  const displayFraction = preCredited
    ? ENDOWED_FIRST_TICK_FRACTION
    : earnedFraction;
  const reasonKey: EndowedReasonKey | null = preCredited
    ? "enrolledFirstStep"
    : null;

  const nearGoal = !isComplete && earnedFraction >= NEAR_GOAL_THRESHOLD;

  return { earnedFraction, displayFraction, reasonKey, nearGoal, isComplete };
}
