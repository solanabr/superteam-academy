import { describe, it, expect } from "vitest";
import BN from "bn.js";
import { decodeLessonBitmap, isAllLessonsComplete } from "../bitmap";

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

describe("isAllLessonsComplete", () => {
  it("false when not all complete", () => {
    expect(
      isAllLessonsComplete([new BN(3), new BN(0), new BN(0), new BN(0)], 3)
    ).toBe(false);
  });

  it("true when all complete", () => {
    expect(
      isAllLessonsComplete([new BN(7), new BN(0), new BN(0), new BN(0)], 3)
    ).toBe(true);
  });

  it("single lesson course", () => {
    expect(
      isAllLessonsComplete([new BN(1), new BN(0), new BN(0), new BN(0)], 1)
    ).toBe(true);
  });

  it("returns false for lessonCount 0", () => {
    expect(
      isAllLessonsComplete(
        [new BN(0xffffffff), new BN(0), new BN(0), new BN(0)],
        0
      )
    ).toBe(false);
  });

  it("returns false when lessonFlags too short", () => {
    expect(isAllLessonsComplete([new BN(0xff)], 65)).toBe(false);
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
// these functions is a comparison, and every comparison against NaN is false,
// so NaN used to sail straight through. These pin the fail-CLOSED behaviour.
describe("non-finite lessonCount fails closed", () => {
  const noneComplete = [new BN(0), new BN(0), new BN(0), new BN(0)];

  it.each([
    ["NaN", NaN],
    ["Infinity", Infinity],
    ["-Infinity", -Infinity],
  ])(
    "isAllLessonsComplete returns false for %s (not true via loop fall-through)",
    (_label, count) => {
      expect(isAllLessonsComplete(noneComplete, count)).toBe(false);
    }
  );

  it("isAllLessonsComplete returns false for a negative count", () => {
    expect(isAllLessonsComplete(noneComplete, -1)).toBe(false);
  });

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
