import BN from "bn.js";

export function isLessonComplete(
  lessonFlags: BN[],
  lessonIndex: number,
): boolean {
  const wordIndex = Math.floor(lessonIndex / 64);
  const bitIndex = lessonIndex % 64;
  return !lessonFlags[wordIndex].and(new BN(1).shln(bitIndex)).isZero();
}

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

export function getCompletedLessonIndices(
  lessonFlags: BN[],
  lessonCount: number,
): number[] {
  const completed: number[] = [];
  for (let i = 0; i < lessonCount; i++) {
    if (isLessonComplete(lessonFlags, i)) completed.push(i);
  }
  return completed;
}

/** Convert raw [u64; 4] from Anchor (array of BN) to BN[]. */
export function normalizeFlags(raw: unknown): BN[] {
  if (Array.isArray(raw)) {
    return raw.map((v) => (v instanceof BN ? v : new BN(String(v))));
  }
  return [new BN(0), new BN(0), new BN(0), new BN(0)];
}
