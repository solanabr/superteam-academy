"use client";

import { useEffect } from "react";
import type { DailyQuest } from "@superteam-lms/types";
import {
  pickQuestRewardToasts,
  pickSurpriseBonusToasts,
  type XpTransactionRow,
} from "@/lib/gamification/server-xp-feedback";
import { celebrate } from "@/lib/gamification/celebration";
import { dispatchXpGain } from "@/hooks/use-gamification-events";
import { dispatchSurpriseBonus } from "@/components/gamification/surprise-bonus-toast";
import { dispatchQuestReward } from "@/components/gamification/quest-reward-toast";

/**
 * Render-nothing client islands that keep the #790 server-granted-XP feedback
 * alive under the server-shell dashboard (#1096): the DATA now arrives as
 * server-rendered props, but the toast/celebration decisions must stay in the
 * browser — the dedupe seen-sets (sessionStorage + module state, shared with
 * the Realtime path) only exist there.
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

interface SurpriseBonusCelebrationsProps {
  rows: XpTransactionRow[];
  userId: string;
}

export function SurpriseBonusCelebrations({
  rows,
  userId,
}: SurpriseBonusCelebrationsProps) {
  useEffect(() => {
    for (const amount of pickSurpriseBonusToasts(rows, userId)) {
      dispatchXpGain(amount);
      celebrate("surprise-bonus");
      dispatchSurpriseBonus(amount);
    }
  }, [rows, userId]);

  return null;
}
