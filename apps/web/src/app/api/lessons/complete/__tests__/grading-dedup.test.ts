/* eslint-disable import/order -- vi.mock calls must precede importing the route. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import type { GradeResult } from "@/lib/grading/types";

vi.mock("server-only", () => ({}));

// Pre-grading submission-dedup guard (#693). Residual of #651/#690: the
// per-(user,lesson) in-flight guard sits AFTER grading, so N concurrent
// duplicates of the SAME submission each ran the full grading suite before one
// took the on-chain token. This guard dedups them BEFORE grading, keyed on the
// SUBMISSION FINGERPRINT — so a true duplicate short-circuits while a genuine
// re-attempt (different answers → different fingerprint) is never blocked.

const {
  getUser,
  singleProfile,
  getLessonByIdForGrading,
  getCourseById,
  codeGrader,
  isRateLimited,
  isOnChainProgramLive,
  isCourseInMaintenance,
  isPlatformFrozen,
} = vi.hoisted(() => ({
  getUser: vi.fn<() => Promise<unknown>>(),
  singleProfile: vi.fn<() => Promise<unknown>>(),
  getLessonByIdForGrading: vi.fn(),
  getCourseById: vi.fn(),
  codeGrader: vi.fn<() => Promise<GradeResult>>(),
  // Records BOTH (namespace, key) so tests can assert the guard is keyed on the
  // proofs fingerprint, not on (user, lesson) alone.
  isRateLimited: vi.fn<(ns: string, key: string) => Promise<boolean>>(),
  isOnChainProgramLive: vi.fn<() => Promise<boolean>>(),
  isCourseInMaintenance: vi.fn<() => Promise<boolean>>(),
  isPlatformFrozen: vi.fn<() => Promise<boolean>>(),
}));

vi.mock("@/lib/rate-limit", () => ({
  isRateLimited: (ns: string, key: string) => isRateLimited(ns, key),
  getClientIp: () => "203.0.113.7",
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser } }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ single: singleProfile }) }),
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
  completeLesson: vi.fn(),
  getConnection: vi.fn(),
  getProgramId: vi.fn(),
}));
vi.mock("@/lib/solana/academy-reads", () => ({
  fetchEnrollment: vi.fn(),
  fetchCourse: vi.fn(),
}));
vi.mock("@/lib/solana/bitmap", () => ({ isLessonComplete: vi.fn() }));
vi.mock("@/lib/courses/lesson-index", () => ({ findLessonIndex: () => 0 }));
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

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "srk";
  getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
  singleProfile.mockResolvedValue({ data: { wallet_address: "wallet-1" } });
  getLessonByIdForGrading.mockResolvedValue(CODE_LESSON);
  getCourseById.mockResolvedValue({ modules: [] });
  isOnChainProgramLive.mockResolvedValue(false);
  isCourseInMaintenance.mockResolvedValue(false);
  isPlatformFrozen.mockResolvedValue(false);
  // A failed grade keeps every test on the cheap side of the on-chain path while
  // still proving the grader RAN. Behaviour under a passing grade is identical
  // w.r.t. this guard, which sits before grading either way.
  codeGrader.mockResolvedValue({ ok: false, status: 403 });
  // Default: every gate/guard clear.
  isRateLimited.mockResolvedValue(false);
});

describe("pre-grading submission-dedup guard (#693)", () => {
  it("a concurrent duplicate short-circuits BEFORE grading — the suite does not re-run", async () => {
    // The dedup bucket for this submission is already spent (the first request
    // holds it) → this duplicate must be refused before the graders run.
    isRateLimited.mockImplementation(async (ns) => ns === DEDUP_NS);

    const res = await call({ c1: { code: "correct" } });

    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("30");
    const body = (await res.json()) as { reason?: string };
    expect(body.reason).toBe("completion_in_progress");
    // The whole point: the grading suite never runs for the deduped duplicate.
    expect(codeGrader).not.toHaveBeenCalled();
  });

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

  it("real 1-token bucket: same submission twice is deduped, a different one is not", async () => {
    // Emulate the fixed-window 1-token bucket: first sight of a dedup key passes
    // and spends it; a second sight of the SAME key is refused. Every other
    // namespace (the volume gates) always clears.
    const spent = new Set<string>();
    isRateLimited.mockImplementation(async (ns, key) => {
      if (ns !== DEDUP_NS) return false;
      if (spent.has(key)) return true;
      spent.add(key);
      return false;
    });

    // First submission of attempt A → guard clear → grading runs, 403s.
    const first = await call({ c1: { code: "attempt-A" } });
    expect(first.status).toBe(403);
    expect(codeGrader).toHaveBeenCalledTimes(1);

    // Same submission again (duplicate) → deduped → grading does NOT re-run.
    const dup = await call({ c1: { code: "attempt-A" } });
    expect(dup.status).toBe(429);
    const dupBody = (await dup.json()) as { reason?: string };
    expect(dupBody.reason).toBe("completion_in_progress");
    expect(codeGrader).toHaveBeenCalledTimes(1); // unchanged — no second run

    // A genuinely different attempt → new fingerprint → NOT blocked, grading runs.
    const reattempt = await call({ c1: { code: "attempt-B-fixed" } });
    expect(reattempt.status).toBe(403);
    expect(codeGrader).toHaveBeenCalledTimes(2);
  });

  it("403 grading reasons are preserved when the dedup guard is clear", async () => {
    const res = await call({ c1: { code: "wrong" } });

    // The guard ran (before grading) but was clear, so grading proceeded and the
    // failure surfaces with its normal 403 + challenge reason — unchanged by #693.
    expect(res.status).toBe(403);
    const body = (await res.json()) as { reason?: string };
    expect(body.reason).toBe("challenge_failed");
    expect(codeGrader).toHaveBeenCalledTimes(1);
  });

  it("fails OPEN — a store blip lets grading proceed, never blocking a learner", async () => {
    // isRateLimited fails open internally; at the route a blip surfaces as
    // `false` (not over budget), so the completion path continues into grading.
    isRateLimited.mockResolvedValue(false);

    const res = await call({ c1: { code: "wrong" } });

    expect(res.status).toBe(403); // reached grading, not short-circuited
    expect(codeGrader).toHaveBeenCalledTimes(1);
  });
});
