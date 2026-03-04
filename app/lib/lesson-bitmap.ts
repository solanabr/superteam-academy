import { BN } from "@coral-xyz/anchor";

function toBnWord(value: unknown): BN | null {
  if (value instanceof BN) return value;
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return new BN(Math.trunc(value));
  }
  if (typeof value === "bigint" && value >= BigInt(0)) {
    return new BN(value.toString());
  }
  if (typeof value === "string" && /^\d+$/.test(value.trim())) {
    return new BN(value.trim(), 10);
  }
  if (value && typeof value === "object") {
    const maybe = value as {
      and?: unknown;
      isZero?: unknown;
      toString?: unknown;
    };
    if (
      typeof maybe.and === "function" &&
      typeof maybe.isZero === "function" &&
      typeof maybe.toString === "function"
    ) {
      try {
        return new BN(String(maybe.toString()));
      } catch {
        return null;
      }
    }
  }
  return null;
}

/** Enrollment account may have completedAt (camelCase) or completed_at (snake_case) from IDL. Returns unix timestamp if set, else null. */
export function getCompletedAtFromEnrollment(enrollment: unknown): number | null {
  if (!enrollment || typeof enrollment !== "object") return null;
  const acc = enrollment as Record<string, unknown>;
  const val = acc.completedAt ?? acc.completed_at;
  if (val == null) return null;
  if (typeof val === "number") return val;
  if (typeof val === "object" && "toNumber" in val && typeof (val as { toNumber: () => number }).toNumber === "function") {
    return (val as { toNumber: () => number }).toNumber();
  }
  return null;
}

/** Enrollment account may have lessonFlags (camelCase) or lesson_flags (snake_case) from IDL */
export function getLessonFlagsFromEnrollment(enrollment: unknown): BN[] {
  if (!enrollment || typeof enrollment !== "object") return [];
  const acc = enrollment as Record<string, unknown>;
  const flags = acc.lessonFlags ?? acc.lesson_flags;
  if (Array.isArray(flags) && flags.length > 0) {
    // Keep bitmap word positions stable. Invalid/missing words become zero.
    return flags.map((word) => toBnWord(word) ?? new BN(0));
  }
  return [];
}

export function isLessonComplete(
  lessonFlags: BN[],
  lessonIndex: number
): boolean {
  if (!Array.isArray(lessonFlags)) return false;
  if (!Number.isInteger(lessonIndex) || lessonIndex < 0) return false;
  const wordIndex = Math.floor(lessonIndex / 64);
  const bitIndex = lessonIndex % 64;
  const word = toBnWord(lessonFlags[wordIndex]);
  if (word === null) return false;
  try {
    return word.testn(bitIndex);
  } catch {
    return false;
  }
}

export function countCompletedLessons(lessonFlags: BN[]): number {
  return lessonFlags.reduce((sum, rawWord) => {
    const word = toBnWord(rawWord);
    if (word === null) return sum;
    let bitsSet = 0;
    for (let bit = 0; bit < word.bitLength(); bit++) {
      if (word.testn(bit)) bitsSet += 1;
    }
    return sum + bitsSet;
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
