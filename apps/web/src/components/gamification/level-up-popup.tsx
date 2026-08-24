"use client";

export const LEVEL_UP_EVENT = "superteam:level-up";

/**
 * Announce a level-up. Fired from the Realtime gamification hook's `user_xp`
 * UPDATE subscription, which only dispatches on a genuine level increase.
 *
 * History: the level-up popup was removed by the brand wave (#955) under a
 * strict three-popup reading of the brand guide, and this dispatcher deleted as
 * unreachable plumbing by #957. The owner reversed that on 2026-08-01 — "the
 * popups were so cool" — so the moment is back at the POPUP tier. Rendering
 * lives in the shared reward popup queue
 * (components/gamification/reward-popup.tsx), which sequences it against the
 * quest rewards and achievement unlocks that land on the same lesson completion.
 *
 * Popup-only, never confetti: with Level = floor(sqrt(XP/100)) early level-ups
 * arrive every few lessons, and confetti that frequent is exactly the routine-
 * reward pattern the LX-B11 / PED-10 tiering exists to kill. That constraint
 * survived the reversal.
 */
export function dispatchLevelUp(level: number): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(LEVEL_UP_EVENT, { detail: { level } }));
}
