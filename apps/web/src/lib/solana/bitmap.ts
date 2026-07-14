import type BN from "bn.js";

type BitValue = BN | bigint | number;

export function decodeLessonBitmap(
  lessonFlags: BitValue[],
  lessonCount: number
): boolean[] {
  // Throw rather than silently returning [] — a NaN count would otherwise skip
  // the words check (`x < NaN` is false) and skip the loop (`i < NaN` is false),
  // decoding every enrollment as "no lessons complete". The honest answer here
  // is an error (this is a count-derived read; the mask-based completion check
  // in isCourseComplete has no count and needs no such guard).
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

// Mirrors the on-chain `finalize_course` gate exactly:
//   enrollment.lesson_flags.iter().zip(course.active_lessons.iter())
//       .all(|(flags, active)| flags & active == *active)
// This is a SUBSET test over the live-lesson mask, not a dense-prefix check —
// a retired (non-live) lesson slot never blocks completion, and a learner who
// finished every live slot is complete even if a retired slot's bit is unset
// (or, symmetrically, set — the AND against `active` ignores stray bits in
// retired slots either way).
export function isCourseComplete(
  lessonFlags: BitValue[],
  activeLessons: bigint[]
): boolean {
  for (let i = 0; i < activeLessons.length; i++) {
    const active = activeLessons[i] ?? 0n;
    const flagWord = lessonFlags[i];
    const flags = flagWord === undefined ? 0n : BigInt(flagWord.toString());
    if ((flags & active) !== active) return false;
  }
  return true;
}
