import { z } from "zod";
import { AchievementId, CourseId, PathId } from "./ids";
import {
  ACHIEVEMENT_CATEGORIES,
  COMMUNITY_STATS,
  MAX_XP_PER_MINT,
} from "./constants";

/**
 * Unlock logic is content, not TypeScript (spec D9). Today `event-handlers.ts:76`
 * hardcodes SOLANA_DEV_PATH_COURSES — four course ids matching no learningPath in
 * the dataset — and `allTestsPassedFirstTry` is hardcoded false at both UserState
 * construction sites, making `achievement-perfect-score` unreachable.
 *
 * Plan 7 implements `PREDICATES satisfies Record<AwardKind, Predicate>` against
 * exactly these kinds, so a kind with no predicate is a compile error.
 */
export const Award = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("lessons-completed"),
    gte: z.number().int().min(1),
  }),
  z.object({
    kind: z.literal("lessons-completed-in-course"),
    course: CourseId,
    gte: z.number().int().min(1),
  }),
  z.object({ kind: z.literal("course-completed"), course: CourseId }),
  z.object({ kind: z.literal("path-completed"), path: PathId }),
  z.object({ kind: z.literal("streak"), days: z.number().int().min(1) }),
  z.object({ kind: z.literal("user-number"), lte: z.number().int().min(1) }),
  z.object({
    kind: z.literal("community-stat"),
    stat: z.enum(COMMUNITY_STATS),
    gte: z.number().int().min(1),
  }),
  /** Admin-granted. `bug-hunter` is this by design (achievements.ts:60). */
  z.object({ kind: z.literal("manual") }),
]);

export type AwardT = z.infer<typeof Award>;
export type AwardKind = AwardT["kind"];

export const AWARD_KINDS = [
  "lessons-completed",
  "lessons-completed-in-course",
  "course-completed",
  "path-completed",
  "streak",
  "user-number",
  "community-stat",
  "manual",
] as const satisfies readonly AwardKind[];

export const Achievement = z.object({
  id: AchievementId,
  name: z.string().min(1),
  description: z.string().optional(),
  icon: z.string().optional(),
  glyph: z.string().min(1).max(2).optional(),
  solTier: z.boolean().default(false),
  category: z.enum(ACHIEVEMENT_CATEGORIES),
  xpReward: z.number().int().min(1).max(MAX_XP_PER_MINT),
  maxSupply: z.number().int().min(0).default(0),
  metadataUri: z.url().optional(),
  /** Required. An achievement with no award kind cannot be earned. */
  award: Award,
});

export type AchievementT = z.infer<typeof Achievement>;
