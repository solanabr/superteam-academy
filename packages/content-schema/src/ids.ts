import { z } from "zod";
import { MAX_COURSE_ID_BYTES, MAX_LESSON_ID_BYTES } from "./constants";

/**
 * UTF-8 byte length. Deliberately not `Buffer.byteLength` — this package is
 * imported by browser bundles as well as CI scripts.
 */
export function byteLength(s: string): number {
  return new TextEncoder().encode(s).length;
}

/**
 * Ids are the stricter `[a-z0-9-]`, a subset of Sanity's `a-zA-Z0-9._-`.
 * Course and achievement ids become PDA seeds verbatim (see the project rule:
 * never strip an id before using it as a seed), so they carry a byte cap.
 */
const SEGMENT = "[a-z0-9]+(?:-[a-z0-9]+)*";

function prefixedId(prefix: string, maxBytes: number) {
  const re = new RegExp(`^${prefix}-${SEGMENT}$`);
  return z
    .string()
    .regex(re, `must match ${prefix}-<kebab-case-slug>`)
    .refine((v) => byteLength(v) <= maxBytes, {
      message: `must be at most ${maxBytes} UTF-8 bytes`,
    });
}

/** PDA seed. `["course", course_id.as_bytes()]` */
export const CourseId = prefixedId("course", MAX_COURSE_ID_BYTES);

/** PDA seed. `["achievement", achievement_id.as_bytes()]` */
export const AchievementId = prefixedId("achievement", MAX_COURSE_ID_BYTES);

/** Supabase `user_progress.lesson_id`. Not a seed — the wider cap applies. */
export const LessonId = prefixedId("lesson", MAX_LESSON_ID_BYTES);

/** Note the `path-` prefix, which deliberately does not match the type name. */
export const PathId = prefixedId("path", MAX_LESSON_ID_BYTES);

export const InstructorId = prefixedId("instructor", MAX_LESSON_ID_BYTES);
export const QuestId = prefixedId("quest", MAX_LESSON_ID_BYTES);

/** Stable within a lesson; becomes the Sanity array item `_key`. */
export const BlockKey = z
  .string()
  .regex(new RegExp(`^${SEGMENT}$`), "must be kebab-case");

/** Stable within a course; modules are inline objects, not documents. */
export const ModuleKey = BlockKey;

export type CourseIdT = z.infer<typeof CourseId>;
export type LessonIdT = z.infer<typeof LessonId>;
export type AchievementIdT = z.infer<typeof AchievementId>;
export type PathIdT = z.infer<typeof PathId>;
