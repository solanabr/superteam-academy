import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCourseById, getChallengeAnswerKeyById } from "@/lib/sanity/queries";
import {
  validateAgainstAnswerKey,
  MAX_SUBMISSION_BYTES,
} from "@/lib/challenge/validate";
import { logError } from "@/lib/logging";
import { ERROR_IDS } from "@/constants/errorIds";
import {
  isOnChainProgramLive,
  completeLesson as onChainCompleteLesson,
  getConnection,
  getProgramId,
} from "@/lib/solana/academy-program";
import { fetchEnrollment, fetchCourse } from "@/lib/solana/academy-reads";
import { isLessonComplete } from "@/lib/solana/bitmap";
import { findLessonIndex } from "@/lib/courses/lesson-index";

interface LessonCompleteRequest {
  lessonId: string;
  courseId: string;
  /** Required for challenge lessons: the learner's code, validated server-side. */
  submittedCode?: string;
}

/**
 * Derive the 0-based lesson index within a course from Sanity content order.
 * Modules and lessons are flattened in order; the index matches the on-chain bitmap position.
 */
async function deriveLessonIndex(
  courseId: string,
  lessonId: string
): Promise<number> {
  const course = await getCourseById(courseId);
  if (!course) throw new Error(`Course not found: ${courseId}`);
  const index = findLessonIndex(course, lessonId);
  if (index === -1) throw new Error(`Lesson not found in course: ${lessonId}`);
  return index;
}

/**
 * Mark a lesson as complete on-chain. user_progress is written directly here
 * for immediate dashboard visibility. XP, achievements, and credentials are
 * handled by the Helius webhook handler.
 */
export async function POST(request: NextRequest) {
  try {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as LessonCompleteRequest;
    const { lessonId, courseId, submittedCode } = body;

    if (!lessonId || !courseId) {
      return NextResponse.json(
        { error: "Missing lessonId or courseId" },
        { status: 400 }
      );
    }

    if (
      typeof lessonId !== "string" ||
      lessonId.length > 100 ||
      typeof courseId !== "string" ||
      courseId.length > 100
    ) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    // ── Server-authoritative challenge gate ───────────────────────────────
    // For challenge lessons the SERVER must independently verify the
    // submission passes ALL tests (visible + hidden) before any on-chain
    // completion is recorded. A forged client "passed" is rejected here. This
    // re-runs the same validation as /api/lessons/validate-challenge so the
    // completion path never trusts the client. Non-challenge lessons are
    // unaffected (answerKey is null -> gate is skipped).
    const answerKey = await getChallengeAnswerKeyById(courseId, lessonId);
    if (answerKey && answerKey.type === "challenge") {
      if (
        typeof submittedCode !== "string" ||
        submittedCode.length === 0 ||
        Buffer.byteLength(submittedCode, "utf8") > MAX_SUBMISSION_BYTES
      ) {
        return NextResponse.json(
          { error: "Challenge submission required" },
          { status: 400 }
        );
      }

      const verdict = await validateAgainstAnswerKey(answerKey, submittedCode);

      switch (verdict.kind) {
        case "validated":
          if (!verdict.passed) {
            return NextResponse.json(
              { error: "Challenge tests did not pass" },
              { status: 403 }
            );
          }
          break;
        case "executor_unavailable":
          // Degrade closed: never grant completion we could not verify. Also the
          // buildable path when the build server is unreachable OR not configured
          // (prod, pre-#193) — a buildable submission stays un-gradeable and is
          // denied here, exactly as before this grader existed.
          return NextResponse.json(
            { error: "Challenge validation is temporarily unavailable" },
            { status: 503 }
          );
        case "non_js_challenge":
          // FAIL CLOSED. Unreachable for the known challenge types now that JS
          // (isolate), plain Rust (Playground), and buildable (build server) all
          // resolve to `validated`/`executor_unavailable`. Retained so any future
          // unrecognised type is denied rather than granted an unverified
          // completion (and credential eligibility) via a bare fall-through.
          return NextResponse.json(
            {
              error:
                "Server-side validation for this challenge type is not yet available",
            },
            { status: 503 }
          );
        case "not_a_challenge":
          break;
      }
    }

    // Look up user's wallet — required for on-chain operations
    const supabaseAdmin = createAdminClient();
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("wallet_address")
      .eq("id", user.id)
      .single();

    if (!profile?.wallet_address) {
      return NextResponse.json(
        {
          error: "Wallet not connected. Link your wallet to earn on-chain XP.",
        },
        { status: 400 }
      );
    }

    const programLive = await isOnChainProgramLive();
    if (!programLive) {
      return NextResponse.json(
        { error: "On-chain program not available" },
        { status: 503 }
      );
    }

    const walletPubkey = new PublicKey(profile.wallet_address);
    const connection = getConnection();

    // Verify on-chain enrollment exists. The course fetch (for the lesson-count
    // guard below) is independent, so run both RPC reads in parallel.
    const [onChainEnrollment, onChainCourse] = await Promise.all([
      fetchEnrollment(courseId, walletPubkey, connection, getProgramId()),
      fetchCourse(courseId, connection, getProgramId()),
    ]);

    if (!onChainEnrollment) {
      return NextResponse.json(
        {
          error: "On-chain enrollment not found. Please re-enroll the course.",
        },
        { status: 403 }
      );
    }

    // Derive lesson index from Sanity content order
    const lessonIndex = await deriveLessonIndex(courseId, lessonId);

    // Guard: the on-chain complete_lesson reverts when lessonIndex >=
    // course.lesson_count. That happens when a teacher appended lessons to an
    // already-deployed course but the Course PDA's lesson_count has not yet been
    // raised by an admin re-sync (update_course.new_lesson_count). Detect it here
    // and return a clear 409 instead of letting the on-chain TX throw a generic
    // 500. fetchCourse uses the raw-IDL BorshCoder → snake_case `lesson_count`.
    const onChainLessonCount = onChainCourse?.lesson_count as
      | number
      | undefined;
    if (
      typeof onChainLessonCount === "number" &&
      lessonIndex >= onChainLessonCount
    ) {
      return NextResponse.json(
        {
          error:
            "This course was recently extended and is pending an admin re-sync — try again shortly.",
        },
        { status: 409 }
      );
    }

    // Idempotency: skip on-chain TX if lesson already completed in bitmap
    const alreadyOnChain = isLessonComplete(
      onChainEnrollment.lesson_flags as (bigint | number)[],
      lessonIndex
    );

    if (alreadyOnChain) {
      // Sync progress in case the Helius webhook missed this completion.
      // ignoreDuplicates avoids overwriting an existing tx_signature with null.
      const { error: recoveryError } = await supabaseAdmin
        .from("user_progress")
        .upsert(
          {
            user_id: user.id,
            course_id: courseId,
            lesson_id: lessonId,
            completed: true,
            completed_at: new Date().toISOString(),
            tx_signature: null,
            lesson_index: lessonIndex,
          },
          { onConflict: "user_id,lesson_id", ignoreDuplicates: true }
        );

      if (recoveryError) {
        logError({
          errorId: ERROR_IDS.LESSON_COMPLETE_FAILED,
          error: new Error(recoveryError.message),
          context: {
            route: "/api/lessons/complete",
            step: "recovery_sync",
            userId: user.id,
            courseId,
            lessonId,
          },
        });
      }
      return NextResponse.json({
        success: true,
        alreadyCompleted: true,
        signature: null,
      });
    }

    // Execute on-chain completeLesson
    const signature = await onChainCompleteLesson(
      courseId,
      walletPubkey,
      lessonIndex
    );

    // Write directly to Supabase so progress is visible on the dashboard
    // immediately, without depending on Helius webhook delivery timing.
    // The webhook will upsert the same row again (idempotent) when it arrives.
    const { error: progressError } = await supabaseAdmin
      .from("user_progress")
      .upsert(
        {
          user_id: user.id,
          course_id: courseId,
          lesson_id: lessonId,
          completed: true,
          completed_at: new Date().toISOString(),
          tx_signature: signature,
          lesson_index: lessonIndex,
        },
        { onConflict: "user_id,lesson_id" }
      );

    if (progressError) {
      logError({
        errorId: ERROR_IDS.LESSON_COMPLETE_FAILED,
        error: new Error(progressError.message),
        context: {
          route: "/api/lessons/complete",
          step: "sync_progress",
          userId: user.id,
          courseId,
          lessonId,
        },
      });
    }

    return NextResponse.json({ success: true, signature });
  } catch (err: unknown) {
    logError({
      errorId: ERROR_IDS.LESSON_COMPLETE_FAILED,
      error: err instanceof Error ? err : new Error(String(err)),
      context: { route: "/api/lessons/complete" },
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
