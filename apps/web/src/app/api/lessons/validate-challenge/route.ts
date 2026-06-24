import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getChallengeAnswerKey } from "@/lib/sanity/queries";
import { logError } from "@/lib/logging";
import { ERROR_IDS } from "@/constants/errorIds";

/**
 * POST /api/lessons/validate-challenge
 *
 * Server-side home for challenge validation. It loads the FULL answer key
 * (hidden tests + reference solution) server-side via getChallengeAnswerKey and
 * never returns the tests or the solution to the client (P0-C4). The response
 * exposes only pass/fail-style metadata.
 *
 * BOUNDARY (intentional, see PR "Follow-up / out of scope"): this route does NOT
 * execute untrusted user code. Running arbitrary learner submissions in a
 * trusted server context is a separate sandboxing problem and is deferred. Until
 * that lands, `serverValidated` is false for code challenges, the count of
 * hidden tests is authoritative, and the client must not be trusted to assert a
 * challenge was "passed". XP integrity in the meantime is enforced by the
 * per-award and per-day caps in award_xp() (see supabase/schema.sql).
 */

interface ValidateChallengeRequest {
  courseSlug: string;
  lessonSlug: string;
}

interface ValidateChallengeResponse {
  /**
   * Whether the server independently verified the submission. Always false for
   * now (no server-side execution yet) — see route docstring.
   */
  serverValidated: boolean;
  /** True when the lesson is a challenge with an authored answer key. */
  isChallenge: boolean;
  /** Authoritative number of hidden tests held server-side. */
  hiddenTestCount: number;
  /** Authoritative number of visible tests. */
  visibleTestCount: number;
  /** Machine-readable reason when serverValidated is false. */
  reason?: "server_execution_unavailable" | "not_a_challenge";
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
    const { courseSlug, lessonSlug } = body;

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

    // Answer key is fetched server-side and stays server-side — it is never
    // serialized into the response below.
    const answerKey = await getChallengeAnswerKey(courseSlug, lessonSlug);

    if (!answerKey) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    const tests = answerKey.tests ?? [];
    const hiddenTestCount = tests.filter((tc) => tc.hidden === true).length;
    const visibleTestCount = tests.length - hiddenTestCount;

    if (answerKey.type !== "challenge") {
      return NextResponse.json({
        serverValidated: false,
        isChallenge: false,
        hiddenTestCount: 0,
        visibleTestCount: 0,
        reason: "not_a_challenge",
      });
    }

    // No server-side execution yet — report the authoritative test counts but do
    // not claim the submission was validated.
    return NextResponse.json({
      serverValidated: false,
      isChallenge: true,
      hiddenTestCount,
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
