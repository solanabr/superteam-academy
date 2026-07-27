/* eslint-disable import/order -- vi.mock must precede importing the module under test. */
import { describe, it, expect, vi } from "vitest";
import type { SlotsLockT } from "@superteam-lms/content-schema";

vi.mock("server-only", () => ({}));

// The helper reads the committed slot lock via the content store. Inject a
// synthetic lock whose slots DELIBERATELY disagree with insertion/array order —
// a C3-shaped course where the capstone keeps slot 15 while later-authored
// lessons sit at low slots and slot 14 is retired. Hoisted so the vi.mock
// factory (also hoisted) can close over it.
const { slotsByCourseId } = vi.hoisted(() => ({
  slotsByCourseId: new Map<string, SlotsLockT>([
    [
      "course-c3",
      {
        version: 1,
        slots: {
          // insertion order here is NOT slot order — proves the helper reads the
          // slot value, not the position.
          "lesson-capstone": 15,
          "lesson-intro": 0,
          "lesson-moved-late": 2,
          "lesson-mid": 10,
        },
        retired: [14],
        next: 16,
      },
    ],
  ]),
}));

vi.mock("@/lib/content/store", () => ({ slotsByCourseId }));

import { getLessonSlot, slotToLiveLessonId } from "../lesson-slot";

describe("getLessonSlot — slot lock is the on-chain bitmap index (#741)", () => {
  it("returns the lesson's committed slot, not its array/insertion position", () => {
    expect(getLessonSlot("course-c3", "lesson-capstone")).toBe(15);
    expect(getLessonSlot("course-c3", "lesson-intro")).toBe(0);
    // Authored later, appears third, but its slot is 2 — array order disagrees.
    expect(getLessonSlot("course-c3", "lesson-moved-late")).toBe(2);
    expect(getLessonSlot("course-c3", "lesson-mid")).toBe(10);
  });

  it("throws (fail-closed) for an unknown course — never falls back to an index", () => {
    expect(() => getLessonSlot("course-missing", "lesson-intro")).toThrow(
      /no slot lock/i
    );
  });

  it("throws (fail-closed) for a lesson with no slot (retired/unknown)", () => {
    expect(() => getLessonSlot("course-c3", "lesson-retired")).toThrow(
      /no slot/i
    );
  });
});

describe("slotToLiveLessonId — reverse map for bitmap→progress sync (#741)", () => {
  it("maps every live slot to its lessonId; retired slots are absent", () => {
    const map = slotToLiveLessonId("course-c3");
    expect(map.get(15)).toBe("lesson-capstone");
    expect(map.get(0)).toBe("lesson-intro");
    expect(map.get(2)).toBe("lesson-moved-late");
    expect(map.get(10)).toBe("lesson-mid");
    expect(map.size).toBe(4);
    // Retired slot 14 has no live lesson → correctly absent, so a stray set bit
    // at 14 is ignored rather than resurrected onto some other lesson.
    expect(map.has(14)).toBe(false);
  });

  it("returns an empty map for an unknown course (degrade, don't throw mid-batch)", () => {
    expect(slotToLiveLessonId("course-missing").size).toBe(0);
  });
});
