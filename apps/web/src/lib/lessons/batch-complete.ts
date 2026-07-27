import type { PublicKey } from "@solana/web3.js";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCourseById } from "@/lib/content/queries";
import {
  completeLesson,
  getConnection,
  getProgramId,
} from "@/lib/solana/academy-program";
import { fetchEnrollment, fetchCourse } from "@/lib/solana/academy-reads";
import { isLessonComplete } from "@/lib/solana/bitmap";
import { getLessonSlot } from "@/lib/courses/lesson-slot";
import { logError } from "@/lib/logging";
import { ERROR_IDS } from "@/constants/errorIds";
import { TEST_OUT_MAX_XP } from "@/lib/courses/test-out";

export type BatchCompleteErrorCode =
  | "course_not_found"
  | "enrollment_missing"
  | "xp_unavailable"
  | "xp_cap_exceeded";

/**
 * A precondition failure the caller maps to an HTTP status. Distinct from a
 * transient per-lesson on-chain failure, which is captured in the result's
 * `pending` count (the batch never aborts on one lesson).
 */
export class BatchCompleteError extends Error {
  constructor(
    public readonly code: BatchCompleteErrorCode,
    message: string
  ) {
    super(message);
    this.name = "BatchCompleteError";
  }
}

export interface BatchCompleteResult {
  /** Live lessons considered (min of content order and on-chain lesson count). */
  total: number;
  /** Lessons whose complete_lesson tx landed on THIS call. */
  newlyCompleted: number;
  /** Lessons already set in the on-chain bitmap before this call. */
  alreadyComplete: number;
  /** Lessons whose on-chain submit failed this call (retryable on re-run). */
  pending: number;
}

/**
 * Batch-complete every live lesson of a course server-side, service-role, via
 * the existing per-lesson rails (LX-A5). This is the same primitive the public
 * `/api/lessons/complete` route uses — `completeLesson` accepts any-order
 * completions via the backend signer, so no program change and no new action
 * type is needed. XP is minted by the existing Helius `LessonCompleted` webhook
 * off each on-chain event (source `lesson`), exactly as for a normal completion;
 * the course-completion bonus and (capstone-gated) credential ride the same rail
 * once the final lesson lands. This function never calls `award_xp` itself, so
 * there is no double-credit surface.
 *
 * Because it is invoked internally with the service-role client, it is exempt
 * from the route's per-user volume gate BY CONSTRUCTION (it never traverses that
 * route), not by loosening the gate for anyone.
 *
 * Idempotent and fail-closed: the on-chain bitmap is re-read at entry, so
 * already-complete lessons are skipped and a re-run after a partial failure
 * retries only the lessons that did not land. A single lesson's on-chain failure
 * is isolated (counted in `pending`) and never aborts the rest.
 */
export async function batchCompleteCourse(params: {
  userId: string;
  courseId: string;
  wallet: PublicKey;
}): Promise<BatchCompleteResult> {
  const { userId, courseId, wallet } = params;

  const course = await getCourseById(courseId);
  if (!course) {
    throw new BatchCompleteError(
      "course_not_found",
      `Course not found: ${courseId}`
    );
  }
  const lessons = course.modules.flatMap((m) => m.lessons);

  const connection = getConnection();
  const programId = getProgramId();
  const [enrollment, onChainCourse] = await Promise.all([
    fetchEnrollment(courseId, wallet, connection, programId),
    fetchCourse(courseId, connection, programId),
  ]);

  if (!enrollment) {
    throw new BatchCompleteError(
      "enrollment_missing",
      "On-chain enrollment not found"
    );
  }

  // Every live lesson is a candidate; `total` (the XP-cap basis and result
  // denominator) is the live-lesson count. Whether the program will ACCEPT a
  // given lesson is a per-SLOT decision (`is_active_slot`), tested inside the
  // loop against `activeLessons` — NOT a count truncation. A count bound would,
  // on a sparse mask, attempt the wrong lessons (array positions 0..popcount-1)
  // and skip live high slots such as a capstone at slot 15 (#741).
  const total = lessons.length;
  const activeLessons = onChainCourse?.activeLessons;

  // Spec cap: refuse a course whose retroactive XP would exceed the ceiling
  // rather than driving an absurd batch mint (xpPerLesson × lessonCount ≤ 10000).
  // Fail-CLOSED on an unreadable/zero xp_per_lesson: if the on-chain value is
  // missing or non-positive we refuse rather than let `?? 0` silently zero the
  // product and skip the cap entirely (the on-chain value is authoritative, but
  // the advisory cap must never vanish because a read came back empty).
  const xpPerLesson = onChainCourse?.xp_per_lesson;
  if (typeof xpPerLesson !== "number" || xpPerLesson <= 0) {
    throw new BatchCompleteError(
      "xp_unavailable",
      "Course XP-per-lesson is unavailable; refusing test-out batch"
    );
  }
  if (xpPerLesson * total > TEST_OUT_MAX_XP) {
    throw new BatchCompleteError(
      "xp_cap_exceeded",
      `Test-out XP ${xpPerLesson * total} exceeds cap ${TEST_OUT_MAX_XP}`
    );
  }

  const flags = enrollment.lesson_flags as (bigint | number)[];
  const admin = createAdminClient();

  let newlyCompleted = 0;
  let alreadyComplete = 0;
  let pending = 0;

  // Sequential: the backend keypair is payer on every tx, and serialising keeps
  // the recent-blockhash / nonce path simple and the RPC load bounded.
  for (const lesson of lessons) {
    if (!lesson) continue;

    // Resolve the permanent on-chain SLOT — never array position (#741).
    // Fail-CLOSED per lesson: an unslotted lesson is isolated into `pending`
    // with a logged reason and the batch continues; it never falls back to an
    // index, which would complete the wrong bit.
    let slot: number;
    try {
      slot = getLessonSlot(courseId, lesson._id);
    } catch (err: unknown) {
      pending++;
      logError({
        errorId: ERROR_IDS.TEST_OUT_FAILED,
        error: err instanceof Error ? err : new Error(String(err)),
        context: {
          step: "resolve_slot",
          userId,
          courseId,
          lessonId: lesson._id,
        },
      });
      continue;
    }

    // Skip slots the program has not activated — `complete_lesson` reverts on
    // `is_active_slot`, so attempting would only burn a reverted-tx fee. Per-SLOT
    // bit test against the mask (the slot-space replacement for the old count
    // bound). Counted as `pending`: a re-run after the admin mask re-sync lands
    // it.
    if (activeLessons) {
      const word = Math.floor(slot / 64);
      const bit = BigInt(slot % 64);
      const slotLive = ((activeLessons[word] ?? 0n) & (1n << bit)) !== 0n;
      if (!slotLive) {
        pending++;
        logError({
          errorId: ERROR_IDS.TEST_OUT_FAILED,
          error: new Error(`slot ${slot} not live on-chain (re-sync pending)`),
          context: {
            step: "slot_not_live",
            userId,
            courseId,
            lessonId: lesson._id,
          },
        });
        continue;
      }
    }

    if (isLessonComplete(flags, slot)) {
      alreadyComplete++;
      continue;
    }

    try {
      const signature = await completeLesson(courseId, wallet, slot);
      const { error } = await admin.from("user_progress").upsert(
        {
          user_id: userId,
          course_id: courseId,
          lesson_id: lesson._id,
          completed: true,
          completed_at: new Date().toISOString(),
          tx_signature: signature,
          lesson_index: slot,
        },
        { onConflict: "user_id,lesson_id" }
      );
      if (error) {
        // The on-chain bit is set and the webhook will re-upsert this row and
        // award XP; a failed local mirror-write is non-fatal, so log and count
        // the lesson as completed rather than pending.
        logError({
          errorId: ERROR_IDS.TEST_OUT_FAILED,
          error: new Error(error.message),
          context: {
            step: "progress_upsert",
            userId,
            courseId,
            lessonId: lesson._id,
          },
        });
      }
      newlyCompleted++;
    } catch (err: unknown) {
      // Isolate the failure: the learner passed, so partial progress is real and
      // must persist. Re-running the test-out (idempotent via the bitmap re-read)
      // retries only the lessons still unset.
      pending++;
      logError({
        errorId: ERROR_IDS.TEST_OUT_FAILED,
        error: err instanceof Error ? err : new Error(String(err)),
        context: {
          step: "complete_lesson",
          userId,
          courseId,
          lessonId: lesson._id,
          lessonIndex: slot,
        },
      });
    }
  }

  return { total, newlyCompleted, alreadyComplete, pending };
}
