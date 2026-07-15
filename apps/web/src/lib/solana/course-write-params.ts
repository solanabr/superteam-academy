import { BN } from "@coral-xyz/anchor";
import type { PublicKey } from "@solana/web3.js";

/**
 * Pure mappers + validators for the v-next `create_course` / `update_course`
 * write path. Kept free of `server-only`, RPC, and keypair concerns so the
 * param encoding — the part most at risk of a silent truncation bug — is unit
 * testable without touching the chain. `admin-signer.ts` composes these behind
 * its authority-signing wrappers.
 *
 * These structs mirror the v-next Rust params EXACTLY
 * (`superteam_academy_vnext.json`):
 *   - `CreateCourseParams` keeps `lesson_count: u8` and DROPS
 *     `min_completions_for_reward` (the program derives
 *     `active_lessons = dense_mask(lesson_count)` internally on create).
 *   - `UpdateCourseParams` DROPS `new_lesson_count` and
 *     `new_min_completions_for_reward`, replacing them with
 *     `new_active_lessons: Option<[u64; 4]>`.
 */

/** A 256-bit live-lesson mask as four little-endian u64 words. */
export type ActiveLessonsMask = readonly [bigint, bigint, bigint, bigint];

/** Mirrors v-next `CreateCourseParams` (camelCase for Anchor's method builder). */
export interface CreateCourseOnChainParams {
  courseId: string;
  creator: PublicKey;
  contentTxId: number[];
  lessonCount: number;
  difficulty: number;
  xpPerLesson: number;
  trackId: number;
  trackLevel: number;
  prerequisite: PublicKey | null;
  creatorRewardXp: number;
  collection: PublicKey | null;
}

/** Mirrors v-next `UpdateCourseParams` (camelCase for Anchor's method builder). */
export interface UpdateCourseOnChainParams {
  newContentTxId: number[] | null;
  newIsActive: boolean | null;
  newXpPerLesson: number | null;
  newCreatorRewardXp: number | null;
  newCollection: PublicKey | null;
  newActiveLessons: BN[] | null;
}

// `lesson_count` is a u8 on-chain arg: 0 is rejected by the program
// (InvalidLessonCount) and anything above 255 overflows the byte. (#332)
export const MIN_LESSON_COUNT = 1;
export const MAX_LESSON_COUNT = 255;

/** #332: a valid on-chain `lesson_count` is an integer in `1..=255`. */
export function isValidLessonCount(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= MIN_LESSON_COUNT &&
    value <= MAX_LESSON_COUNT
  );
}

/**
 * Encode a 256-bit live-lesson mask (`[u64; 4]` as bigints) to the `BN[4]`
 * Anchor's BorshCoder serializes into `new_active_lessons`.
 *
 * BigInt → BN via decimal string. NEVER `Number(word)` or `word & mask`: u64
 * words routinely carry bits above 2^32, and JS bitwise ops coerce to int32 and
 * truncate them. `new BN(word.toString())` is exact across the full u64 range.
 */
export function encodeActiveLessonsMask(mask: ActiveLessonsMask): BN[] {
  return mask.map((word) => new BN(word.toString()));
}

/**
 * Assemble the v-next `create_course` on-chain params. No mask encoding: the
 * program derives `active_lessons = dense_mask(lessonCount)` itself, so the
 * client only sends `lessonCount` and never `min_completions_for_reward`.
 */
export function buildCreateCourseOnChainParams(
  input: CreateCourseOnChainParams
): CreateCourseOnChainParams {
  return {
    courseId: input.courseId,
    creator: input.creator,
    contentTxId: input.contentTxId,
    lessonCount: input.lessonCount,
    difficulty: input.difficulty,
    xpPerLesson: input.xpPerLesson,
    trackId: input.trackId,
    trackLevel: input.trackLevel,
    prerequisite: input.prerequisite,
    creatorRewardXp: input.creatorRewardXp,
    collection: input.collection,
  };
}

/**
 * Assemble the v-next `update_course` on-chain params. `newActiveLessons` is
 * the ONLY field that needs mask encoding — done here via
 * {@link encodeActiveLessonsMask}. Absent optionals map to `null` (Anchor
 * `Option::None`), leaving the field unchanged on-chain.
 */
export function buildUpdateCourseOnChainParams(input: {
  newContentTxId?: number[] | null;
  newIsActive?: boolean | null;
  newXpPerLesson?: number | null;
  newCreatorRewardXp?: number | null;
  newCollection?: PublicKey | null;
  newActiveLessons?: ActiveLessonsMask | null;
}): UpdateCourseOnChainParams {
  return {
    newContentTxId: input.newContentTxId ?? null,
    newIsActive: input.newIsActive ?? null,
    newXpPerLesson: input.newXpPerLesson ?? null,
    newCreatorRewardXp: input.newCreatorRewardXp ?? null,
    newCollection: input.newCollection ?? null,
    newActiveLessons: input.newActiveLessons
      ? encodeActiveLessonsMask(input.newActiveLessons)
      : null,
  };
}
