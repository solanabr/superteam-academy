import { describe, it, expect } from "vitest";
import {
  isLessonComplete,
  countCompletedLessons,
  getCompletedLessonIndices,
} from "../bitmap";

describe("isLessonComplete", () => {
  it("returns false for lesson 0 in empty bitmap", () => {
    const flags = [0n];
    expect(isLessonComplete(flags, 0)).toBe(false);
  });

  it("returns false when the word is missing", () => {
    const flags: bigint[] = [];
    expect(isLessonComplete(flags, 0)).toBe(false);
  });

  it("returns true after setting bit 0", () => {
    const flags = [1n]; // bit 0 set
    expect(isLessonComplete(flags, 0)).toBe(true);
  });

  it("returns true for lesson 3 when bit 3 is set", () => {
    const flags = [1n << 3n];
    expect(isLessonComplete(flags, 3)).toBe(true);
  });

  it("returns false for lesson 2 when only bit 3 is set", () => {
    const flags = [1n << 3n];
    expect(isLessonComplete(flags, 2)).toBe(false);
  });

  it("handles lessons in second word (index >= 64)", () => {
    // lesson 64 lives in word index 1, bit 0
    const flags = [0n, 1n];
    expect(isLessonComplete(flags, 64)).toBe(true);
    expect(isLessonComplete(flags, 0)).toBe(false);
  });
});

describe("countCompletedLessons", () => {
  it("returns 0 for empty array", () => {
    expect(countCompletedLessons([])).toBe(0);
  });

  it("returns 0 for all-zero words", () => {
    expect(countCompletedLessons([0n, 0n])).toBe(0);
  });

  it("counts a single set bit", () => {
    expect(countCompletedLessons([1n])).toBe(1);
  });

  it("counts multiple set bits in one word", () => {
    // bits 0, 1, 3 → 0b1011 = 11
    expect(countCompletedLessons([0b1011n])).toBe(3);
  });

  it("counts bits across multiple words", () => {
    expect(countCompletedLessons([0b111n, 0b11n])).toBe(5);
  });
});

describe("getCompletedLessonIndices", () => {
  it("returns empty array when no lessons are complete", () => {
    expect(getCompletedLessonIndices([0n], 5)).toEqual([]);
  });

  it("returns correct indices for set bits", () => {
    // bits 0 and 2 set → 0b0101 = 5
    const flags = [0b0101n];
    expect(getCompletedLessonIndices(flags, 4)).toEqual([0, 2]);
  });

  it("respects lessonCount boundary", () => {
    // bit 0, 1, 2 all set but lessonCount = 2
    const flags = [0b111n];
    expect(getCompletedLessonIndices(flags, 2)).toEqual([0, 1]);
  });

  it("works across word boundaries", () => {
    // lesson 0 in word 0, lesson 64 in word 1
    const flags = [1n, 1n];
    expect(getCompletedLessonIndices(flags, 65)).toEqual([0, 64]);
  });
});
