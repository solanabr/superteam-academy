// @vitest-environment jsdom
/* eslint-disable import/order -- mock setup must precede importing the component. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import type { DailyQuest } from "@superteam-lms/types";
import { __resetServerXpFeedbackForTests } from "@/lib/gamification/server-xp-feedback";

// Real server-xp-feedback picker between the island and the celebration facade —
// the point of these tests (migrated from the deleted use-dashboard-data hook,
// #1096) is the WIRING of server-provided quests into the one-shot celebration,
// so the picker stays real and only the dispatch surface is spied.
const h = vi.hoisted(() => ({
  dispatchXpGain: vi.fn(),
  dispatchQuestReward: vi.fn(),
}));

vi.mock("@/hooks/use-gamification-events", () => ({
  dispatchXpGain: h.dispatchXpGain,
}));
vi.mock("@/components/gamification/quest-reward-toast", () => ({
  dispatchQuestReward: h.dispatchQuestReward,
}));

import { QuestRewardCelebrations } from "../dashboard-celebrations";

beforeEach(() => {
  h.dispatchXpGain.mockClear();
  h.dispatchQuestReward.mockClear();
  __resetServerXpFeedbackForTests();
});

describe("QuestRewardCelebrations — one-shot justAwarded toasts", () => {
  const quest = (over: Partial<DailyQuest>): DailyQuest => ({
    id: "quest-complete-lesson",
    type: "lesson",
    name: "Complete a lesson",
    description: "",
    icon: "BookOpen",
    xpReward: 15,
    targetValue: 1,
    currentValue: 1,
    completed: true,
    resetType: "daily",
    justAwarded: false,
    ...over,
  });

  it("toasts a justAwarded quest exactly once across re-renders", () => {
    const quests = [quest({ justAwarded: true })];
    const { rerender } = render(
      <QuestRewardCelebrations
        quests={quests}
        questPeriod="2026-08-19"
        userId="user-1"
      />
    );
    expect(h.dispatchQuestReward).toHaveBeenCalledTimes(1);
    expect(h.dispatchQuestReward).toHaveBeenCalledWith({
      questId: "quest-complete-lesson",
      xpReward: 15,
    });
    expect(h.dispatchXpGain).toHaveBeenCalledWith(15);

    // A re-render with fresh array identity must not re-toast (session dedupe).
    rerender(
      <QuestRewardCelebrations
        quests={[quest({ justAwarded: true })]}
        questPeriod="2026-08-19"
        userId="user-1"
      />
    );
    expect(h.dispatchQuestReward).toHaveBeenCalledTimes(1);
  });

  it("never toasts quests that were not just awarded", () => {
    render(
      <QuestRewardCelebrations
        quests={[quest({ justAwarded: false })]}
        questPeriod="2026-08-19"
        userId="user-1"
      />
    );
    expect(h.dispatchQuestReward).not.toHaveBeenCalled();
    expect(h.dispatchXpGain).not.toHaveBeenCalled();
  });
});
