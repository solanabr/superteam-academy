/* eslint-disable import/order -- vi.mock('server-only') must be hoisted above
   the module imports so the `server-only` graph loads under vitest. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Keypair } from "@solana/web3.js";

// #736 (adversarial-review MINOR): the SECURITY-critical part of #736 is the
// EXPLICIT p_source each award_xp call site passes — especially handleXpRewarded,
// which pins 'platform' so an arbitrary authority memo can't reverse-derive into
// a league-eligible source. That value is convention, not structure, so it must
// be pinned by a test: a future edit (or the reviewer's mutation flipping
// 'platform' → 'lesson') must fail CI here.

vi.mock("server-only", () => ({}));

const { resolveUserId, resolveCourseId, resolveLessonId, awardXpCalls, rpc } =
  vi.hoisted(() => {
    const awardXpCalls: Array<Record<string, unknown>> = [];
    return {
      resolveUserId: vi.fn<(addr: string) => Promise<string | null>>(),
      resolveCourseId: vi.fn<() => Promise<string | null>>(),
      resolveLessonId: vi.fn<() => Promise<string | null>>(),
      awardXpCalls,
      rpc: vi.fn((fn: string, params: Record<string, unknown>) => {
        if (fn === "award_xp") awardXpCalls.push(params);
        return Promise.resolve({ data: 10, error: null });
      }),
    };
  });

// A chainable admin-client stub: every query-builder method returns the same
// chain, and awaiting it (or .single()) resolves a benign empty result — so the
// non-target work in each handler (progress upsert, enrollment update, credential
// / achievement / finalize side-paths) runs without throwing, and only the
// award_xp rpc calls are captured.
vi.mock("@/lib/supabase/admin", () => {
  const chain: Record<string, unknown> = {};
  const result = { data: null, error: null };
  for (const m of [
    "select",
    "insert",
    "upsert",
    "update",
    "delete",
    "eq",
    "in",
    "order",
    "limit",
  ]) {
    chain[m] = () => chain;
  }
  chain.single = () => Promise.resolve(result);
  chain.maybeSingle = () => Promise.resolve(result);
  chain.then = (onF: (v: typeof result) => unknown) =>
    Promise.resolve(result).then(onF);
  return {
    createAdminClient: () => ({ from: () => chain, rpc }),
  };
});

// Non-target collaborators → inert (they must not fire their own award_xp).
vi.mock("@/lib/helius/resolvers", () => ({
  resolveUserId,
  resolveCourseId,
  resolveLessonId,
}));
vi.mock("@/lib/gamification/surprise-bonus", () => ({
  maybeAwardSurpriseBonus: vi.fn(async () => undefined),
}));
vi.mock("@/lib/solana/pda", () => ({ getProgramId: () => "program-id" }));
vi.mock("@/lib/solana/academy-program", () => ({
  getConnection: () => ({}),
  finalizeCourse: vi.fn(),
  issueCredential: vi.fn(),
  awardAchievement: vi.fn(),
}));
vi.mock("@/lib/solana/academy-reads", () => ({
  fetchEnrollment: vi.fn(async () => null),
  fetchCourse: vi.fn(async () => null),
}));
vi.mock("@/lib/solana/bitmap", () => ({ isCourseComplete: () => false }));
vi.mock("@/lib/content/deployments", () => ({
  isCourseInMaintenance: vi.fn(async () => false),
}));
vi.mock("@/lib/platform/freeze", () => ({
  isPlatformFrozen: vi.fn(async () => false),
}));
vi.mock("@/lib/content/queries", () => ({
  getCourseById: vi.fn(async () => null),
  getDeployedAchievements: vi.fn(async () => []),
}));
vi.mock("@/lib/gamification/achievements", () => ({
  checkNewAchievements: vi.fn(() => []),
  buildUserState: vi.fn(),
}));
vi.mock("@/lib/solana/arweave", () => ({ uploadCertificateMetadata: vi.fn() }));
vi.mock("@/lib/logging", () => ({ logError: vi.fn() }));

import {
  handleLessonCompleted,
  handleCourseFinalized,
  handleAchievementAwarded,
  handleXpRewarded,
} from "../event-handlers";

const SIG = "sig-1";
// The handlers construct real PublicKeys from these addresses (credential /
// finalize side-paths), so they must be valid base58.
const LEARNER = Keypair.generate().publicKey.toBase58();
const COURSE = Keypair.generate().publicKey.toBase58();
const CREATOR = Keypair.generate().publicKey.toBase58();
const ASSET = Keypair.generate().publicKey.toBase58();

/** The p_source of the captured award_xp call whose idempotency key ends `key`. */
function sourceForKey(key: string): unknown {
  const call = awardXpCalls.find((c) =>
    String(c.p_idempotency_key ?? "").endsWith(key)
  );
  expect(call, `award_xp call for ${key}`).toBeDefined();
  return call?.p_source;
}

beforeEach(() => {
  awardXpCalls.length = 0;
  vi.clearAllMocks();
  resolveUserId.mockImplementation(async (addr: string) =>
    addr === CREATOR ? "creator-1" : "user-1"
  );
  resolveCourseId.mockResolvedValue("course-1");
  resolveLessonId.mockResolvedValue("lesson-1");
});

describe("#736 award_xp call-site sources are explicit (not reverse-derived)", () => {
  it("handleXpRewarded pins 'platform' — an arbitrary memo can NEVER launder into eligibility", async () => {
    // THE fix. Note the memo is shaped like an eligible source on purpose.
    await handleXpRewarded(
      {
        recipient: LEARNER,
        amount: 500n,
        memo: "Completed lesson: totally-legit",
      } as never,
      SIG
    );
    expect(sourceForKey("XpRewarded")).toBe("platform");
  });

  it("handleLessonCompleted passes 'lesson'", async () => {
    await handleLessonCompleted(
      {
        learner: LEARNER,
        course: COURSE,
        lessonIndex: 0,
        xpEarned: 25,
        timestamp: 1_700_000_000,
      } as never,
      SIG
    );
    expect(sourceForKey("LessonCompleted")).toBe("lesson");
  });

  it("handleCourseFinalized passes 'course_completion' (bonus) and 'creator_reward' (creator)", async () => {
    await handleCourseFinalized(
      {
        learner: LEARNER,
        course: COURSE,
        creator: CREATOR,
        bonusXp: 200,
        creatorXp: 30,
        timestamp: 1_700_000_000,
      } as never,
      SIG
    );
    expect(sourceForKey("CourseFinalized:bonus")).toBe("course_completion");
    expect(sourceForKey("CourseFinalized:creator")).toBe("creator_reward");
  });

  it("handleAchievementAwarded passes 'achievement'", async () => {
    await handleAchievementAwarded(
      {
        recipient: LEARNER,
        achievementId: "first-steps",
        asset: ASSET,
        xpReward: 50,
      } as never,
      SIG
    );
    expect(sourceForKey("AchievementAwarded:xp")).toBe("achievement");
  });
});
