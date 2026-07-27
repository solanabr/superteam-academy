import { describe, it, expect, beforeEach } from "vitest";
import type { DailyQuest } from "@superteam-lms/types";
import {
  pickQuestRewardToasts,
  pickSurpriseBonusToasts,
  claimSurpriseBonus,
  __resetServerXpFeedbackForTests,
} from "../server-xp-feedback";

// #790: server-granted XP must toast exactly ONCE. These pin the dedupe: a
// just-awarded quest / a surprise-bonus row is picked the first time and never
// again this session (re-poll safe), and nothing is picked without an award.

const PERIOD = "2026-07-27";

function quest(overrides: Partial<DailyQuest>): DailyQuest {
  return {
    id: "quest-complete-lesson",
    type: "lesson",
    name: "Complete a Lesson",
    description: "",
    icon: "BookOpen",
    xpReward: 25,
    targetValue: 1,
    currentValue: 1,
    completed: true,
    resetType: "daily",
    ...overrides,
  };
}

beforeEach(() => __resetServerXpFeedbackForTests());

describe("pickQuestRewardToasts (#790)", () => {
  it("returns a just-awarded quest ONCE, then nothing on a re-poll", () => {
    const quests = [quest({ id: "q1", justAwarded: true, xpReward: 35 })];
    const first = pickQuestRewardToasts(quests, PERIOD);
    expect(first).toEqual([
      { questId: "q1", name: "Complete a Lesson", xpReward: 35 },
    ]);
    // Same quest, still flagged (e.g. a stale response) → already claimed → nothing.
    expect(pickQuestRewardToasts(quests, PERIOD)).toEqual([]);
  });

  it("ignores quests that were not just awarded", () => {
    expect(
      pickQuestRewardToasts(
        [
          quest({ id: "a", justAwarded: false }),
          quest({ id: "b", completed: true }), // justAwarded undefined
        ],
        PERIOD
      )
    ).toEqual([]);
  });

  it("keys the dedupe on quest + period — a new day re-toasts", () => {
    const q = [quest({ id: "q1", justAwarded: true })];
    expect(pickQuestRewardToasts(q, "2026-07-27")).toHaveLength(1);
    expect(pickQuestRewardToasts(q, "2026-07-27")).toHaveLength(0);
    expect(pickQuestRewardToasts(q, "2026-07-28")).toHaveLength(1);
  });
});

describe("pickSurpriseBonusToasts (#790)", () => {
  const rowA = {
    reason: "surprise_bonus:lesson-1",
    amount: 40,
    idempotency_key: "sigA:SurpriseBonus",
  };
  const rowB = {
    reason: "surprise_bonus:lesson-2",
    amount: 15,
    idempotency_key: "sigB:SurpriseBonus",
  };

  it("seeds existing bonuses SILENTLY on first observation (no stale toast storm)", () => {
    // A fresh tab's first dashboard poll sees historical bonuses — it must not
    // toast them; the learner didn't just earn them.
    expect(pickSurpriseBonusToasts([rowA, rowB])).toEqual([]);
  });

  it("toasts a newly-appeared bonus ONCE, then nothing on a re-poll", () => {
    pickSurpriseBonusToasts([rowA]); // first poll → seed rowA silently
    // rowB appears on a later poll → toast it once.
    expect(pickSurpriseBonusToasts([rowA, rowB])).toEqual([15]);
    // Re-poll (reload-equivalent): both seen → nothing.
    expect(pickSurpriseBonusToasts([rowA, rowB])).toEqual([]);
  });

  it("ignores non-surprise and non-positive rows", () => {
    pickSurpriseBonusToasts([]); // init
    expect(
      pickSurpriseBonusToasts([
        { reason: "Completed lesson: x", amount: 25, idempotency_key: "a" },
        { reason: "surprise_bonus:y", amount: 0, idempotency_key: "b" },
        { reason: null, amount: 40, idempotency_key: "c" },
      ])
    ).toEqual([]);
  });

  it("shares its dedupe with the Realtime path (claimSurpriseBonus)", () => {
    pickSurpriseBonusToasts([]); // init (empty → nothing seeded)
    // Realtime saw the award first and claimed its key → the poll must not re-toast.
    expect(claimSurpriseBonus("sigA:SurpriseBonus")).toBe(true);
    expect(pickSurpriseBonusToasts([rowA])).toEqual([]);
  });

  it("falls back to sig+timestamp when idempotency_key is absent", () => {
    pickSurpriseBonusToasts([]); // init
    const rows = [
      {
        reason: "surprise_bonus:z",
        amount: 15,
        tx_signature: "txA",
        created_at: "2026-07-27T10:00:00Z",
      },
    ];
    expect(pickSurpriseBonusToasts(rows)).toEqual([15]);
    expect(pickSurpriseBonusToasts(rows)).toEqual([]);
  });
});
