import "server-only";
import { BLOCK_REGISTRY, type BlockType } from "@superteam-lms/content-schema";
import type { Grader } from "../types";
import { gradeCode } from "./code";
import { gradeQuiz } from "./quiz";

/** The graded block types, derived from CS-1's registry — not a hand-kept list. */
export type GradedBlockType = {
  [K in BlockType]: (typeof BLOCK_REGISTRY)[K]["graded"] extends true
    ? K
    : never;
}[BlockType];

/**
 * `satisfies` makes an unregistered graded type a COMPILE error, and a grader
 * for a non-graded type equally so. This is the inversion's backbone: the gate
 * asks GRADERS[type], and a missing grader is denial by construction.
 */
export const GRADERS = {
  code: gradeCode,
  quiz: gradeQuiz,
} satisfies Record<GradedBlockType, Grader>;
