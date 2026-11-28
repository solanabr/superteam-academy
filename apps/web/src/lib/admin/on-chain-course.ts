import type { DecodedCourse } from "@/lib/solana/academy-reads";
import { isMainnetCluster, networkFromRpcUrl } from "@/lib/solana/network";
import type { OnChainCourse } from "./sync-diff";

/**
 * Map the normalised `DecodedCourse` (snake_case: `decodeCourse` bypasses
 * Anchor's camelCase IDL conversion) to the diff engine's `OnChainCourse`.
 * Takes `DecodedCourse` directly (no shadow interface, no cast) so that a
 * field dropped from `DecodedCourse` fails `tsc`, not silently reads as
 * `undefined`. The status route and the sync route both diff through this.
 */
export function toOnChainCourse(
  courseId: string,
  raw: DecodedCourse
): OnChainCourse {
  return {
    courseId,
    creator: raw.creator.toBase58(),
    lessonCount: raw.liveLessonCount,
    difficulty: raw.difficulty,
    xpPerLesson: raw.xp_per_lesson,
    trackId: raw.track_id,
    trackLevel: raw.track_level,
    prerequisite: raw.prerequisite ? raw.prerequisite.toBase58() : null,
    creatorRewardXp: raw.creator_reward_xp,
    totalCompletions: raw.total_completions,
    totalEnrollments: raw.total_enrollments,
    isActive: raw.is_active,
    version: raw.version,
  };
}

/**
 * The legacy track rule (on-chain track 0 from before tracks existed) is
 * devnet-only and fails closed: it applies only when the RPC host names devnet
 * and nothing (label or host) says mainnet. An unidentified cluster keeps every
 * immutable diff blocking. No RPC call: host and label only.
 */
export function allowLegacyTrackFor(rpcUrl: string): boolean {
  return !isMainnetCluster(rpcUrl) && networkFromRpcUrl(rpcUrl) === "devnet";
}
