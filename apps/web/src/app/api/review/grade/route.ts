import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveReviewItems } from "@/lib/content/queries";
import { gradeQuiz } from "@/lib/grading/graders/quiz";
import { serverEnv } from "@/lib/env.server";
import { logError } from "@/lib/logging";
import { ERROR_IDS } from "@/constants/errorIds";

interface ReviewGradeRequest {
  /** Raw lesson `_id` — the review item_key (PDA-seed convention). */
  itemKey: string;
  /**
   * Per-quiz-block proof, keyed by the block `key`:
   * `{ [blockKey]: { selections: { [questionId]: optionId[] } } }`. Graded
   * server-side below; a missing or malformed proof simply fails the grader.
   */
  proofs?: Record<string, unknown>;
}

/**
 * Grade a due review item and advance/reset its Leitner box (LX-B5).
 *
 * Server-authoritative, NOT client-asserted. The `correct` flags ship to the
 * client (D4 open-book) for instant in-page feedback, exactly as in the lesson
 * quiz — but the box transition is decided HERE by re-running the same
 * deterministic quiz grader (`gradeQuiz`, set-equality) that `/api/lessons/
 * complete` uses, against the bundle-resolved block. A forged `passed` cannot
 * reach `record_review_result`.
 *
 * The mutation keys on the SESSION-DERIVED user only. `record_review_result` is
 * a no-op that returns no row when the learner has no such due item, so a forged
 * or foreign `itemKey` mutates nothing and 404s here.
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

    const body = (await request.json()) as ReviewGradeRequest;
    const { itemKey } = body;
    if (!itemKey || typeof itemKey !== "string" || itemKey.length > 100) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    const proofs: Record<string, unknown> =
      body.proofs && typeof body.proofs === "object" ? body.proofs : {};

    // Bundle-validate the item and pull its authoritative retrieval-close blocks.
    // An item with no quiz block is not inline-gradable in v1 (it renders as a
    // revisit link, never submits here) — treat a submission for one as invalid.
    const [resolved] = await resolveReviewItems([itemKey]);
    if (!resolved || resolved.quiz.length === 0) {
      return NextResponse.json(
        { error: "Not a gradable review item" },
        { status: 404 }
      );
    }

    // Every quiz block must pass — the whole retrieval-close is the exercise.
    let passed = true;
    for (const block of resolved.quiz) {
      const result = await gradeQuiz(block, proofs[block.key]);
      if (!result.ok) {
        passed = false;
        break;
      }
    }

    const admin = createAdminClient();
    const { data, error: rpcError } = await admin.rpc("record_review_result", {
      p_user_id: user.id,
      p_item_key: itemKey,
      p_passed: passed,
    });
    if (rpcError) throw new Error(rpcError.message);

    // No row back → the learner has no such due item (not their own, or already
    // cleared). Nothing was mutated; report it honestly rather than as a pass.
    const row = Array.isArray(data) ? data[0] : undefined;
    if (!row) {
      return NextResponse.json(
        { error: "Review item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ passed, box: row.box, dueAt: row.due_at });
  } catch (err: unknown) {
    logError({
      errorId: ERROR_IDS.REVIEW_GRADE_FAILED,
      error: err instanceof Error ? err : new Error(String(err)),
      context: { route: "/api/review/grade" },
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
