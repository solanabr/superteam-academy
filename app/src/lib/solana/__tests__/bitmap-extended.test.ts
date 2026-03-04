import { describe, it, expect } from "vitest";
import {
  isLessonComplete,
  countCompletedLessons,
  getCompletedLessonIndices,
} from "../bitmap";

describe("isLessonComplete — extended coverage", () => {
  describe("all bits in a single 64-bit word", () => {
    it("correctly identifies bit 63 (highest bit in first word)", () => {
      const flags = [1n << 63n];
      expect(isLessonComplete(flags, 63)).toBe(true);
      expect(isLessonComplete(flags, 62)).toBe(false);
    });

    it("recognises multiple set bits independently", () => {
      // bits 0, 5, 10, 20 set
      const flags = [(1n << 0n) | (1n << 5n) | (1n << 10n) | (1n << 20n)];
      expect(isLessonComplete(flags, 0)).toBe(true);
      expect(isLessonComplete(flags, 5)).toBe(true);
      expect(isLessonComplete(flags, 10)).toBe(true);
      expect(isLessonComplete(flags, 20)).toBe(true);
      expect(isLessonComplete(flags, 1)).toBe(false);
      expect(isLessonComplete(flags, 6)).toBe(false);
    });

    it("all 64 bits set → every lesson in first word is complete", () => {
      // 2^64 - 1
      const allSet = (1n << 64n) - 1n;
      const flags = [allSet];
      for (let i = 0; i < 64; i++) {
        expect(isLessonComplete(flags, i)).toBe(true);
      }
    });
  });

  describe("multi-word bitmaps", () => {
    it("lesson 65 lives in word 1, bit 1", () => {
      const flags = [0n, 1n << 1n];
      expect(isLessonComplete(flags, 65)).toBe(true);
      expect(isLessonComplete(flags, 64)).toBe(false);
    });

    it("lesson 127 is the last bit of the second word", () => {
      const flags = [0n, 1n << 63n];
      expect(isLessonComplete(flags, 127)).toBe(true);
      expect(isLessonComplete(flags, 126)).toBe(false);
    });

    it("lesson 128 lives in the third word", () => {
      const flags = [0n, 0n, 1n];
      expect(isLessonComplete(flags, 128)).toBe(true);
      expect(isLessonComplete(flags, 0)).toBe(false);
    });

    it("first word full, lessons in second word independent", () => {
      const allFirst = (1n << 64n) - 1n;
      const flags = [allFirst, 0n];
      expect(isLessonComplete(flags, 63)).toBe(true);
      expect(isLessonComplete(flags, 64)).toBe(false);
    });
  });

  describe("out-of-range indices", () => {
    it("returns false for index past array length", () => {
      const flags = [1n]; // only word 0
      expect(isLessonComplete(flags, 64)).toBe(false); // word 1 missing
    });

    it("returns false for very large index with short array", () => {
      const flags = [0n, 0n];
      expect(isLessonComplete(flags, 200)).toBe(false);
    });
  });
});

describe("countCompletedLessons — extended coverage", () => {
  describe("single word counts", () => {
    it("counts 0 bits in 0n", () => {
      expect(countCompletedLessons([0n])).toBe(0);
    });

    it("counts 1 bit: value 1n", () => {
      expect(countCompletedLessons([1n])).toBe(1);
    });

    it("counts 1 bit: highest bit 1n<<63n", () => {
      expect(countCompletedLessons([1n << 63n])).toBe(1);
    });

    it("counts 2 bits: 0b11 = 3n", () => {
      expect(countCompletedLessons([3n])).toBe(2);
    });

    it("counts 4 bits: 0b1111 = 15n", () => {
      expect(countCompletedLessons([15n])).toBe(4);
    });

    it("counts all 64 bits when word is (2^64)-1", () => {
      const allSet = (1n << 64n) - 1n;
      expect(countCompletedLessons([allSet])).toBe(64);
    });
  });

  describe("multi-word counts", () => {
    it("sums across three zero words → 0", () => {
      expect(countCompletedLessons([0n, 0n, 0n])).toBe(0);
    });

    it("sums 1 bit per word across 3 words → 3", () => {
      expect(countCompletedLessons([1n, 1n, 1n])).toBe(3);
    });

    it("sums 3+2 across two words → 5 (already tested, re-verifying)", () => {
      expect(countCompletedLessons([0b111n, 0b11n])).toBe(5);
    });

    it("sums large counts across two fully-set 64-bit words → 128", () => {
      const allSet = (1n << 64n) - 1n;
      expect(countCompletedLessons([allSet, allSet])).toBe(128);
    });

    it("handles alternating zero and non-zero words", () => {
      // word0=2 bits, word1=0, word2=3 bits
      expect(countCompletedLessons([3n, 0n, 7n])).toBe(5);
    });
  });
});

describe("getCompletedLessonIndices — extended coverage", () => {
  describe("basic index retrieval", () => {
    it("returns [0] for flags=[1n] and lessonCount=1", () => {
      expect(getCompletedLessonIndices([1n], 1)).toEqual([0]);
    });

    it("returns all indices when all lessons complete", () => {
      const flags = [0b1111n]; // bits 0,1,2,3
      expect(getCompletedLessonIndices(flags, 4)).toEqual([0, 1, 2, 3]);
    });

    it("returns no indices when all bits zero and lessonCount > 0", () => {
      expect(getCompletedLessonIndices([0n, 0n], 128)).toEqual([]);
    });

    it("returns only indices below lessonCount boundary", () => {
      const flags = [0b11111n]; // bits 0,1,2,3,4 set
      expect(getCompletedLessonIndices(flags, 3)).toEqual([0, 1, 2]);
    });

    it("returns empty when lessonCount is 0", () => {
      expect(getCompletedLessonIndices([1n], 0)).toEqual([]);
    });
  });

  describe("non-contiguous set bits", () => {
    it("returns sparse indices correctly", () => {
      // bits 0, 3, 7
      const flags = [(1n << 0n) | (1n << 3n) | (1n << 7n)];
      expect(getCompletedLessonIndices(flags, 10)).toEqual([0, 3, 7]);
    });

    it("returns only the highest bit index when only bit 63 is set", () => {
      const flags = [1n << 63n];
      expect(getCompletedLessonIndices(flags, 64)).toContain(63);
      expect(getCompletedLessonIndices(flags, 64)).toHaveLength(1);
    });
  });

  describe("cross-word boundary indices", () => {
    it("correctly returns lesson 64 as index 64", () => {
      const flags = [0n, 1n]; // bit 0 of word 1 → lesson 64
      const indices = getCompletedLessonIndices(flags, 65);
      expect(indices).toContain(64);
      expect(indices).toHaveLength(1);
    });

    it("returns indices from both word 0 and word 1", () => {
      const flags = [1n, 1n]; // bit 0 of each word → lessons 0 and 64
      expect(getCompletedLessonIndices(flags, 65)).toEqual([0, 64]);
    });

    it("returns correct indices at lesson 127 boundary", () => {
      const flags = [0n, 1n << 63n]; // lesson 127
      const indices = getCompletedLessonIndices(flags, 128);
      expect(indices).toEqual([127]);
    });

    it("handles three words with bits spread across all", () => {
      // lesson 0, lesson 64, lesson 128
      const flags = [1n, 1n, 1n];
      const indices = getCompletedLessonIndices(flags, 129);
      expect(indices).toEqual([0, 64, 128]);
    });
  });

  describe("return type properties", () => {
    it("always returns an array", () => {
      expect(Array.isArray(getCompletedLessonIndices([], 0))).toBe(true);
      expect(Array.isArray(getCompletedLessonIndices([1n], 5))).toBe(true);
    });

    it("all returned indices are non-negative integers", () => {
      const flags = [0b10110101n]; // bits 0,2,4,5,7
      const indices = getCompletedLessonIndices(flags, 8);
      for (const idx of indices) {
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(idx)).toBe(true);
      }
    });

    it("returned indices are in ascending order", () => {
      // bits 5, 10, 15
      const flags = [(1n << 5n) | (1n << 10n) | (1n << 15n)];
      const indices = getCompletedLessonIndices(flags, 20);
      expect(indices).toEqual([...indices].sort((a, b) => a - b));
    });

    it("length matches countCompletedLessons (within lessonCount bound)", () => {
      const flags = [0b10101010n]; // bits 1,3,5,7
      const lessonCount = 8;
      const indices = getCompletedLessonIndices(flags, lessonCount);
      // Count only the set bits within lessonCount
      let expected = 0;
      for (let i = 0; i < lessonCount; i++) {
        if (isLessonComplete(flags, i)) expected++;
      }
      expect(indices).toHaveLength(expected);
    });
  });
});
