/* eslint-disable import/order -- vi.mock calls must precede importing the route. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

// A learner whose XP token account is closed after its one platform funding
// gets a machine reason the client turns into translated copy, and no
// progress is written. A funding already in flight reads as "in progress".

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
import {
  XpAccountClosedError,
  XpAccountFundingInFlightError,
} from "@/lib/solana/xp-account-errors";

// A prose-only lesson sails through grading (prose is neither graded nor a
// required-ungraded block), so these tests isolate the in-flight guard.
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

describe("closed XP token account", () => {
  it("answers 409 with reason xp_account_closed and writes no progress", async () => {
    completeLesson.mockRejectedValue(
      new XpAccountClosedError("11111111111111111111111111111111", "MINT")
    );

    const res = await call();

    expect(res.status).toBe(409);
    const body = (await res.json()) as { reason?: string };
    expect(body.reason).toBe("xp_account_closed");
    expect(upsertProgress).not.toHaveBeenCalled();
  });

  it("answers 429 completion_in_progress while a funding is in flight", async () => {
    completeLesson.mockRejectedValue(
      new XpAccountFundingInFlightError("11111111111111111111111111111111")
    );

    const res = await call();

    expect(res.status).toBe(429);
    // Matches the in-flight bucket's 30 s window.
    expect(res.headers.get("Retry-After")).toBe("30");
    const body = (await res.json()) as { reason?: string };
    expect(body.reason).toBe("completion_in_progress");
    expect(upsertProgress).not.toHaveBeenCalled();
  });
});
