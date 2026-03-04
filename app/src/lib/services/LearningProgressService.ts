import { useProgressStore } from "@/stores/progress-store";
import { useActivityStore } from "@/stores/activity-store";
import { trackLessonComplete } from "@/lib/analytics/events";
import { checkAndTriggerAchievements } from "@/lib/services/AchievementTriggerService";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SignMessageFn = (message: Uint8Array) => Promise<Uint8Array>;

export interface CompleteLessonParams {
  learner: string;
  courseId: string;
  courseTitle?: string;
  lessonIndex: number;
  lessonTitle?: string;
  xpEarned?: number;
  signMessage: SignMessageFn;
  /** Achievement trigger context — provide for auto-achievement detection */
  achievementCtx?: {
    unlockedBitmap: bigint;
    isFirstLesson: boolean;
    totalLessonsCompleted: number;
    onUnlocked?: (achievementId: string, xpReward: number) => void;
  };
}

export interface FinalizeCourseParams {
  learner: string;
  courseId: string;
  courseTitle?: string;
  xpPerCourseCompletion?: number;
  signMessage: SignMessageFn;
  /** Achievement trigger context — provide for auto-achievement detection */
  achievementCtx?: {
    unlockedBitmap: bigint;
    trackId?: string;
    enrollmentTimestamp?: number;
    lastLessonTimestamp?: number;
    totalCoursesCompleted?: number;
    completedTrackIds?: string[];
    onUnlocked?: (achievementId: string, xpReward: number) => void;
  };
}

export interface ProgressResult {
  signature: string;
}

export interface CourseProgress {
  courseId: string;
  completedLessons: number[];
  totalCompleted: number;
  percentComplete: number;
}

export interface StreakData {
  currentStreak: number;
  lastActivityDate: string | null;
  milestoneReached: 7 | 30 | 100 | null;
}

export interface LearnerProgress {
  xp: number;
  level: number;
  levelProgress: number; // 0-100 percentage toward next level
  streakData: StreakData;
  courses: CourseProgress[];
}

export interface LeaderboardEntry {
  owner: string;
  amount: number;
  level: number;
}

export interface CredentialInfo {
  id: string;
  name: string;
  attributes: Record<string, string>[];
}

/**
 * Service interface for learning progress tracking.
 * Current implementation uses localStorage + API routes.
 * Swap this implementation to connect directly to on-chain program.
 *
 * walletAddress is optional on read methods — when undefined, reads from the
 * local optimistic store (current behaviour). When provided, future
 * implementations can read from on-chain Enrollment PDA / Token-2022 ATA.
 */
export interface ILearningProgressService {
  getCourseProgress(courseId: string, totalLessons: number, walletAddress?: string): CourseProgress;
  completeLessonWithProgress(params: CompleteLessonParams): Promise<ProgressResult>;
  getXpBalance(walletAddress?: string): number;
  getStreakData(walletAddress?: string): StreakData;
  getLearnerProgress(walletAddress?: string): LearnerProgress;
  fetchLeaderboard(timeframe?: "weekly" | "monthly" | "allTime"): Promise<LeaderboardEntry[]>;
  fetchCredentials(walletAddress: string, collectionAddress?: string): Promise<CredentialInfo[]>;
}

// Streak milestones per bounty spec
const STREAK_MILESTONES = [7, 30, 100] as const;

// XP reward ranges per bounty spec
export const XP_RANGES = {
  lesson: { min: 10, max: 50 },
  challenge: { min: 25, max: 100 },
  course: { min: 500, max: 2000 },
} as const;

// XP bonus values per bounty spec
export const XP_BONUSES = {
  dailyStreak: 10,
  firstCompletionOfDay: 25,
} as const;

async function postProgress<T>(endpoint: string, body: object): Promise<T> {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as Record<string, string>).error ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

async function signAndEncode(
  signMessage: SignMessageFn,
  message: string
): Promise<string> {
  const messageBytes = new TextEncoder().encode(message);
  const signatureBytes = await signMessage(messageBytes);
  // Convert to base64 using btoa (works in browser)
  return btoa(Array.from(signatureBytes, b => String.fromCharCode(b)).join(""));
}

export async function completeLessonWithProgress(
  params: CompleteLessonParams
): Promise<ProgressResult> {
  const { learner, courseId, courseTitle, lessonIndex, lessonTitle, xpEarned = 0, signMessage, achievementCtx } = params;

  // Sign with timestamp for replay protection
  const timestamp = Date.now();
  const signature = await signAndEncode(
    signMessage,
    `superteam-academy:${courseId}:${lessonIndex}:${timestamp}`
  );

  // Optimistic update before on-chain confirmation
  const { markLessonComplete, revertLessonComplete } = useProgressStore.getState();
  const { addActivity, removeActivityById } = useActivityStore.getState();

  markLessonComplete(courseId, lessonIndex, xpEarned);
  const addedActivity = addActivity({
    type: "lesson_completed",
    courseId,
    courseTitle,
    lessonTitle,
    xpEarned,
  });

  try {
    const result = await postProgress<ProgressResult>(
      "/api/progress/complete-lesson",
      { learner, courseId, lessonIndex, signature, timestamp }
    );
    trackLessonComplete(courseId, lessonIndex);

    // Fire achievement checks asynchronously — never awaited to avoid blocking
    if (achievementCtx) {
      void checkAndTriggerAchievements("lesson_complete", {
        wallet: learner,
        unlockedBitmap: achievementCtx.unlockedBitmap,
        courseId,
        isFirstLesson: achievementCtx.isFirstLesson,
        totalLessonsCompleted: achievementCtx.totalLessonsCompleted,
        onUnlocked: achievementCtx.onUnlocked,
      });
    }

    return result;
  } catch (error) {
    // Rollback optimistic updates on failure
    revertLessonComplete(courseId, lessonIndex, xpEarned);
    removeActivityById(addedActivity.id);
    throw error;
  }
}

export async function finalizeCourseWithProgress(
  params: FinalizeCourseParams
): Promise<ProgressResult> {
  const { learner, courseId, courseTitle, xpPerCourseCompletion, signMessage, achievementCtx } = params;

  // Sign with timestamp for replay protection
  const timestamp = Date.now();
  const signature = await signAndEncode(
    signMessage,
    `superteam-academy:finalize:${courseId}:${timestamp}`
  );

  const { addActivity, removeActivityById } = useActivityStore.getState();

  // Optimistic activity — added before confirmation so UI feels instant
  const addedActivity = addActivity({
    type: "course_completed",
    courseId,
    courseTitle,
  });

  try {
    const result = await postProgress<ProgressResult>(
      "/api/progress/finalize-course",
      { learner, courseId, signature, timestamp }
    );

    // Award course completion bonus XP (default 500 per bounty spec if not configured)
    const completionXp = xpPerCourseCompletion ?? XP_RANGES.course.min;
    const { addBonusXp } = useProgressStore.getState();
    addBonusXp(completionXp, `course_completed:${courseId}`);

    // Track analytics
    try {
      const { trackCourseComplete } = await import("@/lib/analytics/events");
      trackCourseComplete(courseId);
    } catch { /* analytics should never break core flow */ }

    // Fire achievement checks asynchronously — never awaited to avoid blocking
    if (achievementCtx) {
      void checkAndTriggerAchievements("course_complete", {
        wallet: learner,
        unlockedBitmap: achievementCtx.unlockedBitmap,
        courseId,
        trackId: achievementCtx.trackId,
        enrollmentTimestamp: achievementCtx.enrollmentTimestamp,
        lastLessonTimestamp: achievementCtx.lastLessonTimestamp,
        totalCoursesCompleted: achievementCtx.totalCoursesCompleted,
        completedTrackIds: achievementCtx.completedTrackIds,
        onUnlocked: achievementCtx.onUnlocked,
      });
    }

    return result;
  } catch (error) {
    // Rollback optimistic activity on failure
    removeActivityById(addedActivity.id);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Progress Retrieval — reads from local optimistic store + on-chain
// ---------------------------------------------------------------------------

/** Get level from XP: floor(sqrt(xp / 100)) */
export function getLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100));
}

/** Percentage progress toward next level (0-100) */
export function getLevelProgress(xp: number): number {
  const currentLevel = getLevel(xp);
  const xpForCurrentLevel = currentLevel * currentLevel * 100;
  const xpForNextLevel = (currentLevel + 1) * (currentLevel + 1) * 100;
  const range = xpForNextLevel - xpForCurrentLevel;
  if (range === 0) return 0;
  return Math.round(((xp - xpForCurrentLevel) / range) * 100);
}

/** Get progress for a specific course */
export function getCourseProgress(
  courseId: string,
  totalLessons: number,
  // TODO: When walletAddress is provided, read from on-chain Enrollment PDA / Token-2022 ATA
  _walletAddress?: string
): CourseProgress {
  const state = useProgressStore.getState();
  const completedSet = state.completedLessons[courseId] ?? new Set<number>();
  const completedArray = [...completedSet].sort((a, b) => a - b);
  return {
    courseId,
    completedLessons: completedArray,
    totalCompleted: completedArray.length,
    percentComplete: totalLessons > 0 ? Math.round((completedArray.length / totalLessons) * 100) : 0,
  };
}

/** Get current XP balance from local store */
export function getXpBalance(
  // TODO: When walletAddress is provided, read from on-chain Enrollment PDA / Token-2022 ATA
  _walletAddress?: string
): number {
  return useProgressStore.getState().xp;
}

/** Get streak data with milestone detection */
export function getStreakData(
  // TODO: When walletAddress is provided, read from on-chain Enrollment PDA / Token-2022 ATA
  _walletAddress?: string
): StreakData {
  const { streakDays, lastActivityDate } = useProgressStore.getState();
  const milestoneReached = [...STREAK_MILESTONES].reverse().find(m => streakDays >= m) ?? null;
  return {
    currentStreak: streakDays,
    lastActivityDate,
    milestoneReached: milestoneReached as StreakData["milestoneReached"],
  };
}

/** Check if a streak milestone (7/30/100 days) has been reached */
export function isStreakMilestone(days: number): boolean {
  return STREAK_MILESTONES.includes(days as typeof STREAK_MILESTONES[number]);
}

/** Get full learner progress snapshot */
export function getLearnerProgress(
  // TODO: When walletAddress is provided, read from on-chain Enrollment PDA / Token-2022 ATA
  _walletAddress?: string
): LearnerProgress {
  const state = useProgressStore.getState();
  const xp = state.xp;
  const courses: CourseProgress[] = Object.entries(state.completedLessons).map(
    ([courseId, lessonSet]) => ({
      courseId,
      completedLessons: [...lessonSet].sort((a, b) => a - b),
      totalCompleted: lessonSet.size,
      percentComplete: 0, // Needs totalLessons context — caller should enrich
    })
  );

  return {
    xp,
    level: getLevel(xp),
    levelProgress: getLevelProgress(xp),
    streakData: getStreakData(),
    courses,
  };
}

/** Fetch XP leaderboard via API route (server-proxied Helius DAS) */
export async function fetchLeaderboard(
  timeframe: "weekly" | "monthly" | "allTime" = "allTime"
): Promise<LeaderboardEntry[]> {
  try {
    const res = await fetch(`/api/helius/leaderboard?timeframe=${timeframe}`);
    if (!res.ok) return [];
    const data = await res.json() as { owner: string; amount: number }[];
    return data.map((h) => ({
      ...h,
      level: getLevel(h.amount),
    }));
  } catch {
    return [];
  }
}

export interface ClaimAchievementParams {
  achievementId: string;
  learner: string;
  signMessage: SignMessageFn;
}

export interface IssueCredentialParams {
  courseId: string;
  learner: string;
  trackCollection: string;
  credentialName: string;
  metadataUri: string;
  coursesCompleted: number;
  totalXp: number;
  signMessage: SignMessageFn;
}

/** Claim an achievement on-chain via the backend signer. */
export async function claimAchievement(
  params: ClaimAchievementParams
): Promise<{ success: boolean; signature?: string; error?: string }> {
  const { achievementId, learner, signMessage } = params;
  const timestamp = Date.now();
  const message = new TextEncoder().encode(
    `superteam-academy:achievement:${achievementId}:${timestamp}`
  );
  const signatureBytes = await signMessage(message);
  const signature = Buffer.from(signatureBytes).toString("base64");

  const res = await fetch("/api/progress/claim-achievement", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ achievementId, learner, signature, timestamp }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    return { success: false, error: text };
  }
  const data = await res.json() as { success: boolean; signature?: string };
  return data;
}

/** Issue a credential NFT for a finalized course on-chain via the backend signer. */
export async function issueCredential(
  params: IssueCredentialParams
): Promise<{ success: boolean; signature?: string; credentialAsset?: string; error?: string }> {
  const {
    courseId, learner, trackCollection, credentialName, metadataUri,
    coursesCompleted, totalXp, signMessage,
  } = params;
  const timestamp = Date.now();
  const message = new TextEncoder().encode(
    `superteam-academy:issue-credential:${courseId}:${timestamp}`
  );
  const signatureBytes = await signMessage(message);
  const signature = Buffer.from(signatureBytes).toString("base64");

  const res = await fetch("/api/progress/issue-credential", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      courseId,
      learner,
      trackCollection,
      credentialName,
      metadataUri,
      coursesCompleted,
      totalXp,
      signature,
      timestamp,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    return { success: false, error: text };
  }
  const data = await res.json() as { success: boolean; signature?: string; credentialAsset?: string; error?: string };
  return data;
}

/** Fetch credentials/NFTs for a wallet via API route (server-proxied Helius DAS) */
export async function fetchCredentials(
  walletAddress: string,
  // TODO: When collectionAddress is provided, pass to backend to filter by Metaplex Core collection
  _collectionAddress?: string
): Promise<{ id: string; name: string; attributes: Record<string, string>[] }[]> {
  const res = await fetch("/api/helius/credentials", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ owner: walletAddress }),
  });
  if (!res.ok) return [];
  const data = await res.json() as { id: string; content: { metadata: { name: string; attributes?: { trait_type: string; value: string }[] } } }[];
  return data.map((a) => ({
    id: a.id,
    name: a.content.metadata.name,
    attributes: (a.content.metadata.attributes ?? []).map((attr) => ({
      [attr.trait_type]: attr.value,
    })),
  }));
}
