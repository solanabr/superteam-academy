import type BN from "bn.js";

type BitValue = BN | bigint | number;

export function decodeLessonBitmap(
  lessonFlags: BitValue[],
  lessonCount: number
): boolean[] {
  // Throw rather than silently returning [] — a NaN count would otherwise skip
  // the words check (`x < NaN` is false) and skip the loop (`i < NaN` is false),
  // decoding every enrollment as "no lessons complete". Same NaN-from-a-chain-read
  // hazard guarded in isAllLessonsComplete; here the honest answer is an error.
  if (!Number.isFinite(lessonCount) || lessonCount < 0) {
    throw new Error(`decodeLessonBitmap: invalid lessonCount=${lessonCount}`);
  }
  const wordsNeeded = Math.ceil(lessonCount / 64);
  if (lessonFlags.length < wordsNeeded) {
    throw new Error(
      `lessonFlags has ${lessonFlags.length} words but lessonCount=${lessonCount} requires ${wordsNeeded}`
    );
  }
  const result: boolean[] = [];
  for (let i = 0; i < lessonCount; i++) {
    const wordIndex = Math.floor(i / 64);
    const bitIndex = i % 64;
    const flagWord = lessonFlags[wordIndex] as BitValue;
    const word = BigInt(flagWord.toString());
    result.push((word & (1n << BigInt(bitIndex))) !== 0n);
  }
  return result;
}

export function isLessonComplete(
  lessonFlags: BitValue[],
  lessonIndex: number
): boolean {
  const wordIndex = Math.floor(lessonIndex / 64);
  const bitIndex = lessonIndex % 64;
  if (lessonFlags.length <= wordIndex) return false;
  const word = BigInt((lessonFlags[wordIndex] as BitValue).toString());
  return (word & (1n << BigInt(bitIndex))) !== 0n;
}

export function isAllLessonsComplete(
  lessonFlags: BitValue[],
  lessonCount: number
): boolean {
  // Fail CLOSED on a non-finite count. Callers derive this from a chain read
  // (`Number(course.lesson_count)`), so a field the coder cannot see yields NaN
  // — and NaN sails through every guard below: `NaN === 0` is false, `x < NaN`
  // is false, and `i < NaN` is false on the first iteration, so the loop never
  // runs and the function falls through to `return true`. "Nobody has completed
  // anything" would then read as "everybody has completed everything".
  if (!Number.isFinite(lessonCount) || lessonCount <= 0) return false;
  const wordsNeeded = Math.ceil(lessonCount / 64);
  if (lessonFlags.length < wordsNeeded) return false;
  for (let i = 0; i < lessonCount; i++) {
    const wordIndex = Math.floor(i / 64);
    const bitIndex = i % 64;
    const flagWord = lessonFlags[wordIndex] as BitValue;
    const word = BigInt(flagWord.toString());
    if ((word & (1n << BigInt(bitIndex))) === 0n) return false;
  }
  return true;
}
