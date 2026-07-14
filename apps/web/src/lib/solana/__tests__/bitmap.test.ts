import { describe, it, expect } from "vitest";
import BN from "bn.js";
import { decodeLessonBitmap, isCourseComplete } from "../bitmap";

describe("decodeLessonBitmap", () => {
  it("empty bitmap returns all false", () => {
    expect(
      decodeLessonBitmap([new BN(0), new BN(0), new BN(0), new BN(0)], 3)
    ).toEqual([false, false, false]);
  });

  it("first bit set means lesson 0 complete", () => {
    expect(
      decodeLessonBitmap([new BN(1), new BN(0), new BN(0), new BN(0)], 3)
    ).toEqual([true, false, false]);
  });

  it("0b111 means first 3 lessons complete", () => {
    expect(
      decodeLessonBitmap([new BN(7), new BN(0), new BN(0), new BN(0)], 3)
    ).toEqual([true, true, true]);
  });

  it("handles lessons spanning multiple u64 words", () => {
    const result = decodeLessonBitmap(
      [new BN(0), new BN(1), new BN(0), new BN(0)],
      65
    );
    expect(result[63]).toBe(false);
    expect(result[64]).toBe(true);
  });

  it("handles bigint input", () => {
    expect(decodeLessonBitmap([7n, 0n, 0n, 0n], 3)).toEqual([true, true, true]);
  });

  it("handles number input", () => {
    expect(decodeLessonBitmap([7, 0, 0, 0], 3)).toEqual([true, true, true]);
  });
});

// Mirrors the on-chain `finalize_course` gate:
//   enrollment.lesson_flags.iter().zip(course.active_lessons.iter())
//       .all(|(flags, active)| flags & active == *active)
// A SUBSET test over the live-lesson mask, NOT a dense-prefix check — the
// sparse-mask cases are the whole point (a retired lesson slot must not block
// completion, and must not be required to be unset either).
describe("isCourseComplete", () => {
  it("dense mask, all live bits set -> complete", () => {
    // active = lessons 0,1,2 (0b111); learner has exactly those bits set.
    expect(
      isCourseComplete(
        [new BN(0b111), new BN(0), new BN(0), new BN(0)],
        [0b111n, 0n, 0n, 0n]
      )
    ).toBe(true);
  });

  it("dense mask, one live bit missing -> incomplete", () => {
    // active = lessons 0,1,2 (0b111); learner is missing lesson 2 (0b011).
    expect(
      isCourseComplete(
        [new BN(0b011), new BN(0), new BN(0), new BN(0)],
        [0b111n, 0n, 0n, 0n]
      )
    ).toBe(false);
  });

  // Sparse mask: active = {0,1,2,4}, slot 3 retired (0b10111 = 23).
  const sparseActive: bigint[] = [0b10111n, 0n, 0n, 0n];

  it("sparse mask: learner holds exactly the live slots -> complete", () => {
    // flags = {0,1,2,4} = 0b10111
    expect(
      isCourseComplete(
        [new BN(0b10111), new BN(0), new BN(0), new BN(0)],
        sparseActive
      )
    ).toBe(true);
  });

  it("sparse mask: learner missing a live slot -> incomplete", () => {
    // flags = {0,1,2} = 0b00111, missing live slot 4
    expect(
      isCourseComplete(
        [new BN(0b00111), new BN(0), new BN(0), new BN(0)],
        sparseActive
      )
    ).toBe(false);
  });

  it("sparse mask: learner also holds a retired-slot bit -> still complete", () => {
    // flags = {0,1,2,3,4} = 0b11111, includes retired slot 3 — the AND against
    // `active` ignores the stray bit, so this must still read as complete.
    expect(
      isCourseComplete(
        [new BN(0b11111), new BN(0), new BN(0), new BN(0)],
        sparseActive
      )
    ).toBe(true);
  });

  it("empty/zero flags with a non-empty mask -> incomplete", () => {
    expect(
      isCourseComplete(
        [new BN(0), new BN(0), new BN(0), new BN(0)],
        [0b111n, 0n, 0n, 0n]
      )
    ).toBe(false);
  });

  it("empty mask -> complete (vacuous)", () => {
    expect(
      isCourseComplete(
        [new BN(0), new BN(0), new BN(0), new BN(0)],
        [0n, 0n, 0n, 0n]
      )
    ).toBe(true);
  });

  it("treats a missing/short lessonFlags word as 0", () => {
    // Only one word of flags supplied, but the mask spans word index 1 too.
    expect(isCourseComplete([new BN(0)], [0n, 0b1n, 0n, 0n])).toBe(false);
    expect(isCourseComplete([new BN(0)], [0n, 0n, 0n, 0n])).toBe(true);
  });

  it("handles bigint and number flag inputs", () => {
    expect(isCourseComplete([0b111n, 0n, 0n, 0n], [0b111n, 0n, 0n, 0n])).toBe(
      true
    );
    expect(isCourseComplete([0b111, 0, 0, 0], [0b111n, 0n, 0n, 0n])).toBe(true);
  });
});

describe("decodeLessonBitmap edge cases", () => {
  it("throws when lessonFlags too short for lessonCount", () => {
    expect(() => decodeLessonBitmap([new BN(0xff)], 65)).toThrow(
      "lessonFlags has 1 words but lessonCount=65 requires 2"
    );
  });
});

// A non-finite lessonCount is not hypothetical: callers derive it from a chain
// read (`Number(course.lesson_count)`), so a Course layout the coder cannot see
// — e.g. any client/program version skew (#449) — yields NaN. Every guard in
// decodeLessonBitmap is a comparison, and every comparison against NaN is
// false, so NaN used to sail straight through. This pins the fail-CLOSED
// behaviour (isCourseComplete has no count parameter, so it needs no such guard).
describe("non-finite lessonCount fails closed", () => {
  const noneComplete = [new BN(0), new BN(0), new BN(0), new BN(0)];

  it.each([
    ["NaN", NaN],
    ["Infinity", Infinity],
  ])(
    "decodeLessonBitmap throws for %s instead of returning []",
    (_l, count) => {
      expect(() => decodeLessonBitmap(noneComplete, count)).toThrow(
        "invalid lessonCount"
      );
    }
  );
});
