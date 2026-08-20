// @vitest-environment jsdom
/* eslint-disable import/order -- mock setup must precede importing the component. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import type { DailyQuest } from "@superteam-lms/types";
import {
  __resetServerXpFeedbackForTests,
  pickSurpriseBonusToasts,
  type XpTransactionRow,
} from "@/lib/gamification/server-xp-feedback";

// Real server-xp-feedback pickers between the island and the toast facade —
// the point of these tests (migrated from the deleted use-dashboard-data hook,
// #1096) is the WIRING of server-provided rows into the one-shot toasts, so
// the pickers stay real and only the dispatch surface is spied.
const h = vi.hoisted(() => ({
  dispatchXpGain: vi.fn(),
  dispatchSurpriseBonus: vi.fn(),
  dispatchQuestReward: vi.fn(),
  celebrate: vi.fn(),
}));

vi.mock("@/hooks/use-gamification-events", () => ({
  dispatchXpGain: h.dispatchXpGain,
}));
vi.mock("@/components/gamification/surprise-bonus-toast", () => ({
  dispatchSurpriseBonus: h.dispatchSurpriseBonus,
}));
vi.mock("@/components/gamification/quest-reward-toast", () => ({
  dispatchQuestReward: h.dispatchQuestReward,
}));
vi.mock("@/lib/gamification/celebration", () => ({
  celebrate: h.celebrate,
}));

import {
  QuestRewardCelebrations,
  SurpriseBonusCelebrations,
} from "../dashboard-celebrations";

beforeEach(() => {
  h.dispatchXpGain.mockClear();
  h.dispatchSurpriseBonus.mockClear();
  h.dispatchQuestReward.mockClear();
  h.celebrate.mockClear();
  __resetServerXpFeedbackForTests();
});

describe("SurpriseBonusCelebrations — poll-detected surprise bonus", () => {
  it("dispatches an xp-gain for a surprise bonus that newly appears", async () => {
    // Seed the tab for this user: the first observation silently marks existing
    // history seen, so a bonus that appears on a LATER render is the one that
    // toasts (#790). Keyed by the same user id the server loads under (#796).
    pickSurpriseBonusToasts([], "user-1");

    const AMOUNT = 25;
    const rows: XpTransactionRow[] = [
      {
        amount: AMOUNT,
        reason: "surprise_bonus:lesson-what-is-a-pda",
        created_at: new Date().toISOString(),
        tx_signature: "5igNaTure",
        idempotency_key: "surprise-bonus-key-1",
      },
    ];

    render(<SurpriseBonusCelebrations rows={rows} userId="user-1" />);

    await waitFor(() =>
      expect(h.dispatchSurpriseBonus).toHaveBeenCalledWith(AMOUNT)
    );
    // #796 regression: the poll path must also move the header XP counter.
    expect(h.dispatchXpGain).toHaveBeenCalledWith(AMOUNT);
    expect(h.celebrate).toHaveBeenCalledWith("surprise-bonus");
  });

  it("re-seeds silently for a new user — never storms user B with their own history", () => {
    // #796 round-3: sign-out hard-navigates without clearing sessionStorage, so
    // a same-tab account switch must NOT let user B inherit user A's init flag —
    // otherwise B's ENTIRE surprise-bonus history toasts at once on first load.

    // User A initialised earlier in this tab (their init flag is now set).
    pickSurpriseBonusToasts([], "user-A");

    // User B signs in on the same tab with pre-existing surprise-bonus history.
    const rows: XpTransactionRow[] = [
      {
        amount: 20,
        reason: "surprise_bonus:lesson-one",
        created_at: "2026-07-20T00:00:00.000Z",
        tx_signature: "sigB1",
        idempotency_key: "user-B-bonus-1",
      },
      {
        amount: 35,
        reason: "surprise_bonus:lesson-two",
        created_at: "2026-07-21T00:00:00.000Z",
        tx_signature: "sigB2",
        idempotency_key: "user-B-bonus-2",
      },
    ];

    render(<SurpriseBonusCelebrations rows={rows} userId="user-B" />);

    // B's history is theirs from before this session — seed it silently, toast
    // nothing, move no counter.
    expect(h.dispatchSurpriseBonus).not.toHaveBeenCalled();
    expect(h.dispatchXpGain).not.toHaveBeenCalled();
  });
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
