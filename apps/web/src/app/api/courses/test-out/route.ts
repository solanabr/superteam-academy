import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCourseById } from "@/lib/content/queries";
import { isRateLimited, getClientIp, releaseRateLimit } from "@/lib/rate-limit";
import { isOnChainProgramLive } from "@/lib/solana/academy-program";
import { isCourseInMaintenance } from "@/lib/content/deployments";
import { isPlatformFrozen } from "@/lib/platform/freeze";
import { platformFrozenResponse } from "@/lib/platform/freeze-http";
import { nextCourseAfter } from "@/lib/courses/path-order";
import { resolveEntryLessonHref } from "@/lib/courses/entry-lesson";
import { locales, defaultLocale, type Locale } from "@/lib/i18n/config";
import { serverEnv } from "@/lib/env.server";
import { logError } from "@/lib/logging";
import { ERROR_IDS } from "@/constants/errorIds";
import {
  selectTestOutQuestions,
  toPublicQuestion,
  gradeTestOut,
  TEST_OUT_PASS_RATIO,
  type TestOutSelections,
} from "@/lib/courses/test-out";
import {
  batchCompleteCourse,
  BatchCompleteError,
} from "@/lib/lessons/batch-complete";

// A passing submission drives one confirmed complete_lesson tx per incomplete
// lesson, sequentially — a 12–16-lesson course can take well past the default
// serverless budget. This is the sole surface that batch-drives on-chain writes.
export const maxDuration = 300;

interface TestOutSubmitRequest {
  courseId: string;
  selections?: TestOutSelections;
  /** Locale for the onward-routing href; validated against the allow-list. */
  locale?: string;
}

function coerceLocale(value: unknown): Locale {
  return typeof value === "string" &&
    (locales as readonly string[]).includes(value)
    ? (value as Locale)
    : defaultLocale;
}

/**
 * GET — fetch the test-out challenge for a course.
 *
 * Returns the deterministic per-(user, course) question set with the answer key
 * STRIPPED (`toPublicQuestion`). Auth is required so the set matches the one the
 * POST half will re-derive and grade.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const courseId = request.nextUrl.searchParams.get("courseId");
    if (!courseId || courseId.length > 100) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const course = await getCourseById(courseId);
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const selected = selectTestOutQuestions(course, user.id);
    if (selected.length === 0) {
      // No authored quiz pool → no test-out for this course.
      return NextResponse.json(
        { error: "Test-out is not available for this course" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      courseId: course._id,
      count: selected.length,
      passRatio: TEST_OUT_PASS_RATIO,
      questions: selected.map(toPublicQuestion),
    });
  } catch (err: unknown) {
    logError({
      errorId: ERROR_IDS.TEST_OUT_FAILED,
      error: err instanceof Error ? err : new Error(String(err)),
      context: { route: "/api/courses/test-out", method: "GET" },
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST — submit test-out answers.
 *
 * Server-authoritative: the submission is re-graded against the deterministic
 * question set (`gradeTestOut`), never trusting any client verdict. On a pass,
 * the course's lessons are batch-completed service-role-side through the existing
 * per-lesson rails (`batchCompleteCourse`) and the learner is routed onward to
 * the next course in the path. On a fail, nothing is mutated.
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

    const body = (await request.json()) as TestOutSubmitRequest;
    const { courseId } = body;
    if (!courseId || typeof courseId !== "string" || courseId.length > 100) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    const selections: TestOutSelections =
      body.selections && typeof body.selections === "object"
        ? body.selections
        : {};
    const locale = coerceLocale(body.locale);

    if (await isPlatformFrozen()) {
      return platformFrozenResponse();
    }

    // ── Attempt gates ──────────────────────────────────────────────────────
    // A PASS drives N platform-funded on-chain txs, so submissions are bounded
    // per-user AND per-IP. These bound the challenge itself; the batch it kicks
    // off never traverses the per-user lessons:complete volume gate, so that gate
    // is untouched for normal traffic. Per-user is fail-open (a store blip must
    // not block an honest learner); per-IP mirrors the complete route's ceiling.
    if (
      await isRateLimited("courses:test-out", user.id, {
        maxTokens: 10,
        refillIntervalMs: 3_600_000,
      })
    ) {
      return NextResponse.json(
        { error: "Too many test-out attempts. Please slow down." },
        { status: 429, headers: { "Retry-After": "3600" } }
      );
    }
    if (
      await isRateLimited("courses:test-out:ip", getClientIp(request.headers), {
        maxTokens: 200,
        refillIntervalMs: 3_600_000,
      })
    ) {
      return NextResponse.json(
        { error: "Too many test-out attempts from this network." },
        { status: 429, headers: { "Retry-After": "3600" } }
      );
    }

    const course = await getCourseById(courseId);
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Re-derive the authoritative set and grade it — the client's selections and
    // any verdict it computed are ignored beyond the raw option ids.
    const selected = selectTestOutQuestions(course, user.id);
    if (selected.length === 0) {
      return NextResponse.json(
        { error: "Test-out is not available for this course" },
        { status: 404 }
      );
    }
    const grade = gradeTestOut(selected, selections);

    if (!grade.passed) {
      return NextResponse.json({
        passed: false,
        correct: grade.correct,
        total: grade.total,
        required: grade.required,
      });
    }

    // ── Pass path: batch-complete via the existing per-lesson rails ─────────
    const admin = createAdminClient();
    const { data: profile } = await admin
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

    if (!(await isOnChainProgramLive())) {
      return NextResponse.json(
        { error: "On-chain program not available" },
        { status: 503 }
      );
    }
    if (await isCourseInMaintenance(courseId)) {
      return NextResponse.json(
        {
          error:
            "This course is undergoing maintenance. Please try again in a few minutes.",
        },
        { status: 503, headers: { "Retry-After": "60" } }
      );
    }

    // Serialise a user's concurrent passes for the SAME course: the batch loop
    // reads the bitmap once, so two overlapping runs would each fire txs for the
    // same unset slots and burn the losers on the program's double-complete
    // guard. 1 token / 120s coarse lock, released on every exit; fail-open.
    const lockNs = "courses:test-out:inflight";
    const lockKey = `${user.id}:${courseId}`;
    if (
      await isRateLimited(lockNs, lockKey, {
        maxTokens: 1,
        refillIntervalMs: 120_000,
      })
    ) {
      return NextResponse.json(
        {
          error:
            "This test-out is already being processed. Please wait a moment.",
          reason: "test_out_in_progress",
        },
        { status: 429, headers: { "Retry-After": "120" } }
      );
    }

    try {
      const result = await batchCompleteCourse({
        userId: user.id,
        courseId,
        wallet: new PublicKey(profile.wallet_address),
      });

      const nextCourseId = await nextCourseAfter(courseId);
      const next = nextCourseId
        ? await resolveEntryLessonHref(locale, nextCourseId)
        : `/${locale}/dashboard`;

      return NextResponse.json({
        passed: true,
        correct: grade.correct,
        total: grade.total,
        completed: result,
        next,
      });
    } finally {
      await releaseRateLimit(lockNs, lockKey);
    }
  } catch (err: unknown) {
    if (err instanceof BatchCompleteError) {
      const status =
        err.code === "enrollment_missing"
          ? 403
          : err.code === "xp_cap_exceeded"
            ? 409
            : 404;
      return NextResponse.json(
        { error: err.message, reason: err.code },
        { status }
      );
    }
    logError({
      errorId: ERROR_IDS.TEST_OUT_FAILED,
      error: err instanceof Error ? err : new Error(String(err)),
      context: { route: "/api/courses/test-out", method: "POST" },
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
