"use client";

export const ACHIEVEMENT_UNLOCK_EVENT = "superteam:achievement-unlock";
export const ACHIEVEMENT_XP_EVENT = "superteam:achievement-xp";

export interface AchievementUnlockDetail {
  achievementId: string;
  /** Id-derived fallback name; the content catalog beats it when it loads. */
  name: string;
}

export interface AchievementXpDetail {
  achievementId: string;
  amount: number;
}

/**
 * Announce an unlocked achievement. Fired from the Realtime gamification hook's
 * `user_achievements` INSERT subscription.
 *
 * Choreography rework 24-08: unlocks used to render in their own always-parallel
 * surface, beside whatever the reward queue was playing. They moved onto the
 * SAME surface as the level-up and quest rewards
 * (components/gamification/reward-popup.tsx). Owner reversal 2026-09-18: that
 * surface stacks its cards again instead of sequencing them — one surface,
 * concurrent cards, each with its own beat. Localization stays in the
 * presentation layer, so this dispatcher (and the hook that calls it) needs no
 * intl provider.
 */
export function dispatchAchievementUnlock(
  achievementId: string,
  name: string
): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<AchievementUnlockDetail>(ACHIEVEMENT_UNLOCK_EVENT, {
      detail: { achievementId, name },
    })
  );
}

/**
 * Enrich a queued (or on-screen) achievement card with its XP reward — the
 * amount arrives separately, on the `xp_transactions` INSERT.
 */
export function dispatchAchievementXp(
  achievementId: string,
  amount: number
): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<AchievementXpDetail>(ACHIEVEMENT_XP_EVENT, {
      detail: { achievementId, amount },
    })
  );
}
