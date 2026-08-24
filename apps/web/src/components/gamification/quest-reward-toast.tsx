"use client";

export const QUEST_REWARD_EVENT = "superteam:quest-reward";

export interface QuestRewardDetail {
  questId: string;
  xpReward: number;
}

/**
 * Announce a granted daily-quest reward. Fired from BOTH observation channels —
 * the dashboard poll (`justAwarded`) and the Realtime `xp_transactions` INSERT —
 * each of which claims the award through `claimQuestReward` first, so the same
 * reward can never reach this dispatcher twice.
 *
 * Localization lives in the presentation layer, keeping the callers (a hook and
 * a plain hook-free module) provider-free — the same split every reward
 * dispatcher uses. That is also why no `name` rides on the event: the only
 * English source either channel has is the bundle's authored name, so the
 * renderer resolves the localized name from the id instead.
 *
 * Presentation moved from a success toast to the reward popup queue on
 * 2026-08-01 (owner: toasts read as too cheap for the moment) — see
 * components/gamification/reward-popup.tsx. Only the rendering changed: this
 * dispatcher and the claimQuestReward dedupe both channels share are untouched.
 */
export function dispatchQuestReward(detail: QuestRewardDetail): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<QuestRewardDetail>(QUEST_REWARD_EVENT, { detail })
  );
}
