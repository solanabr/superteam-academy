import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getChallengeAnswerKey } from "@/lib/sanity/queries";
import {
  validateAgainstAnswerKey,
  MAX_SUBMISSION_BYTES,
} from "@/lib/challenge/validate";
import { logError } from "@/lib/logging";
import { ERROR_IDS } from "@/constants/errorIds";

/**
 * POST /api/lessons/validate-challenge
 *
 * Server-side, authoritative challenge validation. Loads the FULL answer key
 * (hidden tests + reference solution) server-side via getChallengeAnswerKey,
 * runs the submission through the secure isolate executor (`isolated-vm`)
 * against ALL tests (visible + hidden), and returns only pass/fail metadata.
 * The answer key, hidden tests, and reference solution are never serialised
 * into the response (P0-C4).
 *
 * `serverValidated` reflects a REAL server-side execution of the submission.
 * If the secure executor is unavailable in this environment, the route reports
 * `serverValidated: false` with reason `server_execution_unavailable` and the
 * completion gate in /api/lessons/complete denies the completion (degrade
 * closed) — a forged client "passed" can never produce a completion record.
 *
 * This route is a UX convenience (gives the editor an authoritative pass/fail).
 * The actual completion gate lives in /api/lessons/complete, which re-runs the
 * same validation server-side; the client is never trusted to assert a pass.
 */

interface ValidateChallengeRequest {
  courseSlug: string;
  lessonSlug: string;
  submittedCode: string;
}

interface ValidateChallengeResponse {
  /** Whether the server independently executed and verified the submission. */
  serverValidated: boolean;
  /** True only when serverValidated and every test (visible + hidden) passed. */
  passed: boolean;
  /** True when the lesson is a challenge. */
  isChallenge: boolean;
  /** Authoritative number of hidden tests held server-side. */
  hiddenTestCount: number;
  /** Authoritative number of visible tests. */
  visibleTestCount: number;
  /** Machine-readable reason when serverValidated is false. */
  reason?:
    | "server_execution_unavailable"
    | "not_a_challenge"
    | "non_js_challenge";
}

const MAX_SLUG_LENGTH = 200;

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

    // Answer key is fetched server-side and stays server-side — it is never
    // serialised into the response below.
    const answerKey = await getChallengeAnswerKey(courseSlug, lessonSlug);

    if (!answerKey) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    const verdict = await validateAgainstAnswerKey(answerKey, submittedCode);

    switch (verdict.kind) {
      case "not_a_challenge":
        return NextResponse.json({
          serverValidated: false,
          passed: false,
          isChallenge: false,
          hiddenTestCount: 0,
          visibleTestCount: 0,
          reason: "not_a_challenge",
        });
      case "non_js_challenge":
        // Rust / buildable challenges are validated by the Rust playground /
        // build server, not this JS executor.
        return NextResponse.json({
          serverValidated: false,
          passed: false,
          isChallenge: true,
          hiddenTestCount: verdict.hiddenTestCount,
          visibleTestCount: verdict.visibleTestCount,
          reason: "non_js_challenge",
        });
      case "executor_unavailable":
        return NextResponse.json({
          serverValidated: false,
          passed: false,
          isChallenge: true,
          hiddenTestCount: verdict.hiddenTestCount,
          visibleTestCount: verdict.visibleTestCount,
          reason: "server_execution_unavailable",
        });
      case "validated":
        return NextResponse.json({
          serverValidated: true,
          passed: verdict.passed,
          isChallenge: true,
          hiddenTestCount: verdict.hiddenTestCount,
          visibleTestCount: verdict.visibleTestCount,
        });
    }
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
