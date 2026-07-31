/* eslint-disable import/order -- vi.mock calls must precede importing the module under test. */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Owner-reported (2026-07-31): quest XP only landed when the learner opened the
// dashboard, because get_daily_quest_state was invoked from exactly one place.
// These pin the shared trigger: the same evaluation the dashboard GET runs is
// now runnable from any server path, it awards a quest exactly ONCE no matter
// how many paths fire it, and a failure is logged rather than swallowed.

vi.mock("server-only", () => ({}));

const { getAllQuests, rpc, retryQuestXpForUser, logError, after } = vi.hoisted(
  () => ({
    getAllQuests: vi.fn(),
    rpc: vi.fn(),
    retryQuestXpForUser: vi.fn<() => Promise<void>>(),
    logError: vi.fn(),
    after: vi.fn<(cb: () => Promise<void>) => void>(),
  })
);

vi.mock("next/server", () => ({ after }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({ rpc }) }));
vi.mock("@/lib/content/queries", () => ({ getAllQuests }));
vi.mock("@/lib/solana/onchain-queue", () => ({ retryQuestXpForUser }));
vi.mock("@/lib/logging", () => ({ logError }));

import {
  evaluateQuests,
  runQuestEvaluation,
  scheduleQuestEvaluation,
} from "../quest-evaluation";

const QUEST = {
  id: "quest-complete-lesson",
  type: "lesson" as const,
  name: "Complete a Lesson",
  description: "",
  icon: "BookOpen",
  xpReward: 25,
  targetValue: 1,
  resetType: "daily" as const,
};

/**
 * A faithful stand-in for get_daily_quest_state's award guard: the quest is
 * marked granted under `WHERE xp_granted = false`, so only the FIRST call that
 * sees the target met reports justAwarded, and only one queue row is ever
 * enqueued — no matter how many callers fire.
 */
function fakeQuestRpc() {
  const granted = new Set<string>();
  const enqueued: string[] = [];
  let targetMet = false;
  const impl = vi.fn(async (_fn: string, args: { p_user_id: string }) => {
    const completed = targetMet;
    let justAwarded = false;
    const key = `${args.p_user_id}:${QUEST.id}`;
    if (completed && !granted.has(key)) {
      granted.add(key);
      justAwarded = true;
      enqueued.push(key);
    }
    return {
      data: [
        {
          questId: QUEST.id,
          currentValue: completed ? 1 : 0,
          completed,
          justAwarded,
          xpReward: QUEST.xpReward,
        },
      ],
      error: null,
    };
  });
  return {
    impl,
    enqueued,
    completeTheQuest: () => {
      targetMet = true;
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  getAllQuests.mockResolvedValue({
    quests: [QUEST],
    challengeLessonIds: ["lesson-a"],
    moduleLessonMap: [{ id: "course-1:m1", lessonIds: ["lesson-a"] }],
  });
  retryQuestXpForUser.mockResolvedValue(undefined);
  after.mockImplementation((cb) => {
    void cb();
  });
});

describe("evaluateQuests — the shared implementation", () => {
  it("calls get_daily_quest_state with the bundle's quest definitions", async () => {
    rpc.mockResolvedValue({ data: [], error: null });
    await evaluateQuests({ rpc } as never, "user-1");

    expect(rpc).toHaveBeenCalledWith("get_daily_quest_state", {
      p_user_id: "user-1",
      p_quest_definitions: [
        {
          id: QUEST.id,
          type: "lesson",
          xpReward: 25,
          targetValue: 1,
          resetType: "daily",
        },
      ],
      p_challenge_ids: ["lesson-a"],
      p_module_lesson_map: [{ id: "course-1:m1", lessonIds: ["lesson-a"] }],
    });
  });

  it("passes NO date — day semantics stay the RPC's CURRENT_DATE (UTC)", async () => {
    rpc.mockResolvedValue({ data: [], error: null });
    await evaluateQuests({ rpc } as never, "user-1");
    const args = rpc.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(Object.keys(args).some((k) => /date|period|day/i.test(k))).toBe(
      false
    );
  });

  it("short-circuits with no RPC call when the bundle has no quests", async () => {
    getAllQuests.mockResolvedValue({
      quests: [],
      challengeLessonIds: [],
      moduleLessonMap: [],
    });
    expect(await evaluateQuests({ rpc } as never, "user-1")).toEqual([]);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("throws on RPC error so a response-owning caller can 500", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "boom" } });
    await expect(evaluateQuests({ rpc } as never, "user-1")).rejects.toThrow(
      "boom"
    );
  });
});

describe("runQuestEvaluation — idempotency across paths (no double-award)", () => {
  it("awards a quest ONCE even when three action paths fire in the same day", async () => {
    const fake = fakeQuestRpc();
    rpc.mockImplementation(fake.impl);

    // Lesson completed → the quest's target is now met.
    fake.completeTheQuest();

    // Three independent server paths evaluate (lesson complete, the completion
    // webhook mirroring the same lesson, then the dashboard poll).
    const first = await runQuestEvaluation("user-1");
    const second = await runQuestEvaluation("user-1");
    const third = await runQuestEvaluation("user-1");

    expect(first[0]?.justAwarded).toBe(true);
    expect(second[0]?.justAwarded).toBe(false);
    expect(third[0]?.justAwarded).toBe(false);
    // …and only ONE XP credit was ever enqueued.
    expect(fake.enqueued).toEqual(["user-1:quest-complete-lesson"]);
    // Every call still reports the quest as complete for the panel.
    expect([first, second, third].every((r) => r[0]?.completed)).toBe(true);
  });

  it("sweeps the learner's pending quest_xp so the credit lands now", async () => {
    rpc.mockResolvedValue({ data: [], error: null });
    await runQuestEvaluation("user-7");
    expect(retryQuestXpForUser).toHaveBeenCalledWith(
      expect.anything(),
      "user-7"
    );
  });
});

describe("scheduleQuestEvaluation — off the hot path, never silent", () => {
  it("defers the work to after() rather than awaiting it inline", async () => {
    rpc.mockResolvedValue({ data: [], error: null });
    const deferred: Array<() => Promise<void>> = [];
    after.mockImplementation((cb) => {
      deferred.push(cb);
    });

    scheduleQuestEvaluation("user-1");

    // Nothing ran yet — the response is not waiting on it.
    expect(rpc).not.toHaveBeenCalled();
    expect(deferred).toHaveLength(1);

    await deferred[0]!();
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(retryQuestXpForUser).toHaveBeenCalledTimes(1);
  });

  it("logs — never swallows — a failed evaluation", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "db down" } });
    const deferred: Array<() => Promise<void>> = [];
    after.mockImplementation((cb) => {
      deferred.push(cb);
    });

    scheduleQuestEvaluation("user-1");
    await deferred[0]!();

    expect(logError).toHaveBeenCalledTimes(1);
    const arg = logError.mock.calls[0]?.[0] as {
      error: Error;
      context: { userId: string };
    };
    expect(arg.error.message).toBe("db down");
    expect(arg.context.userId).toBe("user-1");
  });

  it("still runs (and still logs) when after() is unavailable outside a request", async () => {
    rpc.mockResolvedValue({ data: [], error: null });
    after.mockImplementation(() => {
      throw new Error("after() was called outside a request scope");
    });

    scheduleQuestEvaluation("user-1");
    await vi.waitFor(() => expect(rpc).toHaveBeenCalledTimes(1));
  });
});
