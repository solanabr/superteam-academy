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
});
