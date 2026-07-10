import { NextRequest, NextResponse } from "next/server";
import type { CodeBlockData } from "@superteam-lms/types";
import { createClient } from "@/lib/supabase/server";
import { getLessonBySlug } from "@/lib/sanity/queries";
import { gradeCode, MAX_SUBMISSION_BYTES } from "@/lib/grading/graders/code";
import { logError } from "@/lib/logging";
import { ERROR_IDS } from "@/constants/errorIds";

/**
 * POST /api/lessons/validate-challenge
 *
 * Server-side, UX-only challenge pre-check. Reads the lesson's `code` block from
 * the PUBLIC block projection (post-D4 there is no secret answer key) and runs
 * the submission through the same `gradeCode` engine the completion gate uses.
 * Returns only pass/fail metadata.
 *
 * `serverValidated` reflects a REAL server-side execution. If the executor is
 * unavailable, the route reports `serverValidated: false` and the completion
 * gate in /api/lessons/complete denies (degrade closed) — a forged client
 * "passed" can never produce a completion record.
 */

interface ValidateChallengeRequest {
  courseSlug: string;
  lessonSlug: string;
  submittedCode: string;
}

interface ValidateChallengeResponse {
  /** Whether the server independently executed and verified the submission. */
  serverValidated: boolean;
  /** True only when serverValidated and every (public) test passed. */
  passed: boolean;
  /** True when the lesson contains a graded `code` block. */
  isChallenge: boolean;
  /** Number of public tests (post-D4 no test is hidden). */
  visibleTestCount: number;
  /** Machine-readable reason when serverValidated is false. */
  reason?: "server_execution_unavailable" | "not_a_challenge";
}

const MAX_SLUG_LENGTH = 200;

function firstCodeBlock(
  lesson: { blocks: { _type: string }[] } | null
): CodeBlockData | null {
  const block = lesson?.blocks.find((b) => b._type === "code");
  return (block as CodeBlockData | undefined) ?? null;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ValidateChallengeResponse | { error: string }>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = (await request.json()) as ValidateChallengeRequest;
    const { courseSlug, lessonSlug, submittedCode } = body;

    if (
      typeof courseSlug !== "string" ||
      typeof lessonSlug !== "string" ||
      !courseSlug ||
      !lessonSlug ||
      courseSlug.length > MAX_SLUG_LENGTH ||
      lessonSlug.length > MAX_SLUG_LENGTH
    ) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    if (
      typeof submittedCode !== "string" ||
      Buffer.byteLength(submittedCode, "utf8") > MAX_SUBMISSION_BYTES
    ) {
      return NextResponse.json(
        { error: "Invalid submission" },
        { status: 400 }
      );
    }

    const lesson = await getLessonBySlug(courseSlug, lessonSlug);
    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    const codeBlock = firstCodeBlock(lesson);
    if (!codeBlock) {
      return NextResponse.json({
        serverValidated: false,
        passed: false,
        isChallenge: false,
        visibleTestCount: 0,
        reason: "not_a_challenge",
      });
    }

    const visibleTestCount = codeBlock.tests?.length ?? 0;
    const result = await gradeCode(codeBlock, { code: submittedCode });

    if (result.ok) {
      return NextResponse.json({
        serverValidated: true,
        passed: true,
        isChallenge: true,
        visibleTestCount,
      });
    }
    if (result.status === 403) {
      return NextResponse.json({
        serverValidated: true,
        passed: false,
        isChallenge: true,
        visibleTestCount,
      });
    }
    // 503 → could not judge (executor outage / unrecognised type). Degrade closed.
    return NextResponse.json({
      serverValidated: false,
      passed: false,
      isChallenge: true,
      visibleTestCount,
      reason: "server_execution_unavailable",
    });
  } catch (err: unknown) {
    logError({
      errorId: ERROR_IDS.CHALLENGE_VALIDATE_FAILED,
      error: err instanceof Error ? err : new Error(String(err)),
      context: { route: "/api/lessons/validate-challenge" },
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
