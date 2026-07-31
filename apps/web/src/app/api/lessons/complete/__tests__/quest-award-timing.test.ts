/* eslint-disable import/order -- vi.mock calls must precede importing the route. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Owner-reported defect (2026-07-31), part 1: daily quests were only evaluated
// and rewarded by GET /api/quests/daily, whose only real caller is the
// dashboard. A learner completing lessons without visiting /dashboard got quest
// XP late — or never.
//
// RED PROOF: run this file against the parent commit (or with the
// `scheduleQuestEvaluation(user.id)` calls removed from the route) and the two
// "evaluates daily quests" cases below fail with 0 calls — that IS the bug: the
// completion that satisfies the quest goes by without anything evaluating it.
// GREEN: the completion path itself now evaluates.
//
// The complementary guarantees live next door: idempotency (one award across N
// firing paths) in lib/gamification/__tests__/quest-evaluation.test.ts, and the
// poll-vs-Realtime toast dedupe in
// lib/gamification/__tests__/server-xp-feedback.test.ts.

vi.mock("server-only", () => ({}));

const {
  getUser,
  singleProfile,
  upsertProgress,
  getLessonByIdForGrading,
  getCourseById,
  isOnChainProgramLive,
  isRateLimited,
  isCourseInMaintenance,
  isPlatformFrozen,
  completeLesson,
  fetchEnrollment,
  fetchCourse,
  isLessonComplete,
  scheduleQuestEvaluation,
} = vi.hoisted(() => ({
  getUser: vi.fn<() => Promise<unknown>>(),
  singleProfile: vi.fn<() => Promise<unknown>>(),
  upsertProgress: vi.fn<() => Promise<unknown>>(),
  getLessonByIdForGrading: vi.fn(),
  getCourseById: vi.fn(),
  isOnChainProgramLive: vi.fn<() => Promise<boolean>>(),
  isRateLimited: vi.fn<(ns: string, key: string) => Promise<boolean>>(),
  isCourseInMaintenance: vi.fn<() => Promise<boolean>>(),
  isPlatformFrozen: vi.fn<() => Promise<boolean>>(),
  completeLesson: vi.fn<() => Promise<string>>(),
  fetchEnrollment: vi.fn<() => Promise<unknown>>(),
  fetchCourse: vi.fn<() => Promise<unknown>>(),
  isLessonComplete: vi.fn<() => boolean>(),
  scheduleQuestEvaluation: vi.fn<(userId: string) => void>(),
}));

vi.mock("@/lib/rate-limit", () => ({
  isRateLimited: (ns: string, key: string) => isRateLimited(ns, key),
  releaseRateLimit: () => Promise.resolve(),
  getClientIp: () => "203.0.113.7",
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser } }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ single: singleProfile }) }),
      upsert: upsertProgress,
    }),
  }),
}));
vi.mock("@/lib/content/queries", () => ({
  getLessonByIdForGrading,
  getCourseById,
}));
vi.mock("@/lib/grading/graders", () => ({ GRADERS: {} }));
vi.mock("@/lib/review/schedule-review", () => ({
  captureReviewFailure: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/ai/check-seal", () => ({ openAttestation: () => true }));
vi.mock("@/lib/solana/academy-program", () => ({
  isOnChainProgramLive,
  completeLesson,
  getConnection: vi.fn(),
  getProgramId: vi.fn(),
}));
vi.mock("@/lib/solana/academy-reads", () => ({ fetchEnrollment, fetchCourse }));
vi.mock("@/lib/solana/bitmap", () => ({ isLessonComplete }));
vi.mock("@/lib/courses/lesson-slot", () => ({ getLessonSlot: () => 0 }));
vi.mock("@/lib/logging", () => ({ logError: vi.fn() }));
vi.mock("@/lib/content/deployments", () => ({ isCourseInMaintenance }));
vi.mock("@/lib/platform/freeze", () => ({ isPlatformFrozen }));
vi.mock("@/lib/gamification/quest-evaluation", () => ({
  scheduleQuestEvaluation,
}));

import { POST } from "../route";

const PROSE_LESSON = { blocks: [{ _type: "prose", key: "p1", src: "hi" }] };

function req(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/lessons/complete", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

const call = (extra: Record<string, unknown> = {}) =>
  POST(
    req({ lessonId: "lesson-1", courseId: "course-1", proofs: {}, ...extra })
  );

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "srk";
  getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
  singleProfile.mockResolvedValue({
    data: { wallet_address: "11111111111111111111111111111111" },
  });
  upsertProgress.mockResolvedValue({ error: null });
  getLessonByIdForGrading.mockResolvedValue(PROSE_LESSON);
  getCourseById.mockResolvedValue({ modules: [] });
  isOnChainProgramLive.mockResolvedValue(true);
  isCourseInMaintenance.mockResolvedValue(false);
  isPlatformFrozen.mockResolvedValue(false);
  fetchEnrollment.mockResolvedValue({ lesson_flags: [0, 0, 0, 0] });
  fetchCourse.mockResolvedValue({ liveLessonCount: 10 });
  isLessonComplete.mockReturnValue(false);
  completeLesson.mockResolvedValue("sig-123");
  isRateLimited.mockResolvedValue(false);
});

describe("quest evaluation fires from the lesson-completion path", () => {
  it("evaluates daily quests for the learner on a successful completion", async () => {
    const res = await call();

    expect(res.status).toBe(200);
    expect(upsertProgress).toHaveBeenCalledTimes(1);
    // The write that can satisfy a quest happened → the quest is evaluated NOW,
    // not on some future dashboard visit.
    expect(scheduleQuestEvaluation).toHaveBeenCalledTimes(1);
    expect(scheduleQuestEvaluation).toHaveBeenCalledWith("user-1");
  });

  it("evaluates daily quests on the already-on-chain recovery sync too", async () => {
    // The bit is already set on-chain; the route still mirrors user_progress,
    // and that mirror can be the row that completes a quest.
    isLessonComplete.mockReturnValue(true);

    const res = await call();

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ alreadyCompleted: true });
    expect(scheduleQuestEvaluation).toHaveBeenCalledWith("user-1");
  });

  it("does NOT evaluate when the completion was denied (no progress written)", async () => {
    // A required reflection with no attestation → 403 before any progress row.
    getLessonByIdForGrading.mockResolvedValue({
      blocks: [{ _type: "openEnded", key: "o1" }],
    });

    const res = await call({ proofs: {} });

    expect(res.status).toBe(403);
    expect(scheduleQuestEvaluation).not.toHaveBeenCalled();
  });

  it("does NOT evaluate when the request is throttled before doing work", async () => {
    isRateLimited.mockResolvedValue(true);

    const res = await call();

    expect(res.status).toBe(429);
    expect(scheduleQuestEvaluation).not.toHaveBeenCalled();
  });

  it("never blocks the response on the evaluation (it is scheduled, not awaited)", async () => {
    // The route hands the work to scheduleQuestEvaluation, which defers it into
    // Next's after() continuation (proved in quest-evaluation.test.ts). A
    // synchronous void return here is what keeps the hot path latency-neutral:
    // the route cannot await something that returns nothing.
    scheduleQuestEvaluation.mockImplementation(() => undefined);
    const res = await call();
    expect(res.status).toBe(200);
    expect(scheduleQuestEvaluation.mock.results[0]?.value).toBeUndefined();
  });
});
