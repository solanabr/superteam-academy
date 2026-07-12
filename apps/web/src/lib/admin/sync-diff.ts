/**
 * Diff engine: compares committed-bundle course data against on-chain PDA state.
 *
 * Used by the admin dashboard and API routes to determine what needs syncing.
 * Pure functions — no side effects, no RPC calls.
 */

import type { AdminAchievement, AdminCourse } from "@/lib/content/queries";

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
  contentValue: unknown;
  onChainValue: unknown;
  /** true = can be fixed with updateCourse/updateAchievement. false = immutable. */
  updateable: boolean;
}

export interface SyncDiff {
  status: SyncStatus;
  /** Fields present in the content bundle but required for on-chain create that are null/undefined */
  missingFields: string[];
  differences: DiffEntry[];
  /** true if any immutable field differs (requires PDA recreation) */
  hasImmutableMismatch: boolean;
}

// ---------------------------------------------------------------------------
// Helper: difficulty string → number
// ---------------------------------------------------------------------------

/**
 * Convert a bundle difficulty string to its on-chain numeric representation.
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
 * Convert an on-chain numeric difficulty to its bundle string representation.
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
 * Shape check for a base58-encoded 32-byte pubkey (Solana address): base58
 * charset, 32-44 chars. Deliberately dependency-free — this module is
 * imported (type-only today, but keep it light) by client components, so no
 * `@solana/web3.js` here. Full parseability, on-curve, and denylist
 * enforcement live at the server seam (`/api/admin/courses/sync` +
 * `admin-signer.ts`, issue #402).
 */
const BASE58_PUBKEY_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

/**
 * Returns the list of field names required in the bundle before a course can be
 * deployed on-chain. An empty array means the course is ready to deploy.
 *
 * `creatorWallet` (issue #400): the on-chain `Course.creator` — the immutable
 * XP-reward recipient — is set from the instructor wallet at create_course. A
 * course with no instructor wallet, or one that is not even shaped like a
 * pubkey, must never reach the deploy button.
 */
export function getMissingCourseFields(course: AdminCourse): string[] {
  const missing: string[] = [];

  if (course.xpPerLesson === null || course.xpPerLesson <= 0) {
    missing.push("xpPerLesson");
  }

  if (!course.difficulty) {
    missing.push("difficulty");
  }

  if (course.lessonCount === 0) {
    missing.push("lessons");
  }

  if (!course.creatorWallet || !BASE58_PUBKEY_RE.test(course.creatorWallet)) {
    missing.push("creatorWallet");
  }

  return missing;
}

/**
 * Returns the list of field names required in the bundle before an achievement can
 * be deployed on-chain. An empty array means the achievement is ready to deploy.
 */
export function getMissingAchievementFields(
  achievement: AdminAchievement
): string[] {
  const missing: string[] = [];

  if (!achievement.name || achievement.name.trim() === "") {
    missing.push("name");
  }

  if (achievement.xpReward === null || achievement.xpReward <= 0) {
    missing.push("xpReward");
  }

  return missing;
}

/**
 * Returns true if the given content document _id represents an unpublished draft.
 * Draft documents cannot be deployed on-chain.
 */
export function isDraftId(id: string): boolean {
  return id.startsWith("drafts.");
}

// ---------------------------------------------------------------------------
// Course diff
// ---------------------------------------------------------------------------

/**
 * Compare a bundle course document against an on-chain Course PDA.
 *
 * Updateable fields (fixable with `updateCourse`):
 *   xpPerLesson, creatorRewardXp, minCompletionsForReward, and an INCREASE in
 *   lessonCount (increase-only via update_course.new_lesson_count)
 *
 * Immutable fields (require PDA recreation if different):
 *   creator (#400 — the XP-reward recipient, set once at create_course),
 *   difficulty, trackId, trackLevel, prerequisite, and a DECREASE in lessonCount
 *
 * Note on `prerequisite`: pass `resolvedPrerequisitePda` (the bundle
 * prerequisite's Course PDA, base58) so the comparison is pubkey-to-pubkey.
 * Without it the raw content _id is compared against the on-chain base58
 * pubkey, which can only surface a string-level mismatch for display — every
 * configured prerequisite would read as different.
 *
 * @param course - From getAllCoursesAdmin()
 * @param onChainCourse - Deserialized on-chain account, or null if not deployed
 * @param resolvedPrerequisitePda - The prerequisite course's PDA (base58) when
 *   the caller has derived it; null/undefined falls back to the raw-id compare
 * @returns SyncDiff describing the current state
 */
export function diffCourse(
  course: AdminCourse,
  onChainCourse: OnChainCourse | null,
  resolvedPrerequisitePda?: string | null
): SyncDiff {
  // 1. Draft check — drafts can never be deployed
  if (isDraftId(course._id)) {
    return {
      status: "draft",
      missingFields: [],
      differences: [],
      hasImmutableMismatch: false,
    };
  }

  // 2. Required field check — must pass before on-chain create
  const missingFields = getMissingCourseFields(course);
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

  const contentXpPerLesson = course.xpPerLesson ?? 10;
  if (contentXpPerLesson !== onChainCourse.xpPerLesson) {
    differences.push({
      field: "xpPerLesson",
      contentValue: contentXpPerLesson,
      onChainValue: onChainCourse.xpPerLesson,
      updateable: true,
    });
  }

  const contentCreatorRewardXp = course.creatorRewardXp ?? 0;
  if (contentCreatorRewardXp !== onChainCourse.creatorRewardXp) {
    differences.push({
      field: "creatorRewardXp",
      contentValue: contentCreatorRewardXp,
      onChainValue: onChainCourse.creatorRewardXp,
      updateable: true,
    });
  }

  const contentMinCompletions = course.minCompletionsForReward ?? 0;
  if (contentMinCompletions !== onChainCourse.minCompletionsForReward) {
    differences.push({
      field: "minCompletionsForReward",
      contentValue: contentMinCompletions,
      onChainValue: onChainCourse.minCompletionsForReward,
      updateable: true,
    });
  }

  // --- Immutable fields ---

  // creator (#400): the on-chain XP-reward recipient vs the instructor wallet.
  // Both sides are base58 (base58 is canonical per byte array, so a string
  // compare is exact). Set once at create_course and never updateable — a
  // mismatch means every future creator reward pays the wrong wallet, so it
  // must read as an immutable (recreate-only) mismatch. A missing/invalid
  // creatorWallet never reaches here (getMissingCourseFields gates first).
  if (course.creatorWallet && course.creatorWallet !== onChainCourse.creator) {
    differences.push({
      field: "creator",
      contentValue: course.creatorWallet,
      onChainValue: onChainCourse.creator,
      updateable: false,
    });
  }

  if (course.lessonCount !== onChainCourse.lessonCount) {
    // lesson_count is increase-only updateable: a re-sync raises the on-chain
    // count when a teacher appends lessons (update_course.new_lesson_count).
    // A DECREASE (the bundle has fewer lessons than on-chain) is rejected by the
    // program (LessonCountDecrease) and stays an immutable mismatch — applying
    // it would strand completion flags, so it needs PDA recreation.
    differences.push({
      field: "lessonCount",
      contentValue: course.lessonCount,
      onChainValue: onChainCourse.lessonCount,
      updateable: course.lessonCount > onChainCourse.lessonCount,
    });
  }

  const contentDifficulty = difficultyToNumber(course.difficulty);
  if (contentDifficulty !== onChainCourse.difficulty) {
    differences.push({
      field: "difficulty",
      contentValue: course.difficulty,
      onChainValue: difficultyToString(onChainCourse.difficulty),
      updateable: false,
    });
  }

  const contentTrackId = course.trackId ?? 0;
  if (contentTrackId !== onChainCourse.trackId) {
    differences.push({
      field: "trackId",
      contentValue: contentTrackId,
      onChainValue: onChainCourse.trackId,
      updateable: false,
    });
  }

  const contentTrackLevel = course.trackLevel ?? 0;
  if (contentTrackLevel !== onChainCourse.trackLevel) {
    differences.push({
      field: "trackLevel",
      contentValue: contentTrackLevel,
      onChainValue: onChainCourse.trackLevel,
      updateable: false,
    });
  }

  // prerequisite: compare the resolved PDA (base58) against the on-chain
  // pubkey when the caller derived it; otherwise fall back to the raw content
  // _id vs base58 string compare (display-only, always differs when set).
  const contentPrerequisiteId = course.prerequisiteCourse?._id ?? null;
  const contentPrerequisite =
    contentPrerequisiteId === null
      ? null
      : (resolvedPrerequisitePda ?? contentPrerequisiteId);
  if (contentPrerequisite !== onChainCourse.prerequisite) {
    differences.push({
      field: "prerequisite",
      contentValue: contentPrerequisite,
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
 * Compare a bundle achievement document against an on-chain AchievementType PDA.
 *
 * There is no `updateAchievementType` instruction in the program, so ALL
 * diffed fields are marked `updateable: false`. Any mismatch requires PDA
 * recreation (deregister + re-register).
 *
 * @param achievement - From getAllAchievementsAdmin()
 * @param onChainAchievement - Deserialized on-chain account, or null if not deployed
 * @returns SyncDiff describing the current state
 */
export function diffAchievement(
  achievement: AdminAchievement,
  onChainAchievement: OnChainAchievement | null
): SyncDiff {
  // 1. Draft check
  if (isDraftId(achievement._id)) {
    return {
      status: "draft",
      missingFields: [],
      differences: [],
      hasImmutableMismatch: false,
    };
  }

  // 2. Required field check
  const missingFields = getMissingAchievementFields(achievement);
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

  if (achievement.name !== onChainAchievement.name) {
    differences.push({
      field: "name",
      contentValue: achievement.name,
      onChainValue: onChainAchievement.name,
      updateable: false,
    });
  }

  const contentXpReward = achievement.xpReward ?? 0;
  if (contentXpReward !== onChainAchievement.xpReward) {
    differences.push({
      field: "xpReward",
      contentValue: contentXpReward,
      onChainValue: onChainAchievement.xpReward,
      updateable: false,
    });
  }

  // maxSupply: 0 = unlimited supply on-chain
  const contentMaxSupply = achievement.maxSupply ?? 0;
  if (contentMaxSupply !== onChainAchievement.maxSupply) {
    differences.push({
      field: "maxSupply",
      contentValue: contentMaxSupply,
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
