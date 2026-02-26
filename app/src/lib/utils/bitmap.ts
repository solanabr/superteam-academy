export function isLessonComplete(lessonFlags: number[], lessonIndex: number): boolean {
  const wordIndex = Math.floor(lessonIndex / 32);
  const bitIndex = lessonIndex % 32;
  if (wordIndex >= lessonFlags.length) return false;
  return (lessonFlags[wordIndex] & (1 << bitIndex)) !== 0;
}

export function countCompletedLessons(lessonFlags: number[], lessonCount: number): number {
  let count = 0;
  for (let i = 0; i < lessonCount; i++) {
    if (isLessonComplete(lessonFlags, i)) count++;
  }
  return count;
}

export function getCompletedLessonIndices(lessonFlags: number[], lessonCount: number): number[] {
  const completed: number[] = [];
  for (let i = 0; i < lessonCount; i++) {
    if (isLessonComplete(lessonFlags, i)) completed.push(i);
  }
  return completed;
}

export function setBit(lessonFlags: number[], lessonIndex: number): number[] {
  const newFlags = [...lessonFlags];
  const wordIndex = Math.floor(lessonIndex / 32);
  const bitIndex = lessonIndex % 32;
  while (newFlags.length <= wordIndex) newFlags.push(0);
  newFlags[wordIndex] = newFlags[wordIndex] | (1 << bitIndex);
  return newFlags;
}
