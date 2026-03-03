import { describe, it, expect } from 'vitest';
import {
    isLessonComplete,
    countCompletedLessons,
    getCompletedLessonIndices,
    getProgressPercentage,
    isCourseFullyCompleted,
} from '@/context/solana/bitmap';

describe('isLessonComplete', () => {
    it('returns true when bit is set', () => {
        // Bit 0 set → lesson 0 complete
        const flags = [1n];
        expect(isLessonComplete(flags, 0)).toBe(true);
    });

    it('returns false when bit is not set', () => {
        const flags = [0n];
        expect(isLessonComplete(flags, 0)).toBe(false);
    });

    it('handles higher bit positions', () => {
        // Bit 5 set → binary 100000 = 32
        const flags = [32n];
        expect(isLessonComplete(flags, 5)).toBe(true);
        expect(isLessonComplete(flags, 4)).toBe(false);
    });

    it('returns false when wordIndex out of bounds', () => {
        const flags = [1n];
        expect(isLessonComplete(flags, 64)).toBe(false); // Would need flags[1]
    });

    it('handles multiple words', () => {
        // Bit 64 = word 1, bit 0
        const flags = [0n, 1n];
        expect(isLessonComplete(flags, 64)).toBe(true);
        expect(isLessonComplete(flags, 0)).toBe(false);
    });

    it('handles all bits set', () => {
        const allSet = (1n << 64n) - 1n; // All 64 bits set
        const flags = [allSet];
        for (let i = 0; i < 64; i++) {
            expect(isLessonComplete(flags, i)).toBe(true);
        }
    });
});

describe('countCompletedLessons', () => {
    it('returns 0 for empty flags', () => {
        expect(countCompletedLessons([], 0)).toBe(0);
    });

    it('returns 0 for no completions', () => {
        expect(countCompletedLessons([0n], 10)).toBe(0);
    });

    it('counts single completion', () => {
        expect(countCompletedLessons([1n], 10)).toBe(1);
    });

    it('counts multiple completions', () => {
        // Bits 0, 1, 2 set → binary 111 = 7
        expect(countCompletedLessons([7n], 10)).toBe(3);
    });

    it('does not count bits beyond lessonCount', () => {
        // All 64 bits set, but only 3 lessons
        const allSet = (1n << 64n) - 1n;
        expect(countCompletedLessons([allSet], 3)).toBe(3);
    });

    it('handles multiple words', () => {
        const allSet = (1n << 64n) - 1n;
        // 64 lessons in word 0 + 4 lessons in word 1
        expect(countCompletedLessons([allSet, 15n], 68)).toBe(68);
    });
});

describe('getCompletedLessonIndices', () => {
    it('returns empty array for no completions', () => {
        expect(getCompletedLessonIndices([0n], 10)).toEqual([]);
    });

    it('returns correct indices', () => {
        // Bits 0, 2, 4 set → 1 + 4 + 16 = 21
        expect(getCompletedLessonIndices([21n], 5)).toEqual([0, 2, 4]);
    });

    it('limits to lessonCount', () => {
        const allSet = (1n << 64n) - 1n;
        const result = getCompletedLessonIndices([allSet], 3);
        expect(result).toEqual([0, 1, 2]);
    });
});

describe('getProgressPercentage', () => {
    it('returns 0 for no lessons', () => {
        expect(getProgressPercentage([], 0)).toBe(0);
    });

    it('returns 0 for no completions', () => {
        expect(getProgressPercentage([0n], 10)).toBe(0);
    });

    it('returns 100 for all completed', () => {
        // 4 lessons, bits 0-3 set = 15
        expect(getProgressPercentage([15n], 4)).toBe(100);
    });

    it('returns 50 for half completed', () => {
        // 4 lessons, 2 completed (bits 0,1 = 3)
        expect(getProgressPercentage([3n], 4)).toBe(50);
    });

    it('rounds to nearest integer', () => {
        // 3 lessons, 1 completed = 33.33...% → 33
        expect(getProgressPercentage([1n], 3)).toBe(33);
    });
});

describe('isCourseFullyCompleted', () => {
    it('returns true when all lessons completed', () => {
        expect(isCourseFullyCompleted([15n], 4)).toBe(true);
    });

    it('returns false when some lessons incomplete', () => {
        expect(isCourseFullyCompleted([7n], 4)).toBe(false);
    });

    it('returns true for empty course (0 lessons)', () => {
        expect(isCourseFullyCompleted([], 0)).toBe(true);
    });
});
