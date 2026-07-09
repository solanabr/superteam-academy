import { z } from "zod";
import { CourseId, PathId } from "./ids";
import { DIFFICULTIES } from "./constants";

/**
 * `path-infrastructure` and `path-security` are live today with zero courses and
 * render as empty shelves. A path is either populated or explicitly a draft.
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
    courses: z.array(CourseId).default([]),
  })
  .refine((p) => p.draft || p.courses.length >= 1, {
    message: "a non-draft learning path must contain at least one course",
    path: ["courses"],
  });

export type LearningPathT = z.infer<typeof LearningPath>;
