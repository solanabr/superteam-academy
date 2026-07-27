/* eslint-disable import/order -- vi.mock must precede the store/query imports. */
import { describe, it, expect, beforeAll, vi } from "vitest";
import type { SlotsLockT } from "@superteam-lms/content-schema";

vi.mock("server-only", () => ({}));

// getCourseById → getDeploymentById → a service-role Supabase read. Stub it to
// "no deployment" so the course projection runs purely against the in-memory
// content bundle (the deployment only supplies a track-collection address, which
// does not affect module/lesson ORDER — the only thing this test inspects).
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: null, error: null }),
        }),
      }),
    }),
  }),
}));

import { slotsByCourseId } from "@/lib/content/store";
import { getCourseById } from "@/lib/content/queries";
import { findLessonIndex } from "@/lib/courses/lesson-index";

/** A course is dense when no slot is retired and the live slots are 0..n-1. */
function isDense(lock: SlotsLockT): boolean {
  const slots = Object.values(lock.slots).sort((a, b) => a - b);
  return lock.retired.length === 0 && slots.every((s, i) => s === i);
}

beforeAll(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "srk";
});

// The safety claim for shipping #741 BEFORE any restructure bump: for the
// current committed bundle, the slot the new code sends on-chain equals the
// array index the old code sent — byte-identical behaviour.
describe("slot lock ↔ array-index equivalence (current bundle) — #741", () => {
  it("every DENSE course has slot == findLessonIndex for every lesson", async () => {
    let checkedLessons = 0;
    for (const [courseId, lock] of slotsByCourseId) {
      if (!isDense(lock)) continue;
      const course = await getCourseById(courseId);
      expect(
        course,
        `getCourseById(${courseId}) should resolve`
      ).not.toBeNull();
      for (const [lessonId, slot] of Object.entries(lock.slots)) {
        expect(
          findLessonIndex(course!, lessonId),
          `${courseId}/${lessonId}: slot ${slot} must equal array index`
        ).toBe(slot);
        checkedLessons++;
      }
    }
    // Guard against a vacuous pass (e.g. all courses filtered out as sparse).
    expect(checkedLessons).toBeGreaterThan(0);
  });

  // LANDMINE BY DESIGN — relaxed once, exactly as its author intended.
  //
  // It originally asserted the whole bundle was dense, which is what made #741
  // byte-identical at the time it shipped. #740 (re-landed after #741 made the
  // completion path slot-aware) restructured `course-building-first-program`:
  // retired slots [0,2,11,14], added 16-18. That course is now legitimately
  // SPARSE, and the slot-aware route/webhook/batch paths are precisely what make
  // it correct — array-space would name the wrong lesson there.
  //
  // So this stays a tripwire rather than being deleted: it pins the sparse set to
  // exactly the courses we intend to be sparse. A NEW sparse course appearing
  // here is a real signal — either a restructure landed that nobody reviewed for
  // slot-awareness, or a slots.lock was hand-edited. Add an id here only with the
  // same deliberation #740 got.
  const EXPECTED_SPARSE = ["course-building-first-program"];

  it("only the expected courses are sparse (everything else is slot-space == array-space)", () => {
    const sparse = [...slotsByCourseId.entries()]
      .filter(([, lock]) => !isDense(lock))
      .map(([id]) => id)
      .sort();
    expect(sparse).toEqual([...EXPECTED_SPARSE].sort());
  });
});
