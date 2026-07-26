/* eslint-disable import/order -- vi.mock calls must precede importing the route. */
// LX-B4: a GRADED miss on the completion route's deny path is captured into the
// review substrate; a "could-not-judge" 503 and the non-learning denials
// (enrollment / reflection) are NOT. Capture is best-effort — a capture failure
// must never change the deny response. Shares the mock harness with
// deny-reasons.test.ts.
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
  captureReviewFailure,
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
  captureReviewFailure: vi.fn<() => Promise<void>>(),
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
    from: () => ({ select: () => ({ eq: () => ({ single: singleProfile }) }) }),
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
  captureReviewFailure: (...a: unknown[]) => captureReviewFailure(...(a as [])),
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
vi.mock("@/lib/courses/lesson-slot", () => ({ getLessonSlot: () => 0 }));
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
  captureReviewFailure.mockResolvedValue(undefined);
});

describe("LX-B4 failure capture on the deny path", () => {
  it("captures a failed QUIZ (403) keyed by lesson id, reason quiz_failed", async () => {
    getLessonByIdForGrading.mockResolvedValue({
      blocks: [{ _type: "quiz", key: "q1" }],
    });
    quizGrader.mockResolvedValue({ ok: false, status: 403 });

    const res = await call({ q1: { selections: { x: ["wrong"] } } });

    expect(res.status).toBe(403);
    expect(captureReviewFailure).toHaveBeenCalledTimes(1);
    expect(captureReviewFailure).toHaveBeenCalledWith({
      userId: "user-1",
      lessonId: "lesson-1",
      reason: "quiz_failed",
      failedTests: undefined,
    });
  });

  it("captures a failed CHALLENGE (403) and plumbs its failedTests through", async () => {
    getLessonByIdForGrading.mockResolvedValue({
      blocks: [{ _type: "code", key: "c1" }],
    });
    const failedTests = [
      { id: "t2", hidden: true, passed: false, detail: "wrong output" },
    ];
    codeGrader.mockResolvedValue({ ok: false, status: 403, failedTests });

    const res = await call({ c1: { code: "wrong" } });

    expect(res.status).toBe(403);
    expect(captureReviewFailure).toHaveBeenCalledWith({
      userId: "user-1",
      lessonId: "lesson-1",
      reason: "challenge_failed",
      failedTests,
    });
  });

  it("does NOT capture a 503 (could-not-judge, not a learning signal)", async () => {
    getLessonByIdForGrading.mockResolvedValue({
      blocks: [{ _type: "code", key: "c1" }],
    });
    codeGrader.mockResolvedValue({ ok: false, status: 503 });

    const res = await call({ c1: { code: "x" } });

    expect(res.status).toBe(503);
    expect(captureReviewFailure).not.toHaveBeenCalled();
  });

  it("does NOT capture a missing-enrollment deny (grading passed — not a miss)", async () => {
    getLessonByIdForGrading.mockResolvedValue({
      blocks: [{ _type: "quiz", key: "q1" }],
    });
    quizGrader.mockResolvedValue({ ok: true });
    vi.mocked(fetchEnrollment).mockResolvedValue(null);

    const res = await call({ q1: { selections: {} } });

    expect(res.status).toBe(403);
    expect(captureReviewFailure).not.toHaveBeenCalled();
  });

  it("does NOT capture a missing-reflection deny (not a graded miss)", async () => {
    getLessonByIdForGrading.mockResolvedValue({
      blocks: [{ _type: "openEnded", key: "o1" }],
    });

    const res = await call({});

    expect(res.status).toBe(403);
    expect(captureReviewFailure).not.toHaveBeenCalled();
  });

  it("best-effort: a capture throw NEVER changes the deny response", async () => {
    getLessonByIdForGrading.mockResolvedValue({
      blocks: [{ _type: "quiz", key: "q1" }],
    });
    quizGrader.mockResolvedValue({ ok: false, status: 403 });
    captureReviewFailure.mockRejectedValue(new Error("substrate down"));

    const res = await call({ q1: { selections: { x: ["wrong"] } } });

    expect(res.status).toBe(403);
    expect(((await res.json()) as { reason?: string }).reason).toBe(
      "quiz_failed"
    );
  });
});
