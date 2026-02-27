import { BN } from "@coral-xyz/anchor";

/**
 * Checks whether a specific lesson (by 0-based index) is complete.
 * Enrollment stores progress as [u64; 4] = 256 bits total.
 */
export function isLessonComplete(lessonFlags: BN[], lessonIndex: number): boolean {
  const wordIndex = Math.floor(lessonIndex / 64);
  const bitIndex = lessonIndex % 64;
  if (wordIndex >= lessonFlags.length) return false;
  return !lessonFlags[wordIndex].and(new BN(1).shln(bitIndex)).isZero();
}

/**
 * Counts total completed lessons across all bitmap words.
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
 * Returns an array of completed lesson indices (0-based), up to lessonCount.
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
 * Returns completion percentage (0-100) for a given enrollment.
 */
export function getCompletionPercent(
  lessonFlags: BN[],
  lessonCount: number
): number {
  if (lessonCount === 0) return 0;
  const completed = countCompletedLessons(lessonFlags);
  return Math.round((completed / lessonCount) * 100);
}

/**
 * Checks whether all lessons are complete.
 */
export function isFullyComplete(
  lessonFlags: BN[],
  lessonCount: number
): boolean {
  return countCompletedLessons(lessonFlags) >= lessonCount;
}

/**
 * Returns empty flags (4 zero BNs).
 */
export function emptyFlags(): BN[] {
  return [new BN(0), new BN(0), new BN(0), new BN(0)];
}
