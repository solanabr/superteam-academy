export function isLessonComplete(
  lessonFlags: readonly bigint[],
  lessonIndex: number,
): boolean {
  const one = BigInt(1);
  const zero = BigInt(0);
  const wordIndex = Math.floor(lessonIndex / 64);
  const bitIndex = lessonIndex % 64;
  const word = lessonFlags[wordIndex] ?? zero;
  return (word & (one << BigInt(bitIndex))) !== zero;
}

export function getCompletedLessonIndices(
  lessonFlags: readonly bigint[],
  totalLessons: number,
): number[] {
  const completed: number[] = [];
  for (let lessonIndex = 0; lessonIndex < totalLessons; lessonIndex += 1) {
    if (isLessonComplete(lessonFlags, lessonIndex)) {
      completed.push(lessonIndex);
    }
  }
  return completed;
}
