import { describe, expect, it } from "vitest";
import { BN } from "@coral-xyz/anchor";
import {
  countCompletedLessonsInRange,
  isLessonCompleteInFlags,
} from "./shared.js";

describe("countCompletedLessonsInRange", () => {
  it("returns 0 for empty flags and any lessonCount", () => {
    const flags = [new BN(0), new BN(0), new BN(0), new BN(0)];
    expect(countCompletedLessonsInRange(flags, 0)).toBe(0);
    expect(countCompletedLessonsInRange(flags, 3)).toBe(0);
    expect(countCompletedLessonsInRange(flags, 64)).toBe(0);
  });

  it("counts bits set only within [0, lessonCount)", () => {
    // Bit 0 and 1 set in first word
    const flags = [new BN(3), new BN(0), new BN(0), new BN(0)];
    expect(countCompletedLessonsInRange(flags, 1)).toBe(1);
    expect(countCompletedLessonsInRange(flags, 2)).toBe(2);
    expect(countCompletedLessonsInRange(flags, 3)).toBe(2);
    expect(countCompletedLessonsInRange(flags, 64)).toBe(2);
  });

  it("works with numeric words", () => {
    const flags = [3, 0, 0, 0];
    expect(countCompletedLessonsInRange(flags, 2)).toBe(2);
    expect(countCompletedLessonsInRange(flags, 3)).toBe(2);
  });

  it("counts across word boundary when lessonCount > 64", () => {
    const flags = [
      new BN("ffffffffffffffff", 16),
      new BN(1),
      new BN(0),
      new BN(0),
    ];
    expect(countCompletedLessonsInRange(flags, 64)).toBe(64);
    expect(countCompletedLessonsInRange(flags, 65)).toBe(65);
    expect(countCompletedLessonsInRange(flags, 128)).toBe(65);
  });
});

describe("isLessonCompleteInFlags", () => {
  it("returns false for empty or zero flags", () => {
    const flags = [new BN(0), new BN(0), new BN(0), new BN(0)];
    expect(isLessonCompleteInFlags(flags, 0)).toBe(false);
    expect(isLessonCompleteInFlags(flags, 1)).toBe(false);
  });

  it("returns true when the bit is set", () => {
    const flags = [new BN(1), new BN(0), new BN(0), new BN(0)];
    expect(isLessonCompleteInFlags(flags, 0)).toBe(true);
    expect(isLessonCompleteInFlags(flags, 1)).toBe(false);

    const flags2 = [new BN(5), new BN(0), new BN(0), new BN(0)];
    expect(isLessonCompleteInFlags(flags2, 0)).toBe(true);
    expect(isLessonCompleteInFlags(flags2, 2)).toBe(true);
    expect(isLessonCompleteInFlags(flags2, 1)).toBe(false);
  });

  it("works with numeric words", () => {
    const flags = [5, 0, 0, 0];
    expect(isLessonCompleteInFlags(flags, 0)).toBe(true);
    expect(isLessonCompleteInFlags(flags, 2)).toBe(true);
    expect(isLessonCompleteInFlags(flags, 1)).toBe(false);
  });
});
