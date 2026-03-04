/**
 * AchievementTriggerService
 *
 * Checks achievement conditions and calls the claim API when conditions are met.
 * All functions are DEFENSIVE — errors are silently caught so achievement checking
 * never blocks the main user flow.
 *
 * NOTE: `bug_hunter` (index 13) is manual-award only. No auto-trigger exists for it.
 */

import { ACHIEVEMENT_DEFINITIONS, isAchievementUnlocked } from "@/lib/gamification/achievements";
import logger from "@/lib/logger";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AchievementEvent =
  | "lesson_complete"
  | "course_complete"
  | "streak_update"
  | "challenge_complete"
  | "review_submit";

export interface AchievementContext {
  wallet: string;
  /** Bitmap of already-unlocked achievements (from useAchievements hook). Prevents duplicate claims. */
  unlockedBitmap: bigint;
  /** Wallet signMessage function for signing claim requests */
  signMessage?: (message: Uint8Array) => Promise<Uint8Array>;
  /** courseId involved in the event */
  courseId?: string;
  /** trackId of the course (from on-chain CourseAccount.trackId or Sanity track metadata) */
  trackId?: string;
  /** streak day count after the current activity */
  streakDays?: number;
  /** total lessons completed across ALL courses */
  totalLessonsCompleted?: number;
  /** total courses completed */
  totalCoursesCompleted?: number;
  /** unique track IDs completed (for full_stack_solana) */
  completedTrackIds?: string[];
  /** enrollment timestamp (unix seconds) for speed_runner check */
  enrollmentTimestamp?: number;
  /** timestamp of the last lesson completion (unix seconds) for speed_runner check */
  lastLessonTimestamp?: number;
  /** whether this is the user's very first lesson ever */
  isFirstLesson?: boolean;
  /** whether this challenge was passed on the very first attempt */
  isFirstAttempt?: boolean;
  /** whether this is the user's first course review */
  isFirstReview?: boolean;
  /** callback to trigger after unlock — used by hook to show toast/notification */
  onUnlocked?: (achievementId: string, xpReward: number) => void;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const EARLY_ADOPTER_CUTOFF_DATE = new Date("2026-06-01T00:00:00Z");

function alreadyUnlocked(bitmap: bigint, achievementId: string): boolean {
  const def = ACHIEVEMENT_DEFINITIONS.find((d) => d.id === achievementId);
  if (!def) return true; // unknown achievement — skip
  return isAchievementUnlocked(bitmap, def.bitmapIndex);
}

async function callClaimApi(
  achievementId: string,
  wallet: string,
  signMessage?: (message: Uint8Array) => Promise<Uint8Array>
): Promise<boolean> {
  try {
    if (!signMessage) {
      logger.warn(`[AchievementTrigger] No signMessage available for ${achievementId}, skipping`);
      return false;
    }

    const timestamp = Date.now();
    const messageParts = `superteam-academy:achievement:${achievementId}:${timestamp}`;
    const messageBytes = new TextEncoder().encode(messageParts);
    const signatureBytes = await signMessage(messageBytes);
    const signature = btoa(Array.from(signatureBytes, b => String.fromCharCode(b)).join(""));

    const res = await fetch("/api/progress/claim-achievement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ achievementId, learner: wallet, signature, timestamp }),
    });

    if (res.status === 429) {
      logger.warn(`[AchievementTrigger] Rate limited for ${achievementId}`);
      return false;
    }

    if (res.status === 501) {
      // Stub — on-chain not yet connected. Still treat as "pending" so UI can show toast.
      // When the API is live this will return 200.
      const data = (await res.json()) as { stub?: boolean };
      return data.stub === true;
    }

    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as Record<string, string>;
      logger.warn(`[AchievementTrigger] Claim failed for ${achievementId}: ${data.error ?? res.status}`);
      return false;
    }

    return true;
  } catch (err) {
    logger.error(`[AchievementTrigger] Network error claiming ${achievementId}:`, err);
    return false;
  }
}

async function tryTrigger(
  achievementId: string,
  context: AchievementContext
): Promise<void> {
  if (alreadyUnlocked(context.unlockedBitmap, achievementId)) return;

  const success = await callClaimApi(achievementId, context.wallet, context.signMessage);

  if (success && context.onUnlocked) {
    const def = ACHIEVEMENT_DEFINITIONS.find((d) => d.id === achievementId);
    if (def) {
      context.onUnlocked(achievementId, def.xpReward);
    }
  }
}

// ---------------------------------------------------------------------------
// Condition checkers per event
// ---------------------------------------------------------------------------

async function handleLessonComplete(ctx: AchievementContext): Promise<void> {
  const promises: Promise<void>[] = [];

  // first_steps (index 0): user's very first lesson ever
  if (ctx.isFirstLesson) {
    promises.push(tryTrigger("first_steps", ctx));
  }

  // top_contributor (index 11): 10+ total lessons completed
  if ((ctx.totalLessonsCompleted ?? 0) >= 10) {
    promises.push(tryTrigger("top_contributor", ctx));
  }

  await Promise.allSettled(promises);
}

async function handleCourseComplete(ctx: AchievementContext): Promise<void> {
  const promises: Promise<void>[] = [];

  // course_completer (index 1): first course ever finalized
  promises.push(tryTrigger("course_completer", ctx));

  // speed_runner (index 2): all lessons in a course completed within 24h of enrollment
  if (
    ctx.enrollmentTimestamp !== undefined &&
    ctx.lastLessonTimestamp !== undefined
  ) {
    const elapsedSeconds = ctx.lastLessonTimestamp - ctx.enrollmentTimestamp;
    const twentyFourHoursInSeconds = 24 * 60 * 60;
    if (elapsedSeconds <= twentyFourHoursInSeconds) {
      promises.push(tryTrigger("speed_runner", ctx));
    }
  }

  // rust_rookie (index 6): completed a course whose trackId contains "rust"
  if (ctx.trackId && ctx.trackId.toLowerCase().includes("rust")) {
    promises.push(tryTrigger("rust_rookie", ctx));
  }

  // anchor_expert (index 7): completed a course whose trackId contains "anchor"
  if (ctx.trackId && ctx.trackId.toLowerCase().includes("anchor")) {
    promises.push(tryTrigger("anchor_expert", ctx));
  }

  // full_stack_solana (index 8): 3+ courses completed across different tracks
  if ((ctx.completedTrackIds?.length ?? 0) >= 3) {
    promises.push(tryTrigger("full_stack_solana", ctx));
  }

  // early_adopter (index 12): enrolled before cutoff date
  if (
    ctx.enrollmentTimestamp !== undefined &&
    new Date(ctx.enrollmentTimestamp * 1000) < EARLY_ADOPTER_CUTOFF_DATE
  ) {
    promises.push(tryTrigger("early_adopter", ctx));
  }

  await Promise.allSettled(promises);
}

async function handleStreakUpdate(ctx: AchievementContext): Promise<void> {
  const days = ctx.streakDays ?? 0;
  const promises: Promise<void>[] = [];

  // week_warrior (index 3): streak >= 7 days
  if (days >= 7) {
    promises.push(tryTrigger("week_warrior", ctx));
  }

  // monthly_master (index 4): streak >= 30 days
  if (days >= 30) {
    promises.push(tryTrigger("monthly_master", ctx));
  }

  // consistency_king (index 5): streak >= 100 days
  if (days >= 100) {
    promises.push(tryTrigger("consistency_king", ctx));
  }

  await Promise.allSettled(promises);
}

async function handleChallengeComplete(ctx: AchievementContext): Promise<void> {
  // perfect_score (index 14): passed on first attempt
  if (ctx.isFirstAttempt) {
    await tryTrigger("perfect_score", ctx);
  }
}

async function handleReviewSubmit(ctx: AchievementContext): Promise<void> {
  const promises: Promise<void>[] = [];

  // first_comment (index 10): first review ever submitted
  if (ctx.isFirstReview) {
    promises.push(tryTrigger("first_comment", ctx));
  }

  // helper (index 9): track via localStorage share count (separate util, see getShareCount)
  // Share-based trigger is handled separately in triggerHelperIfEligible().

  await Promise.allSettled(promises);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Central dispatcher. Call this after any user action to check and trigger
 * relevant achievements. NEVER throws — all errors are caught internally.
 */
export async function checkAndTriggerAchievements(
  event: AchievementEvent,
  context: AchievementContext
): Promise<void> {
  try {
    switch (event) {
      case "lesson_complete":
        await handleLessonComplete(context);
        break;
      case "course_complete":
        await handleCourseComplete(context);
        break;
      case "streak_update":
        await handleStreakUpdate(context);
        break;
      case "challenge_complete":
        await handleChallengeComplete(context);
        break;
      case "review_submit":
        await handleReviewSubmit(context);
        break;
    }
  } catch (err) {
    logger.error("[AchievementTrigger] Unexpected error in checkAndTriggerAchievements:", err);
  }
}

// ---------------------------------------------------------------------------
// Helper: helper achievement via localStorage share tracking
// ---------------------------------------------------------------------------

const SHARE_COUNT_KEY = "superteam-course-shares";
const HELPER_THRESHOLD = 3;

/** Record a course share click and return the new total count. */
export function recordCourseShare(): number {
  try {
    const raw = localStorage.getItem(SHARE_COUNT_KEY);
    const count = raw ? (parseInt(raw, 10) || 0) : 0;
    const next = count + 1;
    localStorage.setItem(SHARE_COUNT_KEY, String(next));
    return next;
  } catch {
    return 0;
  }
}

/** Get current course share count from localStorage. */
export function getCourseShareCount(): number {
  try {
    const raw = localStorage.getItem(SHARE_COUNT_KEY);
    return raw ? (parseInt(raw, 10) || 0) : 0;
  } catch {
    return 0;
  }
}

/**
 * Call after recordCourseShare() to check if helper achievement should trigger.
 * Context must include wallet and unlockedBitmap.
 */
export async function triggerHelperIfEligible(
  context: Pick<AchievementContext, "wallet" | "unlockedBitmap" | "signMessage" | "onUnlocked">
): Promise<void> {
  try {
    const shareCount = getCourseShareCount();
    if (shareCount >= HELPER_THRESHOLD) {
      await tryTrigger("helper", {
        ...context,
        unlockedBitmap: context.unlockedBitmap,
      });
    }
  } catch (err) {
    logger.error("[AchievementTrigger] Error in triggerHelperIfEligible:", err);
  }
}

// ---------------------------------------------------------------------------
// Helper: review tracking via localStorage
// ---------------------------------------------------------------------------

const REVIEW_SUBMITTED_KEY = "superteam-first-review-submitted";

/** Returns true if this is the user's first review, and marks it in localStorage. */
export function checkAndMarkFirstReview(): boolean {
  try {
    if (localStorage.getItem(REVIEW_SUBMITTED_KEY)) return false;
    localStorage.setItem(REVIEW_SUBMITTED_KEY, "1");
    return true;
  } catch {
    return false;
  }
}
