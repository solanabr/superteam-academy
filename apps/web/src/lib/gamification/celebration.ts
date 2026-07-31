import confetti from "canvas-confetti";

/**
 * Celebration re-tiering (LX-B11, PED-10 overjustification).
 *
 * Routine per-lesson rewards undermine intrinsic motivation, so per the
 * LX-B11 acceptance line, confetti fires ONLY at deploy + credential mint.
 * Lesson/challenge completion gets a calm checkmark acknowledgment; a
 * level-up gets a popup-only medium moment — with Level = floor(sqrt(XP/100))
 * early level-ups arrive every few lessons, and confetti that frequent would
 * recreate the routine-reward pattern this tiering exists to kill; a
 * successful devnet deploy gets a single confetti burst; a credential mint
 * gets the full-screen celebration.
 *
 * All visual celebration respects `prefers-reduced-motion`.
 */

export type CelebrationEvent =
  | "lesson-complete"
  | "challenge-pass"
  | "deploy-success"
  | "level-up"
  | "credential-mint"
  | "surprise-bonus"
  | "daily-quest";

export type CelebrationTier = "none" | "popup" | "medium" | "full";

export const CELEBRATION_TIERS: Record<CelebrationEvent, CelebrationTier> = {
  "lesson-complete": "none",
  "challenge-pass": "none",
  "deploy-success": "medium",
  "level-up": "popup",
  "credential-mint": "full",
  // A surprise bonus (LX-B15) is an informational moment — a calm toast, never
  // confetti. Its delight is the unexpectedness of the reward, not spectacle.
  "surprise-bonus": "none",
  // A completed daily quest is a real earned moment, so it goes through the
  // house celebration system rather than a bare toast — but at the POPUP tier,
  // NOT confetti. Every peer moment a learner meets this often is popup-or-
  // quieter (level-up: popup; achievement: popup; surprise bonus: none);
  // confetti is reserved by LX-B11 for deploy + credential mint precisely
  // because a daily-cadence reward is the routine-reward pattern the tiering
  // exists to avoid. The pop-spring celebration toast IS the moment. Flip this
  // one constant to "medium" if the owner wants a confetti burst instead — the
  // call site already routes through celebrate().
  "daily-quest": "popup",
} as const;

export function celebrationTierFor(event: CelebrationEvent): CelebrationTier {
  return CELEBRATION_TIERS[event];
}

/**
 * Struggling-encouragement state (LX-B11 / F11, R10): a learner whose runs
 * keep failing gets a supportive nudge after this many consecutive failed
 * runs — never a punishment, never blocking.
 */
export const ENCOURAGEMENT_THRESHOLD = 3;

export function shouldShowEncouragement(
  consecutiveFailedRuns: number
): boolean {
  return consecutiveFailedRuns >= ENCOURAGEMENT_THRESHOLD;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function")
    return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * A credential mint can be observed twice within moments (manual mint success
 * + the Supabase Realtime certificate INSERT funneling into the popup), so
 * full-tier celebrations within this window are collapsed into one.
 */
export const FULL_TIER_DEDUPE_MS = 8000;

export function isDuplicateFullCelebration(
  now: number,
  lastFiredAt: number
): boolean {
  return now - lastFiredAt < FULL_TIER_DEDUPE_MS;
}

let lastFullFiredAt = 0;

/** Test-only: clears the full-tier dedupe window. */
export function resetCelebrationThrottleForTests(): void {
  lastFullFiredAt = 0;
}

/**
 * Fire the visual celebration for an event according to its tier.
 * `none` renders nothing — the calm acknowledgment lives in the calling UI.
 * `popup` also fires NO confetti — the animated popup rendered by the calling
 * UI (e.g. LevelUpPopup's pop-spring card) IS the medium moment; only the
 * `medium` and `full` tiers ever reach canvas-confetti.
 */
export function celebrate(event: CelebrationEvent): void {
  const tier = celebrationTierFor(event);
  if (tier === "none" || tier === "popup") return;
  if (typeof window === "undefined") return;
  if (prefersReducedMotion()) return;

  if (tier === "medium") {
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      disableForReducedMotion: true,
    });
    return;
  }

  // full — credential mint: one center burst + two side bursts
  const now = Date.now();
  if (isDuplicateFullCelebration(now, lastFullFiredAt)) return;
  lastFullFiredAt = now;

  confetti({
    particleCount: 200,
    spread: 100,
    origin: { y: 0.6 },
    disableForReducedMotion: true,
  });
  setTimeout(() => {
    confetti({
      particleCount: 120,
      angle: 60,
      spread: 70,
      origin: { x: 0, y: 0.7 },
      disableForReducedMotion: true,
    });
  }, 250);
  setTimeout(() => {
    confetti({
      particleCount: 120,
      angle: 120,
      spread: 70,
      origin: { x: 1, y: 0.7 },
      disableForReducedMotion: true,
    });
  }, 400);
}
