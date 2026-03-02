import { BN } from "@coral-xyz/anchor";

/**
 * Checks whether a specific lesson has been marked complete in the bitmap.
 * The on-chain bitmap is stored as [u64; 4] (256 bits total), represented
 * here as BN[]. Each element covers 64 consecutive lesson indices.
 */
export function isLessonComplete(
  lessonFlags: BN[],
  lessonIndex: number
): boolean {
  const wordIndex = Math.floor(lessonIndex / 64);
  const bitIndex = lessonIndex % 64;
  return !lessonFlags[wordIndex].and(new BN(1).shln(bitIndex)).isZero();
}

/**
 * Counts the total number of set bits across all 64-bit words in the bitmap.
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
 * Returns the indices of all completed lessons up to lessonCount.
 */
export function getCompletedLessonIndices(
  lessonFlags: BN[],
  lessonCount: number
): number[] {
  const completed: number[] = [];
  for (let i = 0; i < lessonCount; i++) {
    if (isLessonComplete(lessonFlags, i)) {
      completed.push(i);
    }
  }
  return completed;
}

/**
 * Returns completion progress as a percentage (0–100), clamped to [0, 100].
 * Returns 0 when lessonCount is zero to avoid division by zero.
 */
export function getProgressPercent(
  lessonFlags: BN[],
  lessonCount: number
): number {
  if (lessonCount === 0) return 0;
  const completed = countCompletedLessons(lessonFlags);
  return Math.min(100, Math.floor((completed / lessonCount) * 100));
}
