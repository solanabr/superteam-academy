/**
 * Lesson bitmap utilities for Superteam Academy.
 *
 * The on-chain program stores lesson completion as a bitmap
 * in an array of u64 values (represented as bigint in TS).
 * Each bit represents one lesson — 1 = completed, 0 = not.
 *
 * Layout: lessonFlags[wordIndex] where wordIndex = floor(lessonIndex / 64)
 *         bit position within word = lessonIndex % 64
 */

const BITS_PER_WORD = 64;

/**
 * Check if a specific lesson is marked as complete in the bitmap.
 */
export function isLessonComplete(lessonFlags: bigint[], lessonIndex: number): boolean {
    const wordIndex = Math.floor(lessonIndex / BITS_PER_WORD);
    const bitIndex = lessonIndex % BITS_PER_WORD;

    if (wordIndex >= lessonFlags.length) {
        return false;
    }

    return (lessonFlags[wordIndex] & (1n << BigInt(bitIndex))) !== 0n;
}

/**
 * Count set bits in a bigint using Kernighan's algorithm.
 * O(number of set bits) — much faster than checking every bit position.
 */
function popcountBigInt(n: bigint): number {
    let count = 0;
    let val = n;
    while (val !== 0n) {
        val &= val - 1n; // Clear lowest set bit
        count++;
    }
    return count;
}

/**
 * Count the total number of completed lessons.
 *
 * Uses popcount on each word for O(set bits) performance
 * instead of O(lessonCount) per-bit iteration. For the last
 * word, we mask off bits beyond lessonCount.
 */
export function countCompletedLessons(lessonFlags: bigint[], lessonCount: number): number {
    if (lessonCount === 0) return 0;

    const fullWords = Math.floor(lessonCount / BITS_PER_WORD);
    const remainingBits = lessonCount % BITS_PER_WORD;
    let count = 0;

    // Count full words
    for (let i = 0; i < fullWords && i < lessonFlags.length; i++) {
        count += popcountBigInt(lessonFlags[i]);
    }

    // Count remaining bits in last partial word
    if (remainingBits > 0 && fullWords < lessonFlags.length) {
        const mask = (1n << BigInt(remainingBits)) - 1n;
        count += popcountBigInt(lessonFlags[fullWords] & mask);
    }

    return count;
}

/**
 * Get an array of indices for all completed lessons.
 */
export function getCompletedLessonIndices(lessonFlags: bigint[], lessonCount: number): number[] {
    const completed: number[] = [];
    for (let i = 0; i < lessonCount; i++) {
        if (isLessonComplete(lessonFlags, i)) {
            completed.push(i);
        }
    }
    return completed;
}

/**
 * Calculate the progress percentage (0–100) for a course.
 */
export function getProgressPercentage(lessonFlags: bigint[], lessonCount: number): number {
    if (lessonCount === 0) return 0;
    const completed = countCompletedLessons(lessonFlags, lessonCount);
    return Math.round((completed / lessonCount) * 100);
}

/**
 * Check if all lessons in a course are completed.
 */
export function isCourseFullyCompleted(lessonFlags: bigint[], lessonCount: number): boolean {
    return countCompletedLessons(lessonFlags, lessonCount) === lessonCount;
}

