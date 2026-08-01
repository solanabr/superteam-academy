"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { celebrate } from "@/lib/gamification/celebration";
import { useQuestName } from "@/lib/gamification/use-quest-name";
import { dispatchToast } from "@/components/ui/toast-container";

const QUEST_REWARD_EVENT = "superteam:quest-reward";

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
 * Localization lives in the mounted listener below, keeping the callers (a hook
 * and a plain hook-free module) provider-free — the same split the
 * surprise-bonus toast uses. That is also why no `name` rides on the event: the
 * only English source either channel has is the bundle's authored name, so the
 * listener resolves the localized name from the id instead.
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
 * The celebration must travel with the learner: quests are awarded from the
 * ACTION paths, so the reward routinely lands somewhere other than the
 * dashboard, where the quests panel would have shown it.
 */
export function QuestRewardToastListener() {
  const t = useTranslations("gamification");
  const questName = useQuestName();

  useEffect(() => {
    const handler = (e: Event) => {
      const { questId, xpReward } = (e as CustomEvent<QuestRewardDetail>)
        .detail;
      celebrate("daily-quest");
      dispatchToast(
        t("questReward", { name: questName(questId), amount: xpReward }),
        "success"
      );
    };
    window.addEventListener(QUEST_REWARD_EVENT, handler);
    return () => window.removeEventListener(QUEST_REWARD_EVENT, handler);
  }, [t, questName]);

  return null;
}
