import type BN from "bn.js";

type BitValue = BN | bigint | number;

export function decodeLessonBitmap(
  lessonFlags: BitValue[],
  lessonCount: number
): boolean[] {
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
  if (lessonCount === 0) return false;
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
