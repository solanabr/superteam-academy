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

// Whatever content.lock pins, the lock and the course must agree: every live
// lesson has a slot (getLessonSlot fails closed on one that does not, which
// 500s its completion), and no live lesson sits on a retired slot.
describe("slot lock ↔ course lessons (current bundle)", () => {
  it("every course's live lessons are exactly its slotted lessons", async () => {
    for (const [courseId, lock] of slotsByCourseId) {
      const course = await getCourseById(courseId);
      expect(
        course,
        `getCourseById(${courseId}) should resolve`
      ).not.toBeNull();
      const live = course!.modules.flatMap((m) => m.lessons.map((l) => l._id));
      expect(live.sort(), courseId).toEqual(Object.keys(lock.slots).sort());
      for (const slot of Object.values(lock.slots)) {
        expect(
          lock.retired,
          `${courseId} reuses retired slot ${slot}`
        ).not.toContain(slot);
      }
    }
  });
});

// The safety claim for shipping #741 BEFORE any restructure bump: for a dense
// course (no retired slot, slots 0..n-1), the slot the new code sends on-chain
// equals the array index the old code sent — byte-identical behaviour. A sparse
// course has no such equivalence; slot-aware.test.ts and lesson-slot.test.ts
// cover that path against fixtures.
describe("slot lock ↔ array-index equivalence (current bundle) — #741", () => {
  it("every DENSE course has slot == findLessonIndex for every lesson", async () => {
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
      }
    }
  });
});
