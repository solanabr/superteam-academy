import { describe, it, expect } from 'vitest';
import BN from 'bn.js';
import {
  isLessonComplete,
  countCompletedLessons,
  getProgressPercentage,
  getCompletedLessonIndices,
} from '../bitmap';

/**
 * Helper: create a [u64; 4] bitmap (256 bits) with specific bits set.
 * lessonIndices are the bit positions to set (0-255).
 */
function makeBitmap(lessonIndices: number[]): BN[] {
  const words = [new BN(0), new BN(0), new BN(0), new BN(0)];
  for (const idx of lessonIndices) {
    const wordIndex = Math.floor(idx / 64);
    const bitIndex = idx % 64;
    words[wordIndex] = words[wordIndex]!.or(new BN(1).shln(bitIndex));
  }
  return words;
}

/** All-zero bitmap */
const EMPTY_BITMAP: BN[] = [new BN(0), new BN(0), new BN(0), new BN(0)];

/** All 256 bits set */
function fullBitmap(): BN[] {
  const max64 = new BN(1).shln(64).subn(1); // 2^64 - 1
  return [max64.clone(), max64.clone(), max64.clone(), max64.clone()];
}

describe('bitmap helpers', () => {
  describe('isLessonComplete', () => {
    it('returns false for all indices on an empty bitmap', () => {
      expect(isLessonComplete(EMPTY_BITMAP, 0)).toBe(false);
      expect(isLessonComplete(EMPTY_BITMAP, 63)).toBe(false);
      expect(isLessonComplete(EMPTY_BITMAP, 64)).toBe(false);
      expect(isLessonComplete(EMPTY_BITMAP, 127)).toBe(false);
      expect(isLessonComplete(EMPTY_BITMAP, 255)).toBe(false);
    });

    it('detects bit 0 set (first bit of first word)', () => {
      const bitmap = makeBitmap([0]);
      expect(isLessonComplete(bitmap, 0)).toBe(true);
      expect(isLessonComplete(bitmap, 1)).toBe(false);
    });

    it('detects bit 1 set (second bit of first word)', () => {
      const bitmap = makeBitmap([1]);
      expect(isLessonComplete(bitmap, 0)).toBe(false);
      expect(isLessonComplete(bitmap, 1)).toBe(true);
      expect(isLessonComplete(bitmap, 2)).toBe(false);
    });

    it('detects bit 63 set (last bit of first word)', () => {
      const bitmap = makeBitmap([63]);
      expect(isLessonComplete(bitmap, 62)).toBe(false);
      expect(isLessonComplete(bitmap, 63)).toBe(true);
      expect(isLessonComplete(bitmap, 64)).toBe(false);
    });

    it('detects bit 64 set (first bit of second word)', () => {
      const bitmap = makeBitmap([64]);
      expect(isLessonComplete(bitmap, 63)).toBe(false);
      expect(isLessonComplete(bitmap, 64)).toBe(true);
      expect(isLessonComplete(bitmap, 65)).toBe(false);
    });

    it('detects bit 127 set (last bit of second word)', () => {
      const bitmap = makeBitmap([127]);
      expect(isLessonComplete(bitmap, 126)).toBe(false);
      expect(isLessonComplete(bitmap, 127)).toBe(true);
      expect(isLessonComplete(bitmap, 128)).toBe(false);
    });

    it('detects bit 255 set (last bit of last word)', () => {
      const bitmap = makeBitmap([255]);
      expect(isLessonComplete(bitmap, 254)).toBe(false);
      expect(isLessonComplete(bitmap, 255)).toBe(true);
    });

    it('handles multiple bits set across words', () => {
      const bitmap = makeBitmap([0, 63, 64, 127, 200, 255]);
      expect(isLessonComplete(bitmap, 0)).toBe(true);
      expect(isLessonComplete(bitmap, 63)).toBe(true);
      expect(isLessonComplete(bitmap, 64)).toBe(true);
      expect(isLessonComplete(bitmap, 127)).toBe(true);
      expect(isLessonComplete(bitmap, 200)).toBe(true);
      expect(isLessonComplete(bitmap, 255)).toBe(true);
      expect(isLessonComplete(bitmap, 1)).toBe(false);
      expect(isLessonComplete(bitmap, 100)).toBe(false);
    });

    it('returns false for out-of-bounds word index', () => {
      expect(isLessonComplete(EMPTY_BITMAP, 256)).toBe(false);
      expect(isLessonComplete(EMPTY_BITMAP, 999)).toBe(false);
    });
  });

  describe('countCompletedLessons', () => {
    it('returns 0 for empty bitmap', () => {
      expect(countCompletedLessons(EMPTY_BITMAP)).toBe(0);
    });

    it('counts single bit correctly', () => {
      expect(countCompletedLessons(makeBitmap([42]))).toBe(1);
    });

    it('counts multiple bits across words', () => {
      expect(countCompletedLessons(makeBitmap([0, 63, 64, 127, 200, 255]))).toBe(6);
    });

    it('counts 256 bits for full bitmap', () => {
      expect(countCompletedLessons(fullBitmap())).toBe(256);
    });

    it('counts partial fill correctly', () => {
      // Set bits 0-9 (10 bits in first word)
      const indices = Array.from({ length: 10 }, (_, i) => i);
      expect(countCompletedLessons(makeBitmap(indices))).toBe(10);
    });
  });

  describe('getProgressPercentage', () => {
    it('returns 0 for empty bitmap', () => {
      expect(getProgressPercentage(EMPTY_BITMAP, 10)).toBe(0);
    });

    it('returns 0 when lessonCount is 0', () => {
      expect(getProgressPercentage(EMPTY_BITMAP, 0)).toBe(0);
    });

    it('returns 100 when all lessons complete', () => {
      const bitmap = makeBitmap([0, 1, 2, 3, 4]);
      expect(getProgressPercentage(bitmap, 5)).toBe(100);
    });

    it('returns 50 for half completion', () => {
      const bitmap = makeBitmap([0, 1, 2, 3, 4]);
      expect(getProgressPercentage(bitmap, 10)).toBe(50);
    });

    it('handles fractional percentages', () => {
      const bitmap = makeBitmap([0]);
      const pct = getProgressPercentage(bitmap, 3);
      expect(pct).toBeCloseTo(33.33, 1);
    });
  });

  describe('getCompletedLessonIndices', () => {
    it('returns empty array for empty bitmap', () => {
      expect(getCompletedLessonIndices(EMPTY_BITMAP, 10)).toEqual([]);
    });

    it('returns correct indices for sparse bitmap', () => {
      const bitmap = makeBitmap([0, 5, 64, 200]);
      const result = getCompletedLessonIndices(bitmap, 256);
      expect(result).toEqual([0, 5, 64, 200]);
    });

    it('only returns indices within lessonCount', () => {
      const bitmap = makeBitmap([0, 5, 64, 200]);
      const result = getCompletedLessonIndices(bitmap, 10);
      expect(result).toEqual([0, 5]);
    });

    it('returns all indices for full bitmap', () => {
      const bitmap = fullBitmap();
      const result = getCompletedLessonIndices(bitmap, 256);
      expect(result).toHaveLength(256);
      expect(result[0]).toBe(0);
      expect(result[255]).toBe(255);
    });

    it('returns empty array when lessonCount is 0', () => {
      const bitmap = makeBitmap([0, 1, 2]);
      expect(getCompletedLessonIndices(bitmap, 0)).toEqual([]);
    });
  });
});
