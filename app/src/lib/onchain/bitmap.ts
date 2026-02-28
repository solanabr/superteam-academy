/**
 * Bitmap utilities for decoding lesson completion flags from on-chain Enrollment accounts.
 * The on-chain program stores completed lessons as a `[u64; 4]` bitmap (256 bits),
 * where each bit represents a lesson index (0 = incomplete, 1 = complete).
 */

import { BN } from "@coral-xyz/anchor";

/**
 * Check if a specific lesson is marked complete in the bitmap.
 * @param lessonFlags - Array of 4 BN values representing the `[u64; 4]` bitmap
 * @param lessonIndex - Zero-based lesson index (0–255)
 * @returns true if the lesson's bit is set
 */
export function isLessonComplete(
  lessonFlags: BN[],
  lessonIndex: number
): boolean {
  if (lessonIndex < 0 || lessonIndex >= 256) return false;
  const wordIndex = Math.floor(lessonIndex / 64);
  const bitIndex = lessonIndex % 64;
  return !lessonFlags[wordIndex].and(new BN(1).shln(bitIndex)).isZero();
}

/**
 * Count total completed lessons by counting set bits across the bitmap.
 * @param lessonFlags - Array of 4 BN values representing the `[u64; 4]` bitmap
 * @returns Number of completed lessons (0–256)
 */
export function countCompletedLessons(lessonFlags: BN[]): number {
  return lessonFlags.reduce((sum, word) => {
    let count = 0;
    let w = word.clone();
    while (!w.isZero()) {
      count += w.and(new BN(1)).toNumber();
      w = w.shrn(1);
    }
    return sum + count;
  }, 0);
}

/**
 * Extract the indices of all completed lessons from the bitmap.
 * @param lessonFlags - Array of 4 BN values representing the `[u64; 4]` bitmap
 * @param lessonCount - Total number of lessons in the course (limits scan range)
 * @returns Sorted array of zero-based lesson indices that are complete
 */
export function getCompletedLessonIndices(
  lessonFlags: BN[],
  lessonCount: number
): number[] {
  const completed: number[] = [];
  for (let i = 0; i < lessonCount; i++) {
    if (isLessonComplete(lessonFlags, i)) completed.push(i);
  }
  return completed;
}
