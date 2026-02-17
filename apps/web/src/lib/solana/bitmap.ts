import type BN from "bn.js";

type BitValue = BN | bigint | number;

export function decodeLessonBitmap(
  lessonFlags: BitValue[],
  lessonCount: number
): boolean[] {
  const result: boolean[] = [];
  for (let i = 0; i < lessonCount; i++) {
    const wordIndex = Math.floor(i / 64);
    const bitIndex = i % 64;
    const flagWord = lessonFlags[wordIndex];
    if (flagWord === undefined) break;
    const word = BigInt(flagWord.toString());
    result.push((word & (1n << BigInt(bitIndex))) !== 0n);
  }
  return result;
}

export function isAllLessonsComplete(
  lessonFlags: BitValue[],
  lessonCount: number
): boolean {
  for (let i = 0; i < lessonCount; i++) {
    const wordIndex = Math.floor(i / 64);
    const bitIndex = i % 64;
    const flagWord = lessonFlags[wordIndex];
    if (flagWord === undefined) return false;
    const word = BigInt(flagWord.toString());
    if ((word & (1n << BigInt(bitIndex))) === 0n) return false;
  }
  return true;
}
