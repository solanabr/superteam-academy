import { z } from "zod";
import { LessonId } from "./ids";
import { Block } from "./blocks";

const unique = <T>(xs: readonly T[]) => new Set(xs).size === xs.length;

/**
 * The lesson is the atomic completable unit: `complete_lesson` flips one bit of
 * the on-chain bitmap. Blocks are ordered; block results are transient and never
 * persisted per-block.
 *
 * There is no `xpReward`. Per-lesson XP is `course.xpPerLesson`, held in the
 * Course PDA. Zod strips unknown keys, so a stray `xpReward:` is dropped rather
 * than honoured — 76 seed lessons carry one today and nothing reads it. The
 * linter (Plan 2) reports stripped keys as warnings so authors are not confused.
 */
export const Lesson = z
  .object({
    id: LessonId,
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    title: z.string().min(1),
    blocks: z.array(Block).min(1),
  })
  .refine((l) => unique(l.blocks.map((b) => b.key)), {
    message: "block keys must be unique within a lesson",
    path: ["blocks"],
  });

export type LessonT = z.infer<typeof Lesson>;
