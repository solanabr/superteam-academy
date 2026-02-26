import { BN } from "@coral-xyz/anchor";

/** Enrollment account may have lessonFlags (camelCase) or lesson_flags (snake_case) from IDL */
export function getLessonFlagsFromEnrollment(enrollment: unknown): BN[] {
  if (!enrollment || typeof enrollment !== "object") return [];
  const acc = enrollment as Record<string, unknown>;
  const flags = acc.lessonFlags ?? acc.lesson_flags;
  if (Array.isArray(flags) && flags.length > 0) return flags as BN[];
  return [];
}

export function isLessonComplete(
  lessonFlags: BN[],
  lessonIndex: number
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
  lessonCount: number
): number[] {
  const completed: number[] = [];
  for (let i = 0; i < lessonCount; i++) {
    if (isLessonComplete(lessonFlags, i)) completed.push(i);
  }
  return completed;
}
