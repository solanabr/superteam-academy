import BN from 'bn.js';

/**
 * Check whether a specific lesson is marked complete in the on-chain
 * bitmap (stored as [u64; 4] = 256 bits).
 */
export function isLessonComplete(lessonFlags: BN[], lessonIndex: number): boolean {
  const wordIndex = Math.floor(lessonIndex / 64);
  const bitIndex = lessonIndex % 64;
  const word = lessonFlags[wordIndex];
  if (!word) return false;
  return !word.and(new BN(1).shln(bitIndex)).isZero();
}

/**
 * Count total completed lessons by summing set bits across all words.
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
 * Get completion percentage (0-100) given the bitmap and total lesson count.
 */
export function getProgressPercentage(lessonFlags: BN[], lessonCount: number): number {
  if (lessonCount === 0) return 0;
  return (countCompletedLessons(lessonFlags) / lessonCount) * 100;
}

/**
 * Return sorted array of lesson indices that are marked complete.
 */
export function getCompletedLessonIndices(lessonFlags: BN[], lessonCount: number): number[] {
  const completed: number[] = [];
  for (let i = 0; i < lessonCount; i++) {
    if (isLessonComplete(lessonFlags, i)) completed.push(i);
  }
  return completed;
}
