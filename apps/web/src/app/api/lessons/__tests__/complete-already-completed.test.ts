import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// A resubmit of a lesson the learner already completed must never reach the
// on-chain complete_lesson tx — that tx is what cascades into XP, the creator
// reward and the credential mint. The client now locks a completed challenge
// (the Run/Submit path is gone), and this pins the server half of that
// guarantee: the bitmap bit is already set, so the route short-circuits to
// `alreadyCompleted` and no second award is possible.

vi.mock("server-only", () => ({}));

const getUser = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser } }),
}));

const upsert = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table === "profiles") {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: { wallet_address: "11111111111111111111111111111111" },
              }),
            }),
          }),
        };
      }
      return { upsert };
    },
  }),
}));

const getLessonByIdForGrading = vi.fn();
vi.mock("@/lib/content/queries", () => ({ getLessonByIdForGrading }));

const codeGrader = vi.fn();
vi.mock("@/lib/grading/graders", () => ({ GRADERS: { code: codeGrader } }));

vi.mock("@/lib/rate-limit", () => ({
  isRateLimited: async () => false,
  getClientIp: () => "203.0.113.9",
  releaseRateLimit: async () => {},
}));

const onChainCompleteLesson = vi.fn();
vi.mock("@/lib/solana/academy-program", () => ({
  isOnChainProgramLive: async () => true,
  completeLesson: onChainCompleteLesson,
  getConnection: () => ({}),
  getProgramId: () => ({}),
}));

vi.mock("@/lib/solana/academy-reads", () => ({
  fetchEnrollment: async () => ({ lesson_flags: [1n, 0n, 0n, 0n] }),
  fetchCourse: async () => ({ activeLessons: [1n, 0n, 0n, 0n] }),
}));

vi.mock("@/lib/courses/lesson-slot", () => ({ getLessonSlot: () => 0 }));
vi.mock("@/lib/content/deployments", () => ({
  isCourseInMaintenance: async () => false,
}));
vi.mock("@/lib/platform/freeze", () => ({
  isPlatformFrozen: async () => false,
}));
vi.mock("@/lib/gamification/quest-evaluation", () => ({
  scheduleQuestEvaluation: vi.fn(),
}));
vi.mock("@/lib/review/schedule-review", () => ({
  captureReviewFailure: async () => {},
}));

const CODE_BLOCK = {
  _type: "code",
  key: "c1",
  language: "typescript",
  starterCode: "",
  tests: [],
};

function makeRequest(): NextRequest {
  return new NextRequest("http://localhost/api/lessons/complete", {
    method: "POST",
    body: JSON.stringify({
      lessonId: "lesson-1",
      courseId: "course-1",
      proofs: { c1: { code: "export function add() { return 2; }" } },
    }),
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  vi.resetModules();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
  getUser.mockReset().mockResolvedValue({ data: { user: { id: "user-1" } } });
  getLessonByIdForGrading
    .mockReset()
    .mockResolvedValue({ _id: "lesson-1", blocks: [CODE_BLOCK] });
  codeGrader.mockReset().mockResolvedValue({ ok: true });
  upsert.mockReset().mockResolvedValue({ error: null });
  onChainCompleteLesson.mockReset();
});

describe("POST /api/lessons/complete — lesson already completed", () => {
  it("short-circuits without a second on-chain award", async () => {
    const { POST } = await import("../complete/route");
    const response = await POST(makeRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      alreadyCompleted: true,
      signature: null,
    });
    expect(onChainCompleteLesson).not.toHaveBeenCalled();
  });
});
