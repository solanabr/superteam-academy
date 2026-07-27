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
  getLessonSlot: vi.fn<(courseId: string, lessonId: string) => number>(),
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
vi.mock("@/lib/courses/lesson-slot", () => ({
  getLessonSlot: h.getLessonSlot,
}));

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

/** Build a 4-word [u64;4] mask (bigints) with the given bit positions set. */
function mask(...bits: number[]): bigint[] {
  const words: [bigint, bigint, bigint, bigint] = [0n, 0n, 0n, 0n];
  for (const b of bits) {
    const w = Math.floor(b / 64) as 0 | 1 | 2 | 3;
    words[w] |= 1n << BigInt(b % 64);
  }
  return words;
}

beforeEach(() => {
  vi.clearAllMocks();
  h.getCourseById.mockResolvedValue(courseWithLessons(4));
  h.fetchCourse.mockResolvedValue({ liveLessonCount: 4, xp_per_lesson: 100 });
  h.completeLesson.mockResolvedValue("sig");
  h.upsert.mockResolvedValue({ error: null });
  // Default dense mapping: lesson `lN` → slot N (slot == array index). Existing
  // dense cases stay byte-identical; sparse cases override this per test.
  h.getLessonSlot.mockImplementation((_courseId, lessonId) =>
    Number(String(lessonId).replace("l", ""))
  );
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

  it("skips slots not live in the on-chain mask, per-slot (sparse/drift)", async () => {
    // Content has 6 lessons (slots 0..5) but the on-chain mask only activates
    // 0..3. The two un-activated slots are isolated into `pending` — via the
    // per-SLOT bit test, NOT a count truncation — and no revert-bound tx fires
    // for them (#741).
    h.getCourseById.mockResolvedValue(courseWithLessons(6));
    h.fetchCourse.mockResolvedValue({
      activeLessons: mask(0, 1, 2, 3),
      xp_per_lesson: 100,
    });
    h.fetchEnrollment.mockResolvedValue({ lesson_flags: [0n] });

    const result = await batchCompleteCourse({
      userId: "u",
      courseId: "course-x",
      wallet: WALLET,
    });

    expect(result).toEqual({
      total: 6,
      newlyCompleted: 4,
      alreadyComplete: 0,
      pending: 2, // slots 4 and 5 not live → skipped, no tx
    });
    const maxIndex = Math.max(...h.completeLesson.mock.calls.map((c) => c[2]));
    expect(maxIndex).toBe(3); // never attempts slots 4 or 5
  });

  it("sends the SLOT to completeLesson, not array position (C3 capstone at 15)", async () => {
    // A 2-lesson course whose second lesson keeps slot 15 (capstone) while a
    // retired slot 14 sits between; array position would send 1, the slot is 15.
    h.getCourseById.mockResolvedValue(courseWithLessons(2));
    h.getLessonSlot.mockImplementation((_c, id) => (id === "l0" ? 0 : 15));
    h.fetchCourse.mockResolvedValue({
      activeLessons: mask(0, 15), // 14 retired, 15 (capstone) live
      xp_per_lesson: 100,
    });
    // Old enrollment carries a stale retired-slot-14 bit; it must NOT read as the
    // capstone being complete.
    h.fetchEnrollment.mockResolvedValue({ lesson_flags: mask(14) });

    const result = await batchCompleteCourse({
      userId: "u",
      courseId: "course-x",
      wallet: WALLET,
    });

    expect(result).toEqual({
      total: 2,
      newlyCompleted: 2,
      alreadyComplete: 0,
      pending: 0,
    });
    const slots = h.completeLesson.mock.calls
      .map((c) => c[2])
      .sort((a, b) => a - b);
    expect(slots).toEqual([0, 15]); // capstone sent as slot 15, never 1 or 14
  });

  it("isolates an unslotted lesson into `pending` (fail-closed, batch continues)", async () => {
    // Middle lesson has no slot → must NOT fall back to array position; it lands
    // in `pending` with a logged reason and the rest of the batch proceeds.
    h.getCourseById.mockResolvedValue(courseWithLessons(3));
    h.getLessonSlot.mockImplementation((_c, id) => {
      if (id === "l1") throw new Error("Lesson l1 has no slot in course");
      return Number(String(id).replace("l", ""));
    });
    h.fetchEnrollment.mockResolvedValue({ lesson_flags: [0n] });

    const result = await batchCompleteCourse({
      userId: "u",
      courseId: "course-x",
      wallet: WALLET,
    });

    expect(result).toEqual({
      total: 3,
      newlyCompleted: 2, // l0, l2
      alreadyComplete: 0,
      pending: 1, // l1 unslotted
    });
    const slots = h.completeLesson.mock.calls
      .map((c) => c[2])
      .sort((a, b) => a - b);
    expect(slots).toEqual([0, 2]); // never attempted l1 at any index
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
