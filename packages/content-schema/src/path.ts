import { z } from "zod";
import { CourseId, PathId } from "./ids";
import { DIFFICULTIES } from "./constants";

/**
 * A path is a shelf of courses. An empty shelf never renders (the app hides a
 * path with zero courses), so "no courses" is only legal with an explicit
 * lifecycle flag saying which kind of emptiness it is (#627, owner ruling
 * 2026-07-28):
 *
 *   - `draft: true`   — "coming soon": announced-later, still expected to fill.
 *   - `retired: true` — permanently emptied; the id is preserved because path
 *                       ids are permanent once live.
 *
 * Both flags ARE read at runtime: `getAllLearningPaths`
 * (apps/web/src/lib/content/queries.ts) filters a draft or retired path out of
 * the Paths tab (#1141) — visibility is a content decision, which is what
 * replaced the hardcoded Coming-soon constant. The content gates read them too.
 *
 * content-lint gate 4b enforces the rest: a `retired` path MUST be empty, a
 * draft+empty path MUST also be retired (the implicit-retirement pattern that
 * #559 nearly shipped an unearnable achievement through is now an error), and
 * setting both flags is a redundancy warning.
 */
export const LearningPath = z
  .object({
    id: PathId,
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    title: z.string().min(1),
    description: z.string().optional(),
    tag: z.string().optional(),
    order: z.number().int().min(0).default(0),
    difficulty: z.enum(DIFFICULTIES),
    draft: z.boolean().default(false),
    retired: z.boolean().default(false),
    courses: z.array(CourseId).default([]),
  })
  .refine((p) => p.draft || p.retired || p.courses.length >= 1, {
    message:
      "a learning path with no courses must be marked draft: true or retired: true",
    path: ["courses"],
  });

export type LearningPathT = z.infer<typeof LearningPath>;
