/* eslint-disable import/order -- vi.mock calls must precede importing the route. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

// Slot-aware completion path (#741). These tests drive the route through to the
// on-chain submit with a C3-shaped sparse course: the target lesson's SLOT (15,
// the capstone) differs from what its array position would be, and slot 14 is a
// retired lesson whose bit may still be set on an old enrollment. They assert
// the SLOT — not array position — is what reaches the bitmap read, the count
// guard, and completeLesson. The bitmap helpers are REAL (not mocked) so the
// slot arithmetic is exercised end-to-end.

const {
  getUser,
  singleProfile,
  upsertProgress,
  getLessonByIdForGrading,
  isOnChainProgramLive,
  isRateLimited,
  isCourseInMaintenance,
  isPlatformFrozen,
  completeLesson,
  fetchEnrollment,
  fetchCourse,
  getLessonSlot,
} = vi.hoisted(() => ({
  getUser: vi.fn<() => Promise<unknown>>(),
  singleProfile: vi.fn<() => Promise<unknown>>(),
  upsertProgress: vi.fn<(row?: unknown) => Promise<unknown>>(),
  getLessonByIdForGrading: vi.fn(),
  isOnChainProgramLive: vi.fn<() => Promise<boolean>>(),
  isRateLimited: vi.fn<() => Promise<boolean>>(),
  isCourseInMaintenance: vi.fn<() => Promise<boolean>>(),
  isPlatformFrozen: vi.fn<() => Promise<boolean>>(),
  completeLesson: vi.fn<() => Promise<string>>(),
  fetchEnrollment: vi.fn<() => Promise<unknown>>(),
  fetchCourse: vi.fn<() => Promise<unknown>>(),
  getLessonSlot: vi.fn<() => number>(),
}));

vi.mock("@/lib/rate-limit", () => ({
  isRateLimited: () => isRateLimited(),
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
vi.mock("@/lib/content/queries", () => ({ getLessonByIdForGrading }));
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
// NOTE: bitmap.ts is intentionally NOT mocked — isLessonComplete runs for real.
vi.mock("@/lib/courses/lesson-slot", () => ({ getLessonSlot }));
vi.mock("@/lib/logging", () => ({ logError: vi.fn() }));
vi.mock("@/lib/content/deployments", () => ({ isCourseInMaintenance }));
vi.mock("@/lib/platform/freeze", () => ({ isPlatformFrozen }));

import { POST } from "../route";

// Prose-only lesson sails through grading, isolating the slot/bitmap path.
const PROSE_LESSON = { blocks: [{ _type: "prose", key: "p1", src: "hi" }] };
const CAPSTONE_SLOT = 15;
const RETIRED_SLOT = 14;

// Build a 4-word [u64;4] mask (as bigints) with the given bits set.
function mask(...bits: number[]): bigint[] {
  const words: [bigint, bigint, bigint, bigint] = [0n, 0n, 0n, 0n];
  for (const b of bits) {
    const w = Math.floor(b / 64) as 0 | 1 | 2 | 3;
    words[w] |= 1n << BigInt(b % 64);
  }
  return words;
}

// Live mask for the C3 course: slots 0..13 and 15 live, 14 retired.
const LIVE_MASK = mask(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15);

function req(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/lessons/complete", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}
const call = () =>
  POST(req({ lessonId: "lesson-capstone", courseId: "course-c3", proofs: {} }));

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
  isOnChainProgramLive.mockResolvedValue(true);
  isCourseInMaintenance.mockResolvedValue(false);
  isPlatformFrozen.mockResolvedValue(false);
  isRateLimited.mockResolvedValue(false);
  completeLesson.mockResolvedValue("sig-capstone");
  getLessonSlot.mockReturnValue(CAPSTONE_SLOT);
  // Default: capstone slot live in the on-chain mask; bitmap all-zero.
  fetchCourse.mockResolvedValue({ activeLessons: LIVE_MASK });
  fetchEnrollment.mockResolvedValue({ lesson_flags: mask() });
});

describe("slot-aware completion (#741)", () => {
  it("sends the SLOT (15), not the array position, to completeLesson", async () => {
    const res = await call();

    expect(res.status).toBe(200);
    expect(completeLesson).toHaveBeenCalledWith(
      "course-c3",
      expect.anything(),
      CAPSTONE_SLOT
    );
    // And user_progress records the slot, not array order.
    const row = upsertProgress.mock.calls.at(-1)?.[0] as
      | { lesson_index?: number }
      | undefined;
    expect(row?.lesson_index).toBe(CAPSTONE_SLOT);
  });

  it("a retired slot's stale set bit never makes a live lesson read as already-complete", async () => {
    // Old enrollment has slot 14 (retired lesson m4-interact) completed on-chain.
    // The capstone is slot 15 — its bit is unset — so completion must proceed and
    // fire the tx, NOT short-circuit as already-done on the neighbouring bit.
    fetchEnrollment.mockResolvedValue({ lesson_flags: mask(RETIRED_SLOT) });

    const res = await call();
    const body = (await res.json()) as { alreadyCompleted?: boolean };

    expect(res.status).toBe(200);
    expect(body.alreadyCompleted).toBeUndefined();
    expect(completeLesson).toHaveBeenCalledWith(
      "course-c3",
      expect.anything(),
      CAPSTONE_SLOT
    );
  });

  it("is idempotent on the SLOT bit: capstone already set → no tx, alreadyCompleted", async () => {
    fetchEnrollment.mockResolvedValue({ lesson_flags: mask(CAPSTONE_SLOT) });

    const res = await call();
    const body = (await res.json()) as { alreadyCompleted?: boolean };

    expect(res.status).toBe(200);
    expect(body.alreadyCompleted).toBe(true);
    expect(completeLesson).not.toHaveBeenCalled();
  });

  it("count guard is a per-slot bit test: slot not live in the mask → 409, no tx", async () => {
    // Mask does NOT include slot 15 (admin re-sync of active_lessons pending).
    // A count/popcount compare would let a high slot through or wrongly gate a
    // low one; the bit test correctly refuses this un-synced slot.
    fetchCourse.mockResolvedValue({ activeLessons: mask(0, 1, 2, 3, 4) });

    const res = await call();

    expect(res.status).toBe(409);
    expect(completeLesson).not.toHaveBeenCalled();
  });

  it("a capstone at slot 15 is NOT 409'd when popcount(active) == 15 (the C3 trap)", async () => {
    // LIVE_MASK has popcount 15 (slots 0..13 + 15) but slot 15 IS live. The old
    // count guard (`slot >= popcount`) would 409 this valid capstone; the bit
    // test lets it through.
    const res = await call();

    expect(res.status).toBe(200);
    expect(completeLesson).toHaveBeenCalledWith(
      "course-c3",
      expect.anything(),
      CAPSTONE_SLOT
    );
  });

  it("fails CLOSED when the lesson has no slot — 500, never an array-index tx", async () => {
    getLessonSlot.mockImplementation(() => {
      throw new Error("Lesson has no slot in course (retired or unknown)");
    });

    const res = await call();

    expect(res.status).toBe(500);
    expect(completeLesson).not.toHaveBeenCalled();
  });
});
