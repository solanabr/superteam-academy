/* eslint-disable import/order -- vi.mock calls must precede importing the module under test. */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const h = vi.hoisted(() => ({
  getCourseById: vi.fn(),
  completeLesson: vi.fn(),
  getConnection: vi.fn(() => ({})),
  getProgramId: vi.fn(() => ({})),
  fetchEnrollment: vi.fn(),
  fetchCourse: vi.fn(),
  upsert: vi.fn(async () => ({ error: null })),
  logError: vi.fn(),
}));

vi.mock("@/lib/content/queries", () => ({ getCourseById: h.getCourseById }));
vi.mock("@/lib/solana/academy-program", () => ({
  completeLesson: h.completeLesson,
  getConnection: h.getConnection,
  getProgramId: h.getProgramId,
}));
vi.mock("@/lib/solana/academy-reads", () => ({
  fetchEnrollment: h.fetchEnrollment,
  fetchCourse: h.fetchCourse,
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: () => ({ upsert: h.upsert }) }),
}));
vi.mock("@/lib/logging", () => ({ logError: h.logError }));

import { batchCompleteCourse, BatchCompleteError } from "../batch-complete";

const WALLET = {
  toBase58: () => "wallet",
} as unknown as import("@solana/web3.js").PublicKey;

function courseWithLessons(n: number) {
  return {
    _id: "course-x",
    modules: [
      {
        lessons: Array.from({ length: n }, (_, i) => ({ _id: `l${i}` })),
      },
    ],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  h.getCourseById.mockResolvedValue(courseWithLessons(4));
  h.fetchCourse.mockResolvedValue({ liveLessonCount: 4, xp_per_lesson: 100 });
  h.completeLesson.mockResolvedValue("sig");
  h.upsert.mockResolvedValue({ error: null });
});

describe("batchCompleteCourse", () => {
  it("completes only the incomplete lessons and skips those already set", async () => {
    // lesson_flags = 0b0010 → index 1 already complete.
    h.fetchEnrollment.mockResolvedValue({ lesson_flags: [2n] });

    const result = await batchCompleteCourse({
      userId: "u",
      courseId: "course-x",
      wallet: WALLET,
    });

    expect(result).toEqual({
      total: 4,
      newlyCompleted: 3,
      alreadyComplete: 1,
      pending: 0,
    });
    // Called for indices 0, 2, 3 — never for the already-complete index 1.
    const indices = h.completeLesson.mock.calls.map((c) => c[2]).sort();
    expect(indices).toEqual([0, 2, 3]);
    expect(h.upsert).toHaveBeenCalledTimes(3);
  });

  it("is idempotent: a re-run after all lessons are set completes nothing", async () => {
    // lesson_flags = 0b1111 → all four complete.
    h.fetchEnrollment.mockResolvedValue({ lesson_flags: [15n] });

    const result = await batchCompleteCourse({
      userId: "u",
      courseId: "course-x",
      wallet: WALLET,
    });

    expect(result).toEqual({
      total: 4,
      newlyCompleted: 0,
      alreadyComplete: 4,
      pending: 0,
    });
    expect(h.completeLesson).not.toHaveBeenCalled();
  });

  it("clamps to the on-chain live lesson count (content/chain drift)", async () => {
    h.getCourseById.mockResolvedValue(courseWithLessons(6)); // content has 6
    h.fetchCourse.mockResolvedValue({ liveLessonCount: 4, xp_per_lesson: 100 }); // chain has 4
    h.fetchEnrollment.mockResolvedValue({ lesson_flags: [0n] });

    const result = await batchCompleteCourse({
      userId: "u",
      courseId: "course-x",
      wallet: WALLET,
    });

    expect(result.total).toBe(4);
    expect(result.newlyCompleted).toBe(4);
    const maxIndex = Math.max(...h.completeLesson.mock.calls.map((c) => c[2]));
    expect(maxIndex).toBe(3); // never touches slots 4 or 5
  });

  it("isolates a single lesson's on-chain failure into `pending`", async () => {
    h.fetchEnrollment.mockResolvedValue({ lesson_flags: [0n] });
    h.completeLesson.mockImplementation(async (_c, _w, index: number) => {
      if (index === 2) throw new Error("rpc blip");
      return "sig";
    });

    const result = await batchCompleteCourse({
      userId: "u",
      courseId: "course-x",
      wallet: WALLET,
    });

    expect(result).toEqual({
      total: 4,
      newlyCompleted: 3,
      alreadyComplete: 0,
      pending: 1,
    });
    // The loop continued past the failure (index 3 was still attempted).
    expect(h.completeLesson).toHaveBeenCalledTimes(4);
  });

  it("throws enrollment_missing when there is no on-chain enrollment", async () => {
    h.fetchEnrollment.mockResolvedValue(null);
    await expect(
      batchCompleteCourse({ userId: "u", courseId: "course-x", wallet: WALLET })
    ).rejects.toMatchObject({
      name: "BatchCompleteError",
      code: "enrollment_missing",
    });
    expect(h.completeLesson).not.toHaveBeenCalled();
  });

  it("throws xp_cap_exceeded when xpPerLesson × lessonCount exceeds the cap", async () => {
    h.fetchEnrollment.mockResolvedValue({ lesson_flags: [0n] });
    h.fetchCourse.mockResolvedValue({
      liveLessonCount: 4,
      xp_per_lesson: 3000,
    }); // 12000 > 10000
    await expect(
      batchCompleteCourse({ userId: "u", courseId: "course-x", wallet: WALLET })
    ).rejects.toBeInstanceOf(BatchCompleteError);
    expect(h.completeLesson).not.toHaveBeenCalled();
  });

  it("fail-closed: refuses when xp_per_lesson is missing (undefined)", async () => {
    h.fetchEnrollment.mockResolvedValue({ lesson_flags: [0n] });
    h.fetchCourse.mockResolvedValue({ liveLessonCount: 4 }); // no xp_per_lesson
    await expect(
      batchCompleteCourse({ userId: "u", courseId: "course-x", wallet: WALLET })
    ).rejects.toMatchObject({ code: "xp_unavailable" });
    expect(h.completeLesson).not.toHaveBeenCalled();
  });

  it("fail-closed: refuses when xp_per_lesson is zero", async () => {
    h.fetchEnrollment.mockResolvedValue({ lesson_flags: [0n] });
    h.fetchCourse.mockResolvedValue({ liveLessonCount: 4, xp_per_lesson: 0 });
    await expect(
      batchCompleteCourse({ userId: "u", courseId: "course-x", wallet: WALLET })
    ).rejects.toMatchObject({ code: "xp_unavailable" });
    expect(h.completeLesson).not.toHaveBeenCalled();
  });

  it("throws course_not_found for an unknown course", async () => {
    h.getCourseById.mockResolvedValue(null);
    await expect(
      batchCompleteCourse({ userId: "u", courseId: "nope", wallet: WALLET })
    ).rejects.toMatchObject({ code: "course_not_found" });
  });
});
