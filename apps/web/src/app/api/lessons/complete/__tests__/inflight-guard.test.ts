/* eslint-disable import/order -- vi.mock calls must precede importing the route. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

// Per-(user,lesson) in-flight guard (#651). These tests drive the route all the
// way past grading + enrollment + the stale bitmap read, to the boundary where
// the guard wraps the on-chain complete_lesson submit — the critical section
// where N concurrent duplicates would each burn a reverted-tx base fee.

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
} = vi.hoisted(() => ({
  getUser: vi.fn<() => Promise<unknown>>(),
  singleProfile: vi.fn<() => Promise<unknown>>(),
  upsertProgress: vi.fn<() => Promise<unknown>>(),
  getLessonByIdForGrading: vi.fn(),
  getCourseById: vi.fn(),
  isOnChainProgramLive: vi.fn<() => Promise<boolean>>(),
  // Records (namespace, key) so tests can assert the guard is keyed per
  // (user, lesson) and only queried once grading has passed.
  isRateLimited: vi.fn<(ns: string, key: string) => Promise<boolean>>(),
  isCourseInMaintenance: vi.fn<() => Promise<boolean>>(),
  isPlatformFrozen: vi.fn<() => Promise<boolean>>(),
  completeLesson: vi.fn<() => Promise<string>>(),
  fetchEnrollment: vi.fn<() => Promise<unknown>>(),
  fetchCourse: vi.fn<() => Promise<unknown>>(),
  isLessonComplete: vi.fn<() => boolean>(),
}));

vi.mock("@/lib/rate-limit", () => ({
  isRateLimited: (ns: string, key: string) => isRateLimited(ns, key),
  releaseRateLimit: () => Promise.resolve(),
  getClientIp: () => "203.0.113.7",
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser } }),
}));

// profiles → single(); user_progress → upsert(). One from() serves both.
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

import { POST } from "../route";

// A prose-only lesson sails through grading (prose is neither graded nor a
// required-ungraded block), so these tests isolate the in-flight guard.
const PROSE_LESSON = { blocks: [{ _type: "prose", key: "p1", src: "hi" }] };
const INFLIGHT_NS = "lessons:complete:inflight";

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
  // A syntactically valid base58 pubkey (System Program) so `new PublicKey`
  // succeeds and the route reaches the on-chain path.
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
  isLessonComplete.mockReturnValue(false); // bitmap bit not yet set
  completeLesson.mockResolvedValue("sig-123");
  // Default: every rate-limit/guard check is clear.
  isRateLimited.mockResolvedValue(false);
});

describe("in-flight guard (#651)", () => {
  it("a second concurrent request 429s while the first is in flight — no tx fired", async () => {
    // The guard reports the (user,lesson) bucket already spent (the first
    // request holds it) → this duplicate must be refused before submitting.
    isRateLimited.mockImplementation(async (ns) => ns === INFLIGHT_NS);

    const res = await call();

    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("30");
    const body = (await res.json()) as { reason?: string };
    expect(body.reason).toBe("completion_in_progress");
    // The whole point: the reverted-fee-burning tx never runs.
    expect(completeLesson).not.toHaveBeenCalled();
    expect(upsertProgress).not.toHaveBeenCalled();
  });

  it("the first request (guard clear) submits and the guard is keyed per (user, lesson)", async () => {
    const res = await call();

    expect(res.status).toBe(200);
    expect(completeLesson).toHaveBeenCalledTimes(1);
    // Keyed on user + lesson so it never bleeds into a learner's other lessons.
    expect(isRateLimited).toHaveBeenCalledWith(INFLIGHT_NS, "user-1:lesson-1");
  });

  it("guard sits AFTER grading: a failed completion never spends the lock", async () => {
    // A required reflection with no attestation → 403 at the grading stage,
    // well before the guard. A learner retrying such a failure must not be
    // locked out, so the in-flight namespace must never be queried.
    getLessonByIdForGrading.mockResolvedValue({
      blocks: [{ _type: "openEnded", key: "o1" }],
    });

    const res = await call({ proofs: {} });

    expect(res.status).toBe(403);
    expect(isRateLimited).not.toHaveBeenCalledWith(
      INFLIGHT_NS,
      expect.anything()
    );
  });

  it("an already-completed lesson short-circuits BEFORE the guard (legit re-fire, not a 429)", async () => {
    isLessonComplete.mockReturnValue(true); // bit already set on-chain

    const res = await call();

    expect(res.status).toBe(200);
    const body = (await res.json()) as { alreadyCompleted?: boolean };
    expect(body.alreadyCompleted).toBe(true);
    expect(completeLesson).not.toHaveBeenCalled();
    // Never reaches the guard — a completed re-fire is not "in progress".
    expect(isRateLimited).not.toHaveBeenCalledWith(
      INFLIGHT_NS,
      expect.anything()
    );
  });

  it("the replay path is still guarded — a forged same-lesson replay flood is caught", async () => {
    isRateLimited.mockImplementation(async (ns) => ns === INFLIGHT_NS);

    const res = await call({ replay: true });

    expect(res.status).toBe(429);
    const body = (await res.json()) as { reason?: string };
    expect(body.reason).toBe("completion_in_progress");
    expect(completeLesson).not.toHaveBeenCalled();
  });

  it("guard failing OPEN (store blip) lets the completion through — never blocks a learner", async () => {
    // isRateLimited already fails open internally; at the route this surfaces as
    // `false` (not over budget). The completion proceeds — degrading to today's
    // pre-existing race, never to a blocked lesson.
    isRateLimited.mockResolvedValue(false);

    const res = await call();

    expect(res.status).toBe(200);
    expect(completeLesson).toHaveBeenCalledTimes(1);
  });
});
