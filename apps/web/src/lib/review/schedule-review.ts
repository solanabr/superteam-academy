import "server-only";
import type { ServerTestResult } from "@/lib/challenge/executor";
import type { GradedDenyReason } from "@/lib/grading/deny-reason";
import { createAdminClient } from "@/lib/supabase/admin";
import { logError } from "@/lib/logging";
import { ERROR_IDS } from "@/constants/errorIds";

/**
 * A failed-completion signal worth reviewing (LX-B4). Only a GRADED miss — a
 * wrong quiz or a failed challenge — is a learning signal. Enrollment,
 * attestation, and maintenance denials are NOT: they say nothing about what the
 * learner does or doesn't know, so they never reach here.
 */
export interface ReviewFailureCapture {
  userId: string;
  /**
   * The raw lesson `_id` — the review substrate's `item_key` (PDA-seed
   * convention: never strip/transform ids). One review row per learner per
   * lesson, regardless of which block inside the lesson failed.
   */
  lessonId: string;
  /**
   * Which graded block type missed, from the one exhaustive `DENY_REASONS` map
   * (#703 item 2b) — so a new graded type can never silently fold into
   * `challenge_failed` here. Observability only; the box math never reads it.
   */
  reason: GradedDenyReason;
  /**
   * The failing test cases, when the grader produced per-test detail (code
   * challenges). Carried for observability / future item enrichment; the box
   * math never reads it. Absent for quiz misses and degenerate rust/build rows.
   */
  failedTests?: ServerTestResult[];
}

/**
 * Enqueue a failed lesson's retrieval item into the review substrate (LX-B4).
 *
 * BEST-EFFORT BY CONTRACT: this never throws and never returns a signal the
 * caller must branch on. A capture failure must never change the completion
 * route's deny response — the learner already failed grading; whether the review
 * row was written is orthogonal. Every error is swallowed here (and logged), and
 * the call site adds a second `.catch` so even a contract violation can't leak.
 *
 * Box math lives ONLY in the `schedule_review_item` / `record_review_result`
 * SECURITY DEFINER RPCs (service_role, via the admin client). This helper is a
 * thin, idempotent enqueue: `schedule_review_item` is `ON CONFLICT DO NOTHING`,
 * so re-capturing a lesson never resets a learner's hard-won box progress.
 */
export async function captureReviewFailure(
  capture: ReviewFailureCapture
): Promise<void> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.rpc("schedule_review_item", {
      p_user_id: capture.userId,
      p_item_key: capture.lessonId,
    });
    if (error) throw new Error(error.message);
  } catch (err) {
    logError({
      errorId: ERROR_IDS.LESSON_COMPLETE_FAILED,
      error: err instanceof Error ? err : new Error(String(err)),
      context: {
        route: "/api/lessons/complete",
        step: "review_capture",
        userId: capture.userId,
        lessonId: capture.lessonId,
        reason: capture.reason,
        failedTestIds: capture.failedTests?.map((t) => t.id),
      },
    });
  }
}

/**
 * Enqueue a lesson's retrieval item into the learner's spaced-review queue at
 * box 1, via the SECURITY DEFINER `schedule_review_item` RPC (LX-B3 substrate).
 * `itemKey` is the RAW lesson _id — PDA-seed convention: never strip/transform
 * ids. The RPC is idempotent (ON CONFLICT DO NOTHING), so re-scheduling an item
 * the learner already has never resets their box progress.
 *
 * Best-effort: a scheduling failure is a warn, not a throw — the callers (e.g.
 * the LX-C6 solution reveal) treat review-scheduling as a side effect that must
 * never block the primary action. Returns whether the row is now scheduled.
 *
 * Sibling to `captureReviewFailure` above (LX-B4): both enqueue through the same
 * idempotent RPC, but from different signals — that one from a graded miss on
 * the completion deny path (fire-and-forget, void), this one from a deliberate
 * solution reveal (the route reports the outcome so the UI can be honest about
 * whether the reschedule landed).
 */
export async function scheduleReviewItem(
  userId: string,
  itemKey: string
): Promise<boolean> {
  try {
    const { error } = await createAdminClient().rpc("schedule_review_item", {
      p_user_id: userId,
      p_item_key: itemKey,
    });
    if (error) {
      console.warn("[review] schedule failed:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[review] schedule threw:", err);
    return false;
  }
}
