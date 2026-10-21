import { BorshCoder } from "@coral-xyz/anchor";
import type { Idl } from "@coral-xyz/anchor";
import { decodeCourse } from "./academy-reads";
import IDL from "./idl/superteam_academy.json";

/**
 * The program's course generation, read through the committed IDLs.
 *
 * The Pinocchio program stamps every Course with `generation` (u32) and every
 * Enrollment with the `course_gen` it was made under, in the words the IDLs
 * still name `_reserved` (Course: the first 4 of 8 bytes; Enrollment: all 4).
 * A recreated course gets a new generation, and `enroll` re-initialises an
 * enrollment from an older one in place. A Course from before generations
 * existed reads as 0.
 */

const coder = new BorshCoder(IDL as unknown as Idl);

function u32le(bytes: ArrayLike<number>): number {
  return (
    ((bytes[0] ?? 0) |
      ((bytes[1] ?? 0) << 8) |
      ((bytes[2] ?? 0) << 16) |
      ((bytes[3] ?? 0) << 24)) >>>
    0
  );
}

/** `Course.generation` from a Course account's data. Throws on a bad layout. */
export function courseGeneration(data: Buffer): number {
  return u32le(decodeCourse(data)._reserved);
}

/** `Enrollment.course_gen` from an Enrollment account's data. */
export function enrollmentCourseGeneration(data: Buffer): number {
  const raw = coder.accounts.decode<{ _reserved: number[] }>(
    "Enrollment",
    data
  );
  return u32le(raw._reserved);
}
