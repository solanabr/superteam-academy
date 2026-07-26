/* eslint-disable import/order -- vi.mock calls must precede importing the route. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import type { GradeResult } from "@/lib/grading/types";

vi.mock("server-only", () => ({}));

// Pre-grading submission-dedup guard (#693). It is a true IN-PROGRESS LOCK:
// acquire a 1-token key keyed on the submission fingerprint, then RELEASE it in
// a `finally` on every exit. So concurrent duplicates 429 only WHILE a twin is
// processing, and an honest sequential resubmit (identical or not) finds the key
// free and re-grades — getting its real 403/reason, never a false 429.

const {
  getUser,
  singleProfile,
  upsertProgress,
  getLessonByIdForGrading,
  getCourseById,
  codeGrader,
  isRateLimited,
  releaseRateLimit,
  isOnChainProgramLive,
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
  codeGrader: vi.fn<() => Promise<GradeResult>>(),
  // Records BOTH (namespace, key) so tests can assert the guard is keyed on the
  // proofs fingerprint, and can drive a stateful lock (acquire/release).
  isRateLimited: vi.fn<(ns: string, key: string) => Promise<boolean>>(),
  releaseRateLimit: vi.fn<(ns: string, key: string) => Promise<void>>(),
  isOnChainProgramLive: vi.fn<() => Promise<boolean>>(),
  isCourseInMaintenance: vi.fn<() => Promise<boolean>>(),
  isPlatformFrozen: vi.fn<() => Promise<boolean>>(),
  completeLesson: vi.fn<() => Promise<string>>(),
  fetchEnrollment: vi.fn<() => Promise<unknown>>(),
  fetchCourse: vi.fn<() => Promise<unknown>>(),
  isLessonComplete: vi.fn<() => boolean>(),
}));

vi.mock("@/lib/rate-limit", () => ({
  isRateLimited: (ns: string, key: string) => isRateLimited(ns, key),
  releaseRateLimit: (ns: string, key: string) => releaseRateLimit(ns, key),
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

vi.mock("@/lib/grading/graders", () => ({
  GRADERS: { code: () => codeGrader() },
}));

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

// A code block routes through GRADERS.code, so codeGrader running (or not) is a
// direct proxy for "the grading suite ran".
const CODE_LESSON = { blocks: [{ _type: "code", key: "c1" }] };
const DEDUP_NS = "lessons:complete:grading-dedup";

function req(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/lessons/complete", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

const call = (proofs: Record<string, unknown>) =>
  POST(req({ lessonId: "lesson-1", courseId: "course-1", proofs }));

/** Keys the route passed to the grading-dedup namespace, in call order. */
const dedupKeys = () =>
  isRateLimited.mock.calls.filter((c) => c[0] === DEDUP_NS).map((c) => c[1]);

/**
 * Install a real acquire/release lock over the dedup namespace: first sight of a
 * key acquires it, a concurrent second sight is refused, and `releaseRateLimit`
 * hands it back. With sequentially-awaited test calls this models the honest
 * path — each request releases before the next begins, so a resubmit re-grades.
 */
function statefulLock(): Set<string> {
  const held = new Set<string>();
  isRateLimited.mockImplementation(async (ns, key) => {
    if (ns !== DEDUP_NS) return false; // volume gates always clear here
    if (held.has(key)) return true; // a twin is mid-flight
    held.add(key);
    return false;
  });
  releaseRateLimit.mockImplementation(async (ns, key) => {
    if (ns === DEDUP_NS) held.delete(key);
  });
  return held;
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "srk";
  getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
  // A syntactically valid base58 pubkey (System Program) so `new PublicKey`
  // succeeds and the route can reach the on-chain path when a test needs it.
  singleProfile.mockResolvedValue({
    data: { wallet_address: "11111111111111111111111111111111" },
  });
  upsertProgress.mockResolvedValue({ error: null });
  getLessonByIdForGrading.mockResolvedValue(CODE_LESSON);
  getCourseById.mockResolvedValue({ modules: [] });
  isOnChainProgramLive.mockResolvedValue(true);
  isCourseInMaintenance.mockResolvedValue(false);
  isPlatformFrozen.mockResolvedValue(false);
  fetchEnrollment.mockResolvedValue({ lesson_flags: [0, 0, 0, 0] });
  fetchCourse.mockResolvedValue({ liveLessonCount: 10 });
  isLessonComplete.mockReturnValue(false);
  completeLesson.mockResolvedValue("sig-123");
  // Default: grading FAILS, keeping most tests on the cheap 403 path while still
  // proving the grader RAN. Tests that need the on-chain path flip this to ok.
  codeGrader.mockResolvedValue({ ok: false, status: 403 });
  // Default: every gate/guard clear; release is a no-op unless a test drives it.
  isRateLimited.mockResolvedValue(false);
  releaseRateLimit.mockResolvedValue(undefined);
});

describe("in-progress lock — concurrent duplicates (#693)", () => {
  it("a twin holding the lock → 429, grading does not run, and the twin's lock is NOT released", async () => {
    // The dedup key already reads as held (a twin request is processing) → this
    // duplicate must be refused before the graders run.
    isRateLimited.mockImplementation(async (ns) => ns === DEDUP_NS);

    const res = await call({ c1: { code: "correct" } });

    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("30");
    const body = (await res.json()) as { reason?: string };
    expect(body.reason).toBe("completion_in_progress");
    // Grading never runs for the deduped duplicate.
    expect(codeGrader).not.toHaveBeenCalled();
    // We did NOT acquire the lock, so we must NOT release it — that would free
    // the twin's lock and defeat the dedup.
    expect(releaseRateLimit).not.toHaveBeenCalled();
  });

  it("the acquiring request grades, then releases the SAME fingerprint key it acquired", async () => {
    const res = await call({ c1: { code: "wrong" } });

    expect(res.status).toBe(403);
    expect(codeGrader).toHaveBeenCalledTimes(1);
    const acquiredKey = dedupKeys()[0];
    expect(acquiredKey).toMatch(/^user-1:lesson-1:[a-f0-9]{64}$/);
    expect(releaseRateLimit).toHaveBeenCalledWith(DEDUP_NS, acquiredKey);
  });
});

describe("lock released on every exit — honest resubmit re-grades (#693)", () => {
  it("failed grading → identical resubmit RE-GRADES and returns the real 403 reason, not 429", async () => {
    statefulLock();
    codeGrader.mockResolvedValue({ ok: false, status: 403 });

    const first = await call({ c1: { code: "wrong" } });
    expect(first.status).toBe(403);
    expect(((await first.json()) as { reason?: string }).reason).toBe(
      "challenge_failed"
    );
    expect(codeGrader).toHaveBeenCalledTimes(1);

    // Byte-identical resubmit within the window: the lock was released after the
    // first failure, so this re-grades and gets its true reason (NOT 429).
    const second = await call({ c1: { code: "wrong" } });
    expect(second.status).toBe(403);
    expect(((await second.json()) as { reason?: string }).reason).toBe(
      "challenge_failed"
    );
    expect(codeGrader).toHaveBeenCalledTimes(2);
  });

  it("wallet-not-connected → identical resubmit gets the wallet reason again, never 429", async () => {
    statefulLock();
    codeGrader.mockResolvedValue({ ok: true }); // grading passes
    singleProfile.mockResolvedValue({ data: { wallet_address: null } });

    const first = await call({ c1: { code: "correct" } });
    expect(first.status).toBe(400);
    expect(((await first.json()) as { error?: string }).error).toMatch(
      /Wallet not connected/
    );

    const second = await call({ c1: { code: "correct" } });
    expect(second.status).toBe(400); // the true reason, not a false 429
    expect(((await second.json()) as { error?: string }).error).toMatch(
      /Wallet not connected/
    );
  });

  it("a thrown on-chain submit still releases the lock (finally) → resubmit re-grades and can succeed", async () => {
    statefulLock();
    codeGrader.mockResolvedValue({ ok: true }); // grading passes → reaches submit
    completeLesson.mockRejectedValueOnce(new Error("RPC unreachable"));

    const first = await call({ c1: { code: "correct" } });
    expect(first.status).toBe(500); // outer catch
    expect(codeGrader).toHaveBeenCalledTimes(1);

    // Despite the throw, `finally` released the lock, so an identical resubmit is
    // not stuck on a leaked 429 — it re-grades and, with the RPC back, completes.
    const second = await call({ c1: { code: "correct" } });
    expect(second.status).toBe(200);
    expect(codeGrader).toHaveBeenCalledTimes(2);
    expect(completeLesson).toHaveBeenCalledTimes(2);
  });
});

describe("submission fingerprint keying (#693)", () => {
  it("is keyed on user + lesson + proofs fingerprint (a 64-hex digest)", async () => {
    await call({ c1: { code: "correct" } });

    const keys = dedupKeys();
    expect(keys).toHaveLength(1);
    expect(keys[0]).toMatch(/^user-1:lesson-1:[a-f0-9]{64}$/);
  });

  it("identical proofs → identical key; a different attempt → a different key", async () => {
    await call({ c1: { code: "attempt-A" } });
    await call({ c1: { code: "attempt-A" } });
    await call({ c1: { code: "attempt-B" } });

    const [firstA, secondA, b] = dedupKeys();
    expect(firstA).toBe(secondA); // a true duplicate collides
    expect(b).not.toBe(firstA); // a genuine re-attempt does not
  });

  it("fingerprint is order-independent — key spelling order does not change the key", async () => {
    await call({ c1: { code: "x" }, c2: { code: "y" } });
    await call({ c2: { code: "y" }, c1: { code: "x" } });

    const [first, second] = dedupKeys();
    expect(first).toBe(second);
  });
});

describe("fail-open (#693)", () => {
  it("a store blip lets grading proceed, never blocking a learner", async () => {
    // isRateLimited fails open internally; at the route a blip surfaces as
    // `false` (not over budget), so the completion path continues into grading.
    isRateLimited.mockResolvedValue(false);

    const res = await call({ c1: { code: "wrong" } });

    expect(res.status).toBe(403); // reached grading, not short-circuited
    expect(codeGrader).toHaveBeenCalledTimes(1);
  });
});
