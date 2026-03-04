type BNLike = bigint | { toString: () => string };

function toBigInt(word: BNLike): bigint {
  return typeof word === 'bigint' ? word : BigInt(word.toString());
}

export function isLessonComplete(lessonFlags: BNLike[], lessonIndex: number): boolean {
  const wordIndex = Math.floor(lessonIndex / 64);
  const bitIndex = lessonIndex % 64;
  const raw = lessonFlags[wordIndex];
  if (raw === undefined) return false;
  const word = toBigInt(raw);
  return (word >> BigInt(bitIndex)) & 1n ? true : false;
}

export function countCompletedLessons(lessonFlags: BNLike[]): number {
  return lessonFlags.reduce<number>((sum, raw) => {
    let count = 0;
    let w = toBigInt(raw);
    while (w !== 0n) {
      count += Number(w & 1n);
      w >>= 1n;
    }
    return sum + count;
  }, 0);
}

export function getCompletedLessonIndices(lessonFlags: BNLike[], lessonCount: number): number[] {
  const completed: number[] = [];
  for (let i = 0; i < lessonCount; i++) {
    if (isLessonComplete(lessonFlags, i)) completed.push(i);
  }
  return completed;
}
