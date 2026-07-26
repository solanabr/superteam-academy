/* eslint-disable import/order -- vi.mock calls must precede importing the route. */
// The 403 `reason` discriminator (#564): the route's 403 bodies must carry a
// machine string the client can map to the RIGHT localized copy — without it a
// failed quiz rendered the "verify enrollment" message. Companion to
// gate.test.ts, with BOTH graders registered (gate.test.ts deliberately omits
// `quiz` to prove the no-grader 503 path).
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import type { GradeResult } from "@/lib/grading/types";

vi.mock("server-only", () => ({}));

const {
  getUser,
  singleProfile,
  getLessonByIdForGrading,
  getCourseById,
  codeGrader,
  quizGrader,
  openAttestation,
  isOnChainProgramLive,
  isRateLimited,
  isCourseInMaintenance,
  isPlatformFrozen,
} = vi.hoisted(() => ({
  getUser: vi.fn<() => Promise<unknown>>(),
  singleProfile: vi.fn<() => Promise<unknown>>(),
  getLessonByIdForGrading: vi.fn(),
  getCourseById: vi.fn(),
  codeGrader: vi.fn<() => Promise<GradeResult>>(),
  quizGrader: vi.fn<() => Promise<GradeResult>>(),
  openAttestation: vi.fn<() => boolean>(),
  isOnChainProgramLive: vi.fn<() => Promise<boolean>>(),
  isRateLimited: vi.fn<(ns: string) => Promise<boolean>>(),
  isCourseInMaintenance: vi.fn<() => Promise<boolean>>(),
  isPlatformFrozen: vi.fn<() => Promise<boolean>>(),
}));

vi.mock("@/lib/rate-limit", () => ({
  isRateLimited: (ns: string) => isRateLimited(ns),
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
    }),
  }),
}));

vi.mock("@/lib/content/queries", () => ({
  getLessonByIdForGrading,
  getCourseById,
}));

vi.mock("@/lib/grading/graders", () => ({
  GRADERS: { code: () => codeGrader(), quiz: () => quizGrader() },
}));

vi.mock("@/lib/review/schedule-review", () => ({
  captureReviewFailure: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/ai/check-seal", () => ({
  openAttestation: () => openAttestation(),
}));

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
import { fetchEnrollment } from "@/lib/solana/academy-reads";

function req(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/lessons/complete", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

const call = (proofs: Record<string, unknown> = {}) =>
  POST(req({ lessonId: "lesson-1", courseId: "course-1", proofs }));

interface DenyBody {
  error: string;
  reason?: string;
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "srk";
  getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
  singleProfile.mockResolvedValue({
    data: { wallet_address: "11111111111111111111111111111111" },
  });
  isOnChainProgramLive.mockResolvedValue(true);
  isRateLimited.mockResolvedValue(false);
  isCourseInMaintenance.mockResolvedValue(false);
  isPlatformFrozen.mockResolvedValue(false);
});

describe("403 reason discriminator (#564)", () => {
  it("failed quiz grade → reason 'quiz_failed'", async () => {
    getLessonByIdForGrading.mockResolvedValue({
      blocks: [{ _type: "quiz", key: "q1" }],
    });
    quizGrader.mockResolvedValue({ ok: false, status: 403 });

    const res = await call({ q1: { selections: { x: ["wrong"] } } });

    expect(res.status).toBe(403);
    expect(((await res.json()) as DenyBody).reason).toBe("quiz_failed");
  });

  it("failed code grade → reason 'challenge_failed'", async () => {
    getLessonByIdForGrading.mockResolvedValue({
      blocks: [{ _type: "code", key: "c1" }],
    });
    codeGrader.mockResolvedValue({ ok: false, status: 403 });

    const res = await call({ c1: { code: "wrong" } });

    expect(res.status).toBe(403);
    expect(((await res.json()) as DenyBody).reason).toBe("challenge_failed");
  });

  it("mixed lesson where only the QUIZ fails → 'quiz_failed', not 'challenge_failed'", async () => {
    getLessonByIdForGrading.mockResolvedValue({
      blocks: [
        { _type: "code", key: "c1" },
        { _type: "quiz", key: "q1" },
      ],
    });
    codeGrader.mockResolvedValue({ ok: true });
    quizGrader.mockResolvedValue({ ok: false, status: 403 });

    const res = await call({ c1: { code: "ok" }, q1: { selections: {} } });

    expect(res.status).toBe(403);
    expect(((await res.json()) as DenyBody).reason).toBe("quiz_failed");
  });

  it("missing reflection attestation → reason 'reflection_required'", async () => {
    getLessonByIdForGrading.mockResolvedValue({
      blocks: [{ _type: "openEnded", key: "o1" }],
    });

    const res = await call({});

    expect(res.status).toBe(403);
    expect(((await res.json()) as DenyBody).reason).toBe("reflection_required");
  });

  it("missing on-chain enrollment → reason 'enrollment_missing'", async () => {
    getLessonByIdForGrading.mockResolvedValue({
      blocks: [{ _type: "quiz", key: "q1" }],
    });
    quizGrader.mockResolvedValue({ ok: true });
    vi.mocked(fetchEnrollment).mockResolvedValue(null);

    const res = await call({ q1: { selections: {} } });

    expect(res.status).toBe(403);
    expect(((await res.json()) as DenyBody).reason).toBe("enrollment_missing");
  });

  it("grader 503 (could-not-judge) carries NO reason — the block did not fail", async () => {
    getLessonByIdForGrading.mockResolvedValue({
      blocks: [{ _type: "code", key: "c1" }],
    });
    codeGrader.mockResolvedValue({ ok: false, status: 503 });

    const res = await call({ c1: { code: "x" } });

    expect(res.status).toBe(503);
    expect(((await res.json()) as DenyBody).reason).toBeUndefined();
  });
});
