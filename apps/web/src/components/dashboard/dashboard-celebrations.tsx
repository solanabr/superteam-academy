"use client";

import { useEffect } from "react";
import type { DailyQuest } from "@superteam-lms/types";
import { pickQuestRewardToasts } from "@/lib/gamification/server-xp-feedback";
import { dispatchXpGain } from "@/hooks/use-gamification-events";
import { dispatchQuestReward } from "@/components/gamification/quest-reward-toast";

/**
 * Render-nothing client island that keeps the #790 server-granted-XP feedback
 * alive under the server-shell dashboard (#1096): the DATA now arrives as
 * server-rendered props, but the celebration decision must stay in the browser —
 * the dedupe seen-set (module state, shared with the Realtime path) only exists
 * there.
 *
 * The surprise-bonus sibling island went away with the feature itself (24-08).
 */

interface QuestRewardCelebrationsProps {
  quests: DailyQuest[];
  /** The SERVER's UTC quest period — the shared toast dedupe key (#790). */
  questPeriod: string;
  userId: string;
}

export function QuestRewardCelebrations({
  quests,
  questPeriod,
  userId,
}: QuestRewardCelebrationsProps) {
  useEffect(() => {
    for (const reward of pickQuestRewardToasts(quests, questPeriod, userId)) {
      dispatchXpGain(reward.xpReward);
      // Same celebration the Realtime path fires — one component, one look,
      // wherever the learner happens to be standing.
      dispatchQuestReward({
        questId: reward.questId,
        xpReward: reward.xpReward,
      });
    }
  }, [quests, questPeriod, userId]);

  return null;
}
