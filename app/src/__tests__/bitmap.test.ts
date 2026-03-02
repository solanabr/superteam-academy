import { describe, it, expect } from "vitest";
import BN from "bn.js";
import {
  isLessonComplete,
  countCompletedLessons,
  getCompletedLessonIndices,
  getProgressPercent,
} from "@/lib/solana/bitmap";

describe("bitmap helpers", () => {
  const emptyFlags = [new BN(0), new BN(0), new BN(0), new BN(0)];

  it("returns false for empty bitmap", () => {
    expect(isLessonComplete(emptyFlags, 0)).toBe(false);
    expect(isLessonComplete(emptyFlags, 63)).toBe(false);
    expect(isLessonComplete(emptyFlags, 64)).toBe(false);
  });

  it("detects set bits correctly", () => {
    // Set bit 0 and bit 3
    const flags = [new BN(0b1001), new BN(0), new BN(0), new BN(0)];
    expect(isLessonComplete(flags, 0)).toBe(true);
    expect(isLessonComplete(flags, 1)).toBe(false);
    expect(isLessonComplete(flags, 3)).toBe(true);
  });

  it("handles bits in second word (64-127)", () => {
    const flags = [new BN(0), new BN(1), new BN(0), new BN(0)];
    expect(isLessonComplete(flags, 63)).toBe(false);
    expect(isLessonComplete(flags, 64)).toBe(true);
    expect(isLessonComplete(flags, 65)).toBe(false);
  });

  it("counts completed lessons", () => {
    const flags = [new BN(0b1011), new BN(0), new BN(0), new BN(0)];
    expect(countCompletedLessons(flags)).toBe(3);
  });

  it("counts zero for empty bitmap", () => {
    expect(countCompletedLessons(emptyFlags)).toBe(0);
  });

  it("returns completed indices", () => {
    const flags = [new BN(0b1010), new BN(0), new BN(0), new BN(0)];
    expect(getCompletedLessonIndices(flags, 4)).toEqual([1, 3]);
  });

  it("calculates progress percent", () => {
    const flags = [new BN(0b111), new BN(0), new BN(0), new BN(0)]; // 3 set
    expect(getProgressPercent(flags, 10)).toBe(30);
    expect(getProgressPercent(flags, 3)).toBe(100);
  });

  it("handles zero lesson count", () => {
    expect(getProgressPercent(emptyFlags, 0)).toBe(0);
  });
});
