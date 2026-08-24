import confetti from "canvas-confetti";
import { prefersReducedMotion } from "@/lib/reduced-motion";

/**
 * Celebration re-tiering (LX-B11, PED-10 overjustification).
 *
 * Routine per-lesson rewards undermine intrinsic motivation, so per the
 * LX-B11 acceptance line, confetti fires ONLY at deploy + credential mint.
 * Lesson/challenge completion gets a calm checkmark acknowledgment; a
 * level-up gets a popup-only medium moment — with Level = floor(sqrt(XP/100))
 * early level-ups arrive every few lessons, and confetti that frequent would
 * recreate the routine-reward pattern this tiering exists to kill; a
 * successful devnet deploy gets a single confetti burst; a credential mint gets
 * the full-screen celebration.
 *
 * OWNER REVERSAL 2026-08-01 — READ BEFORE "FIXING" THIS MAP BACK.
 * The brand wave (#955) removed the level-up popup on a strict three-popup
 * reading of the brand guide, and #957 deleted its plumbing. The owner reversed
 * that: "the popups were so cool", and of the small success toasts the
 * recurring rewards had been demoted to, "those toasts are so cheap". So
 * level-up, daily-quest completion and achievement unlocks all sit at the POPUP
 * tier and render through the shared reward popup queue
 * (components/gamification/reward-popup.tsx). This supersedes the PED-10
 * minimal-celebration reading for THESE THREE events — it is a deliberate
 * product decision, not drift.
 *
 * What the reversal did NOT change, and what an audit should still enforce:
 * confetti stays reserved for deploy + credential mint (LX-B11). "popup" is
 * confetti-free by construction — celebrate() returns before ever reaching
 * canvas-confetti for that tier. Frequent confetti is the routine-reward
 * pattern the tiering exists to kill, and early level-ups arrive every few
 * lessons (Level = floor(sqrt(XP/100))).
 *
 * Lesson completion and a passing challenge run are deliberately absent from
 * `CelebrationEvent`: they are routine and get no celebration, so there is no
 * tier to look up.
 *
 * All visual celebration respects `prefers-reduced-motion`.
 */

// Re-exported so the celebration module stays the single import for callers
// that both celebrate and need the motion preference (the helper itself is
// generic — lib/reduced-motion.ts).
export { prefersReducedMotion };

export type CelebrationEvent =
  | "deploy-success"
  | "level-up"
  | "credential-mint"
  | "achievement"
  | "daily-quest";

export type CelebrationTier = "none" | "popup" | "medium" | "full";

export const CELEBRATION_TIERS: Record<CelebrationEvent, CelebrationTier> = {
  "deploy-success": "medium",
  "level-up": "popup",
  "credential-mint": "full",
  // An achievement unlock joined the shared queue in the 24-08 choreography
  // rework (it used to render in its own always-parallel surface). Same popup
  // tier as its peers — never confetti.
  achievement: "popup",
  // A completed daily quest is a real earned moment, so it goes through the
  // house celebration system — at the POPUP tier, NOT confetti. Every peer
  // moment a learner meets this often is popup-or-quieter (level-up: popup;
  // achievement: popup); confetti is reserved by LX-B11
  // for deploy + credential mint precisely because a daily-cadence reward is
  // the routine-reward pattern the tiering exists to avoid. The pop-spring
  // popup card IS the moment. Flip this one constant to "medium" if the owner
  // wants a confetti burst instead — the call site already routes through
  // celebrate().
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
 * UI (the reward popup queue's pop-spring card) IS the medium moment; only the
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
