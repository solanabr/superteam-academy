/**
 * Diff engine: compares Sanity document data against on-chain PDA state.
 *
 * Used by the admin dashboard and API routes to determine what needs syncing.
 * Pure functions — no side effects, no RPC calls.
 */

import type { AdminAchievement, AdminCourse } from "@/lib/sanity/queries";

// ---------------------------------------------------------------------------
// On-chain account shapes (deserialized from Anchor)
// ---------------------------------------------------------------------------

export interface OnChainCourse {
  courseId: string;
  creator: string; // base58
  lessonCount: number;
  difficulty: number; // 1-3
  xpPerLesson: number;
  trackId: number;
  trackLevel: number;
  prerequisite: string | null; // base58 pubkey or null
  creatorRewardXp: number;
  minCompletionsForReward: number;
  totalCompletions: number;
  totalEnrollments: number;
  isActive: boolean;
  version: number;
}

export interface OnChainAchievement {
  achievementId: string;
  name: string;
  metadataUri: string;
  collection: string; // base58
  creator: string; // base58
  maxSupply: number;
  currentSupply: number;
  xpReward: number;
  isActive: boolean;
}

// ---------------------------------------------------------------------------
// Diff types
// ---------------------------------------------------------------------------

export type SyncStatus =
  | "synced"
  | "out_of_sync"
  | "not_deployed"
  | "draft"
  | "missing_fields";

export interface DiffEntry {
  field: string;
  sanityValue: unknown;
  onChainValue: unknown;
  /** true = can be fixed with updateCourse/updateAchievement. false = immutable. */
  updateable: boolean;
}

export interface SyncDiff {
  status: SyncStatus;
  /** Fields present in Sanity but required for on-chain create that are null/undefined */
  missingFields: string[];
  differences: DiffEntry[];
  /** true if any immutable field differs (requires PDA recreation) */
  hasImmutableMismatch: boolean;
}

// ---------------------------------------------------------------------------
// Helper: difficulty string → number
// ---------------------------------------------------------------------------

/**
 * Convert a Sanity difficulty string to its on-chain numeric representation.
 * Defaults to 1 (beginner) for unrecognized values.
 */
export function difficultyToNumber(difficulty: string): number {
  switch (difficulty) {
    case "beginner":
      return 1;
    case "intermediate":
      return 2;
    case "advanced":
      return 3;
    default:
      return 1;
  }
}

/**
 * Convert an on-chain numeric difficulty to its Sanity string representation.
 * Defaults to "beginner" for unrecognized values.
 */
export function difficultyToString(difficulty: number): string {
  switch (difficulty) {
    case 1:
      return "beginner";
    case 2:
      return "intermediate";
    case 3:
      return "advanced";
    default:
      return "beginner";
  }
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

/**
 * Returns the list of field names required in Sanity before a course can be
 * deployed on-chain. An empty array means the course is ready to deploy.
 */
export function getMissingCourseFields(sanityCourse: AdminCourse): string[] {
  const missing: string[] = [];

  if (sanityCourse.xpPerLesson === null || sanityCourse.xpPerLesson <= 0) {
    missing.push("xpPerLesson");
  }

  if (!sanityCourse.difficulty) {
    missing.push("difficulty");
  }

  if (sanityCourse.lessonCount === 0) {
    missing.push("lessons");
  }

  return missing;
}

/**
 * Returns the list of field names required in Sanity before an achievement can
 * be deployed on-chain. An empty array means the achievement is ready to deploy.
 */
export function getMissingAchievementFields(
  sanityAchievement: AdminAchievement
): string[] {
  const missing: string[] = [];

  if (!sanityAchievement.name || sanityAchievement.name.trim() === "") {
    missing.push("name");
  }

  if (sanityAchievement.xpReward === null || sanityAchievement.xpReward <= 0) {
    missing.push("xpReward");
  }

  return missing;
}

/**
 * Returns true if the given Sanity document _id represents an unpublished draft.
 * Draft documents cannot be deployed on-chain.
 */
export function isDraftId(sanityId: string): boolean {
  return sanityId.startsWith("drafts.");
}

// ---------------------------------------------------------------------------
// Course diff
// ---------------------------------------------------------------------------

/**
 * Compare a Sanity course document against an on-chain Course PDA.
 *
 * Updateable fields (fixable with `updateCourse`):
 *   xpPerLesson, creatorRewardXp, minCompletionsForReward
 *
 * Immutable fields (require PDA recreation if different):
 *   lessonCount, difficulty, trackId, trackLevel, prerequisite
 *
 * Note: `prerequisite` is compared using raw Sanity _id vs on-chain base58
 * pubkey. The caller is responsible for PDA resolution — this function only
 * surfaces the mismatch for display purposes.
 *
 * @param sanityCourse - From getAllCoursesAdmin()
 * @param onChainCourse - Deserialized on-chain account, or null if not deployed
 * @returns SyncDiff describing the current state
 */
export function diffCourse(
  sanityCourse: AdminCourse,
  onChainCourse: OnChainCourse | null
): SyncDiff {
  // 1. Draft check — drafts can never be deployed
  if (isDraftId(sanityCourse._id)) {
    return {
      status: "draft",
      missingFields: [],
      differences: [],
      hasImmutableMismatch: false,
    };
  }

  // 2. Required field check — must pass before on-chain create
  const missingFields = getMissingCourseFields(sanityCourse);
  if (missingFields.length > 0) {
    return {
      status: "missing_fields",
      missingFields,
      differences: [],
      hasImmutableMismatch: false,
    };
  }

  // 3. Not yet deployed
  if (onChainCourse === null) {
    return {
      status: "not_deployed",
      missingFields: [],
      differences: [],
      hasImmutableMismatch: false,
    };
  }

  // 4. Compute field-level differences
  const differences: DiffEntry[] = [];

  // --- Updateable fields ---

  const sanityXpPerLesson = sanityCourse.xpPerLesson ?? 10;
  if (sanityXpPerLesson !== onChainCourse.xpPerLesson) {
    differences.push({
      field: "xpPerLesson",
      sanityValue: sanityXpPerLesson,
      onChainValue: onChainCourse.xpPerLesson,
      updateable: true,
    });
  }

  const sanityCreatorRewardXp = sanityCourse.creatorRewardXp ?? 0;
  if (sanityCreatorRewardXp !== onChainCourse.creatorRewardXp) {
    differences.push({
      field: "creatorRewardXp",
      sanityValue: sanityCreatorRewardXp,
      onChainValue: onChainCourse.creatorRewardXp,
      updateable: true,
    });
  }

  const sanityMinCompletions = sanityCourse.minCompletionsForReward ?? 0;
  if (sanityMinCompletions !== onChainCourse.minCompletionsForReward) {
    differences.push({
      field: "minCompletionsForReward",
      sanityValue: sanityMinCompletions,
      onChainValue: onChainCourse.minCompletionsForReward,
      updateable: true,
    });
  }

  // --- Immutable fields ---

  if (sanityCourse.lessonCount !== onChainCourse.lessonCount) {
    differences.push({
      field: "lessonCount",
      sanityValue: sanityCourse.lessonCount,
      onChainValue: onChainCourse.lessonCount,
      updateable: false,
    });
  }

  const sanityDifficulty = difficultyToNumber(sanityCourse.difficulty);
  if (sanityDifficulty !== onChainCourse.difficulty) {
    differences.push({
      field: "difficulty",
      sanityValue: sanityCourse.difficulty,
      onChainValue: difficultyToString(onChainCourse.difficulty),
      updateable: false,
    });
  }

  const sanityTrackId = sanityCourse.trackId ?? 0;
  if (sanityTrackId !== onChainCourse.trackId) {
    differences.push({
      field: "trackId",
      sanityValue: sanityTrackId,
      onChainValue: onChainCourse.trackId,
      updateable: false,
    });
  }

  const sanityTrackLevel = sanityCourse.trackLevel ?? 0;
  if (sanityTrackLevel !== onChainCourse.trackLevel) {
    differences.push({
      field: "trackLevel",
      sanityValue: sanityTrackLevel,
      onChainValue: onChainCourse.trackLevel,
      updateable: false,
    });
  }

  // prerequisite: compare raw Sanity _id vs on-chain base58 pubkey.
  // PDA resolution is intentionally deferred to the caller — this pure
  // function only surfaces whether the values differ at the string level.
  const sanityPrerequisiteId = sanityCourse.prerequisiteCourse?._id ?? null;
  if (sanityPrerequisiteId !== onChainCourse.prerequisite) {
    differences.push({
      field: "prerequisite",
      sanityValue: sanityPrerequisiteId,
      onChainValue: onChainCourse.prerequisite,
      updateable: false,
    });
  }

  const hasImmutableMismatch = differences.some((d) => !d.updateable);

  return {
    status: differences.length === 0 ? "synced" : "out_of_sync",
    missingFields: [],
    differences,
    hasImmutableMismatch,
  };
}

// ---------------------------------------------------------------------------
// Achievement diff
// ---------------------------------------------------------------------------

/**
 * Compare a Sanity achievement document against an on-chain AchievementType PDA.
 *
 * There is no `updateAchievementType` instruction in the program, so ALL
 * diffed fields are marked `updateable: false`. Any mismatch requires PDA
 * recreation (deregister + re-register).
 *
 * @param sanityAchievement - From getAllAchievementsAdmin()
 * @param onChainAchievement - Deserialized on-chain account, or null if not deployed
 * @returns SyncDiff describing the current state
 */
export function diffAchievement(
  sanityAchievement: AdminAchievement,
  onChainAchievement: OnChainAchievement | null
): SyncDiff {
  // 1. Draft check
  if (isDraftId(sanityAchievement._id)) {
    return {
      status: "draft",
      missingFields: [],
      differences: [],
      hasImmutableMismatch: false,
    };
  }

  // 2. Required field check
  const missingFields = getMissingAchievementFields(sanityAchievement);
  if (missingFields.length > 0) {
    return {
      status: "missing_fields",
      missingFields,
      differences: [],
      hasImmutableMismatch: false,
    };
  }

  // 3. Not yet deployed
  if (onChainAchievement === null) {
    return {
      status: "not_deployed",
      missingFields: [],
      differences: [],
      hasImmutableMismatch: false,
    };
  }

  // 4. Compute field-level differences
  // All fields are immutable — no updateAchievementType instruction exists.
  const differences: DiffEntry[] = [];

  if (sanityAchievement.name !== onChainAchievement.name) {
    differences.push({
      field: "name",
      sanityValue: sanityAchievement.name,
      onChainValue: onChainAchievement.name,
      updateable: false,
    });
  }

  const sanityXpReward = sanityAchievement.xpReward ?? 0;
  if (sanityXpReward !== onChainAchievement.xpReward) {
    differences.push({
      field: "xpReward",
      sanityValue: sanityXpReward,
      onChainValue: onChainAchievement.xpReward,
      updateable: false,
    });
  }

  // maxSupply: 0 = unlimited supply on-chain
  const sanityMaxSupply = sanityAchievement.maxSupply ?? 0;
  if (sanityMaxSupply !== onChainAchievement.maxSupply) {
    differences.push({
      field: "maxSupply",
      sanityValue: sanityMaxSupply,
      onChainValue: onChainAchievement.maxSupply,
      updateable: false,
    });
  }

  const hasImmutableMismatch = differences.some((d) => !d.updateable);

  return {
    status: differences.length === 0 ? "synced" : "out_of_sync",
    missingFields: [],
    differences,
    hasImmutableMismatch,
  };
}
