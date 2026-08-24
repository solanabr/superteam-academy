import { describe, it, expect, beforeEach } from "vitest";
import type { DailyQuest } from "@superteam-lms/types";
import {
  pickQuestRewardToasts,
  claimQuestRewardFromCredit,
  __resetServerXpFeedbackForTests,
} from "../server-xp-feedback";

// #790: server-granted XP must celebrate exactly ONCE. These pin the dedupe: a
// just-awarded quest is picked the first time and never again this session
// (re-poll safe), and nothing is picked without an award.

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

// Owner-reported (2026-07-31): with quest evaluation now firing from the ACTION
// paths, one award can be observed by BOTH channels moments apart — the
// dashboard poll's `justAwarded` and the Realtime xp_transactions INSERT. These
// pin the extended (#790) session dedupe that makes a double toast impossible in
// either arrival order.
describe("claimQuestRewardFromCredit — poll ↔ Realtime dedupe", () => {
  const credit = (
    over: Partial<Parameters<typeof claimQuestRewardFromCredit>[0]> = {}
  ) => ({
    reason: `daily_quest:q1`,
    idempotency_key: `q1:${PERIOD}`,
    created_at: `${PERIOD}T12:00:00Z`,
    ...over,
  });

  it("claims a credit once, then never again", () => {
    expect(claimQuestRewardFromCredit(credit())).toBe("q1");
    expect(claimQuestRewardFromCredit(credit())).toBeNull();
  });

  it("does not toast when the DASHBOARD POLL already claimed the same award", () => {
    // Poll wins the race (it evaluated, saw justAwarded, toasted)…
    expect(
      pickQuestRewardToasts([quest({ id: "q1", justAwarded: true })], PERIOD)
    ).toHaveLength(1);
    // …then the queued credit lands and Realtime observes it → no second toast.
    expect(claimQuestRewardFromCredit(credit())).toBeNull();
  });

  it("does not toast when REALTIME already claimed the same award", () => {
    // Reverse order: the credit is swept + observed first (the learner was on a
    // lesson page), then they open the dashboard on the same session.
    expect(claimQuestRewardFromCredit(credit())).toBe("q1");
    expect(
      pickQuestRewardToasts([quest({ id: "q1", justAwarded: true })], PERIOD)
    ).toEqual([]);
  });

  it("derives the period from the queue reference_id, not the local clock", () => {
    // A São Paulo learner at 22:00 local is already on the NEXT UTC day. The
    // idempotency_key names the server's period, so the two channels agree.
    expect(
      claimQuestRewardFromCredit(credit({ idempotency_key: "q1:2026-07-28" }))
    ).toBe("q1");
    expect(
      pickQuestRewardToasts(
        [quest({ id: "q1", justAwarded: true })],
        "2026-07-28"
      )
    ).toEqual([]);
    // …and the PREVIOUS day's award is a genuinely different reward.
    expect(
      pickQuestRewardToasts([quest({ id: "q1", justAwarded: true })], PERIOD)
    ).toHaveLength(1);
  });

  it("falls back to the credit's created_at date when the key is absent", () => {
    expect(claimQuestRewardFromCredit(credit({ idempotency_key: null }))).toBe(
      "q1"
    );
    expect(
      pickQuestRewardToasts([quest({ id: "q1", justAwarded: true })], PERIOD)
    ).toEqual([]);
  });

  it("ignores non-quest XP credits", () => {
    expect(
      claimQuestRewardFromCredit({ reason: "Completed lesson: lesson-1" })
    ).toBeNull();
    expect(claimQuestRewardFromCredit({ reason: "daily_quest:" })).toBeNull();
    expect(claimQuestRewardFromCredit({ reason: null })).toBeNull();
  });

  it("namespaces the claim per user (same-tab account switch)", () => {
    expect(claimQuestRewardFromCredit(credit(), "user-a")).toBe("q1");
    expect(claimQuestRewardFromCredit(credit(), "user-a")).toBeNull();
    expect(claimQuestRewardFromCredit(credit(), "user-b")).toBe("q1");
  });
});
