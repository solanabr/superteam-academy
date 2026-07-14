import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { BLOCK_REGISTRY, type BlockType } from "@superteam-lms/content-schema";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCourseById, getLessonByIdForGrading } from "@/lib/content/queries";
import { GRADERS, type GradedBlockType } from "@/lib/grading/graders";
import { openAttestation } from "@/lib/ai/check-seal";
import { isRateLimited, getClientIp } from "@/lib/rate-limit";
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
import { serverEnv } from "@/lib/env.server";
import { isCourseInMaintenance } from "@/lib/content/deployments";

interface LessonCompleteRequest {
  lessonId: string;
  courseId: string;
  /**
   * Per-block proofs keyed by the block `key` (spec §7.2). A graded block's
   * proof is its answer set; a required-but-ungraded block's proof is a sealed
   * attestation token. Block-level pass/fail is transient — never persisted.
   */
  proofs?: Record<string, unknown>;
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
      !serverEnv.SUPABASE_SERVICE_ROLE_KEY
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
    const { lessonId, courseId } = body;
    const proofs: Record<string, unknown> =
      body.proofs && typeof body.proofs === "object" ? body.proofs : {};

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

    // ── Volume gate (#459) ────────────────────────────────────────────────
    // This route is the single chokepoint for every platform-funded on-chain
    // write: the backend keypair is `payer` AND `backendSigner` on the resulting
    // complete_lesson tx, and the LessonCompleted webhook cascades from it into
    // finalize_course (learner bonus + creator reward) and issue_credential
    // (permanent Core-asset rent). The learner signs, and pays, nothing.
    //
    // The gate below this proves answers are CORRECT; it cannot prove a person
    // produced them. Answers are identical for every learner, so one honest
    // playthrough yields a `proofs` payload replayable from any number of free
    // SIWS accounts. These limits bound the resulting spend.
    //
    // Both keys are needed. Per-user bounds one account hammering the route; it
    // does nothing against Sybils, where every fresh account is a fresh key.
    // Per-IP is the only one that bounds an actor. Neither stops a determined
    // farmer with proxies — they bound the BURN RATE, and that is the honest
    // claim. Runs before grading, so a throttled caller never reaches the code
    // executors.
    //
    // The per-IP ceiling is sized off the worst legitimate case, not a round
    // number: an IRL bootcamp behind one NAT (or a CGNAT'd mobile carrier, which
    // is common in BR). Courses in the bundle run 12–16 lessons, so a 60-person
    // cohort working through a 16-lesson course in one window is ~960 requests.
    // 1200 clears that; a fixed-window counter is a cliff, not a throttle, so
    // undershooting here 429s an entire classroom at once.
    if (
      await isRateLimited("lessons:complete", user.id, {
        maxTokens: 40,
        refillIntervalMs: 3_600_000,
      })
    ) {
      return NextResponse.json(
        { error: "Too many lesson completions. Please slow down." },
        { status: 429, headers: { "Retry-After": "3600" } }
      );
    }

    if (
      await isRateLimited("lessons:complete:ip", getClientIp(request.headers), {
        maxTokens: 1200,
        refillIntervalMs: 3_600_000,
      })
    ) {
      return NextResponse.json(
        { error: "Too many lesson completions from this network." },
        { status: 429, headers: { "Retry-After": "3600" } }
      );
    }

    // ── Server-authoritative completion gate (block model, spec §7.2) ──────
    // Inverted from the old fail-OPEN `if (answerKey.type === "challenge")`:
    // every dispatch below defaults to DENY. An unknown block type, a graded
    // block with no grader/wrong proof, an executor outage, or a missing/forged
    // required-block attestation each blocks completion — a forged client
    // "passed" can never mint XP. Block-level results are transient (never
    // persisted); the lesson stays the only durable progress unit.
    const gradedLesson = await getLessonByIdForGrading(courseId, lessonId);
    if (!gradedLesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    const deny = (status: 403 | 404 | 503, error: string) =>
      NextResponse.json({ error }, { status });

    // 0) Unknown block type → CLOSED. A block whose _type is not in the registry
    //    cannot be reasoned about, so completion is denied (not silently skipped).
    for (const block of gradedLesson.blocks) {
      if (!((block._type as string) in BLOCK_REGISTRY)) {
        return deny(
          503,
          "This lesson has an unrecognized block and cannot be completed yet"
        );
      }
    }

    // 1) Graded blocks (code, quiz): a deterministic grader MUST pass. A missing
    //    grader for a graded type is a second, independent fail-closed path.
    for (const block of gradedLesson.blocks) {
      const type = block._type as BlockType;
      if (!BLOCK_REGISTRY[type].graded) continue;
      const grader = GRADERS[type as GradedBlockType];
      if (!grader) return deny(503, "No grader for this block type");
      const result = await grader(block, proofs[block.key]);
      if (!result.ok) return deny(result.status, "Block did not pass");
    }

    // 2) Required-but-UNGRADED blocks (openEnded): a sealed attestation must
    //    prove the server saw a submission for THIS lesson+block+user. The
    //    `!graded` filter is essential — a graded block's proof is an answer set,
    //    not an attestation, so running it through openAttestation would 403
    //    every valid code/quiz completion.
    for (const block of gradedLesson.blocks) {
      const type = block._type as BlockType;
      if (!(BLOCK_REGISTRY[type].required && !BLOCK_REGISTRY[type].graded)) {
        continue;
      }
      const token = proofs[block.key];
      if (
        typeof token !== "string" ||
        !openAttestation(token, {
          lessonId,
          blockKey: block.key,
          userId: user.id,
        })
      ) {
        return deny(403, "This lesson requires a completed reflection");
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

    // WS-2 #453 rail 3 — the affected course is mid close+recreate (the Course
    // PDA is briefly absent, non-atomically). Refuse rather than racing that
    // window; the learner's proofs/grading above are already validated and
    // durable client-side, so a retry shortly after is lossless.
    if (await isCourseInMaintenance(courseId)) {
      return NextResponse.json(
        {
          error:
            "This course is undergoing maintenance. Please try again in a few minutes.",
        },
        { status: 503, headers: { "Retry-After": "60" } }
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
    // 500. fetchCourse returns the normalised `liveLessonCount`.
    // Count-based and only correct while masks are dense (today). Once a
    // sparse-mask course can exist, this must become a per-slot bit test
    // against `activeLessons` instead of a count comparison.
    const onChainLessonCount = onChainCourse?.liveLessonCount;
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
