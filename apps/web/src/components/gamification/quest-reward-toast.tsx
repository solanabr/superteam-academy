"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { celebrate } from "@/lib/gamification/celebration";
import { questDisplayName } from "@/lib/gamification/quest-name";
import { dispatchToast } from "@/components/ui/toast-container";

const QUEST_REWARD_EVENT = "superteam:quest-reward";

export interface QuestRewardDetail {
  questId: string;
  /** Content name when the observer has it (the dashboard poll); else derived. */
  name?: string;
  xpReward: number;
}

/**
 * Announce a granted daily-quest reward. Fired from BOTH observation channels —
 * the dashboard poll (`justAwarded`) and the Realtime `xp_transactions` INSERT —
 * each of which claims the award through `claimQuestReward` first, so the same
 * reward can never reach this dispatcher twice.
 *
 * Localization lives in the mounted listener below, keeping the callers (a hook
 * and a plain hook-free module) provider-free — the same split the
 * surprise-bonus toast uses.
 */
export function dispatchQuestReward(detail: QuestRewardDetail): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<QuestRewardDetail>(QUEST_REWARD_EVENT, { detail })
  );
}

/**
 * Renders nothing; listens for quest-reward events and shows the house
 * celebration toast (success variant, pop-spring entrance, `aria-live="polite"`
 * via the shared ToastContainer). Mount once inside the intl provider.
 *
 * Before this component the reward was a plain info toast fired only by the
 * dashboard, and the Realtime channel deliberately SUPPRESSED quest XP ("the
 * quests panel already shows the reward"). That assumption no longer holds:
 * quests are now awarded while the learner is anywhere in the app, so the
 * celebration has to travel with them.
 */
export function QuestRewardToastListener() {
  const t = useTranslations("gamification");

  useEffect(() => {
    const handler = (e: Event) => {
      const { questId, name, xpReward } = (e as CustomEvent<QuestRewardDetail>)
        .detail;
      celebrate("daily-quest");
      dispatchToast(
        t("questReward", {
          name: name ?? questDisplayName(questId),
          amount: xpReward,
        }),
        "success"
      );
    };
    window.addEventListener(QUEST_REWARD_EVENT, handler);
    return () => window.removeEventListener(QUEST_REWARD_EVENT, handler);
  }, [t]);

  return null;
}
