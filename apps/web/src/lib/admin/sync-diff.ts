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
  totalCompletions: number;
  totalEnrollments: number;
  isActive: boolean;
  version: number;
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
  /** true if any immutable field differs, including legacy track fields */
  hasImmutableMismatch: boolean;
  /**
   * true when legacy track fields are allowed (`allowLegacyTrack`, devnet
   * only) and the only immutable differences are legacy track fields (see
   * {@link isLegacyTrackOnly}). Such a course is not recreate-required: it
   * stays syncable, and with no updateable diffs it reads as synced.
   */
  legacyTrackOnly: boolean;
}

// ---------------------------------------------------------------------------
// Legacy track classification
// ---------------------------------------------------------------------------

const TRACK_FIELDS = new Set(["trackId", "trackLevel"]);

/**
 * A trackId/trackLevel diff where the on-chain value is 0 and the content
 * value is a real track (an integer >= 1): the course was created on-chain
 * before tracks existed. Both fields are create-only, so the content value
 * only takes effect when the course is created on another cluster.
 */
export function isLegacyTrackDiff(d: DiffEntry): boolean {
  return (
    !d.updateable &&
    TRACK_FIELDS.has(d.field) &&
    d.onChainValue === 0 &&
    typeof d.contentValue === "number" &&
    Number.isInteger(d.contentValue) &&
    d.contentValue >= 1
  );
}

/**
 * true when there is at least one immutable diff and every immutable diff is a
 * legacy track diff. Any other immutable diff (creator, difficulty,
 * prerequisite, a lesson-count decrease, a non-zero on-chain track value)
 * returns false and keeps the course recreate-required.
 *
 * Cluster-blind: callers decide whether the rule applies at all (devnet only,
 * see `diffCourse`'s `allowLegacyTrack`). UI code reads the server's
 * `legacyTrackOnly` flag instead of calling this.
 */
export function isLegacyTrackOnly(differences: readonly DiffEntry[]): boolean {
  const immutable = differences.filter((d) => !d.updateable);
  return immutable.length > 0 && immutable.every(isLegacyTrackDiff);
}

/**
 * Immutable diffs that block sync and require a recreate. Pass the course's
 * `legacyTrackOnly` flag as computed on the server.
 */
export function blockingImmutableDiffs(
  differences: readonly DiffEntry[],
  legacyTrackOnly: boolean
): DiffEntry[] {
  if (legacyTrackOnly) return [];
  return differences.filter((d) => !d.updateable);
}

/**
 * Diffs that make a course out of sync: everything except legacy track diffs
 * when `legacyTrackOnly` holds.
 */
export function pendingDifferences(
  differences: readonly DiffEntry[],
  legacyTrackOnly: boolean
): DiffEntry[] {
  if (!legacyTrackOnly) return [...differences];
  return differences.filter((d) => !isLegacyTrackDiff(d));
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
 * `creatorWallet` (issue #400, #478): the on-chain `Course.creator` — the
 * immutable XP-reward recipient — is set from `course.creator` at
 * create_course. A course with no creator wallet, or one that is not even
 * shaped like a pubkey, must never reach the deploy button.
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
 *   xpPerLesson, creatorRewardXp, and an INCREASE in lessonCount (increase-only
 *   via update_course.new_lesson_count)
 *
 * Immutable fields (require PDA recreation if different):
 *   creator (#400 — the XP-reward recipient, set once at create_course),
 *   difficulty, trackId, trackLevel, prerequisite, and a DECREASE in lessonCount
 *
 * Exception, only when `options.allowLegacyTrack` is true (the caller has
 * positively identified devnet): if the only immutable diffs are legacy track
 * fields ({@link isLegacyTrackDiff}), `legacyTrackOnly` is set, the course is
 * not recreate-required, and its status follows the remaining updateable
 * diffs. Omitted or false (the default) keeps every immutable diff blocking,
 * which is what mainnet and an unidentified cluster must get.
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
 * @param options.allowLegacyTrack - Apply the legacy track rule. Devnet only.
 * @returns SyncDiff describing the current state
 */
export function diffCourse(
  course: AdminCourse,
  onChainCourse: OnChainCourse | null,
  resolvedPrerequisitePda?: string | null,
  options: { allowLegacyTrack?: boolean } = {}
): SyncDiff {
  // 1. Draft check — drafts can never be deployed
  if (isDraftId(course._id)) {
    return {
      status: "draft",
      missingFields: [],
      differences: [],
      hasImmutableMismatch: false,
      legacyTrackOnly: false,
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
      legacyTrackOnly: false,
    };
  }

  // 3. Not yet deployed
  if (onChainCourse === null) {
    return {
      status: "not_deployed",
      missingFields: [],
      differences: [],
      hasImmutableMismatch: false,
      legacyTrackOnly: false,
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

  // --- Immutable fields ---

  // creator (#400, #478): the on-chain XP-reward recipient vs course.creator.
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
  const legacyTrackOnly =
    options.allowLegacyTrack === true && isLegacyTrackOnly(differences);

  return {
    status:
      pendingDifferences(differences, legacyTrackOnly).length === 0
        ? "synced"
        : "out_of_sync",
    missingFields: [],
    differences,
    hasImmutableMismatch,
    legacyTrackOnly,
  };
}
