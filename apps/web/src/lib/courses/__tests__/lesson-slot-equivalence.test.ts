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

  // Pins the EXACT expected sparse set so any course going sparse stays a
  // deliberate, reviewed event. The one sparse course this used to allow —
  // `course-building-first-program`, restructured in #740/#751 — is parked out
  // of the alpha bundle, so the alpha catalog is fully dense and the set is
  // empty. The dense⟹equivalence test above and the sparse-fixture tests in
  // slot-aware.test.ts / lesson-slot.test.ts remain the real guarantees; an
  // empty set here does NOT mean the sparse path is untested.
  it("no course is sparse in the alpha catalog", () => {
    const sparse = [...slotsByCourseId.entries()]
      .filter(([, lock]) => !isDense(lock))
      .map(([id]) => id)
      .sort();
    expect(sparse).toEqual([]);
  });
});
