import { describe, it, expect } from "vitest";
import BN from "bn.js";
import {
  isLessonComplete,
  countCompletedLessons,
  getCompletedLessonIndices,
} from "./bitmap";

describe("isLessonComplete", () => {
  it("returns false for empty bitmap", () => {
    expect(isLessonComplete([], 0)).toBe(false);
  });

  it("detects first bit set", () => {
    expect(isLessonComplete([new BN(1)], 0)).toBe(true);
  });

  it("detects bit 63 (last in first word)", () => {
    expect(isLessonComplete([new BN(0).bincn(63)], 63)).toBe(true);
  });

  it("detects bit 64 (first in second word)", () => {
    expect(isLessonComplete([new BN(0), new BN(1)], 64)).toBe(true);
  });

  it("returns false for out-of-bounds index", () => {
    expect(isLessonComplete([new BN(1)], 64)).toBe(false);
  });

  it("returns false for unset bit", () => {
    expect(isLessonComplete([new BN(0b101)], 1)).toBe(false);
  });
});

describe("countCompletedLessons", () => {
  it("returns 0 for empty array", () => {
    expect(countCompletedLessons([])).toBe(0);
  });

  it("counts 3 bits set", () => {
    expect(countCompletedLessons([new BN(0b111)])).toBe(3);
  });

  it("counts across words", () => {
    expect(countCompletedLessons([new BN(0xff), new BN(0xff)])).toBe(16);
  });

  it("counts all 64 bits", () => {
    const allBits = new BN(1).shln(64).subn(1);
    expect(countCompletedLessons([allBits])).toBe(64);
  });
});

describe("getCompletedLessonIndices", () => {
  it("returns empty for empty bitmap", () => {
    expect(getCompletedLessonIndices([], 10)).toEqual([]);
  });

  it("returns selective indices", () => {
    expect(getCompletedLessonIndices([new BN(0b1010)], 4)).toEqual([1, 3]);
  });

  it("works across word boundaries", () => {
    const word0 = new BN(1); // bit 0
    const word1 = new BN(1); // bit 64
    const indices = getCompletedLessonIndices([word0, word1], 128);
    expect(indices).toContain(0);
    expect(indices).toContain(64);
    expect(indices).toHaveLength(2);
  });
});
