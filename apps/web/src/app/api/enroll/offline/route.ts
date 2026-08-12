import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCourseById } from "@/lib/content/queries";
import { isOfflineEnrollCourse } from "@/lib/events/offline-course";
import { isRateLimited, getClientIp } from "@/lib/rate-limit";
import { logError } from "@/lib/logging";
import { ERROR_IDS } from "@/constants/errorIds";

/**
 * Wallet-free enrolment for an event-mode course (see lib/events/offline-course).
 *
 * Writes ONLY the Supabase `enrollments` row — no transaction, no wallet. That
 * row is what the course and lesson pages read to decide "enrolled", so this is
 * enough for a learner on a phone to start the course immediately.
 *
 * `wallet_address` and `tx_signature` are left NULL, which is exactly how a
 * not-yet-on-chain enrolment is represented: the backfill fills them in when the
 * learner links a wallet, and their absence is the signal that it still needs to.
 *
 * REFUSES any course not in event mode. Without that check this would be a
 * general-purpose "enrol me without paying for it" endpoint that bypasses the
 * on-chain enrolment every other course depends on.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { courseId?: unknown };
    if (typeof body.courseId !== "string" || !body.courseId) {
      return NextResponse.json(
        { error: "courseId is required" },
        { status: 400 }
      );
    }
    const courseId = body.courseId;

    if (!isOfflineEnrollCourse(courseId)) {
      return NextResponse.json(
        { error: "This course requires a wallet to enrol." },
        { status: 403 }
      );
    }

    if (!getCourseById(courseId)) {
      return NextResponse.json({ error: "Unknown course" }, { status: 404 });
    }

    // A room full of people on the same venue wifi shares one NAT address, so
    // the per-IP ceiling has to clear a whole cohort signing up at once — it is
    // here to stop a script, not a queue of attendees.
    if (
      await isRateLimited("enroll:offline", user.id, {
        maxTokens: 10,
        refillIntervalMs: 3_600_000,
      })
    ) {
      return NextResponse.json(
        { error: "Too many enrolment attempts. Please try again shortly." },
        { status: 429, headers: { "Retry-After": "600" } }
      );
    }
    if (
      await isRateLimited("enroll:offline:ip", getClientIp(request.headers), {
        maxTokens: 500,
        refillIntervalMs: 3_600_000,
      })
    ) {
      return NextResponse.json(
        { error: "Too many enrolment attempts from this network." },
        { status: 429, headers: { "Retry-After": "600" } }
      );
    }

    // Service role: `enrollments` has no authenticated INSERT policy — rows are
    // written only by trusted server paths (webhook, resync, and now this one).
    const admin = createAdminClient();
    const { error } = await admin.from("enrollments").upsert(
      {
        user_id: user.id,
        course_id: courseId,
        enrolled_at: new Date().toISOString(),
        // Deliberately null: no chain involvement yet.
        tx_signature: null,
        wallet_address: null,
      },
      // Re-enrolling must not reset `enrolled_at` — a later `completed_at` is
      // CHECK-constrained to be >= it, and bumping it under an existing
      // completion would make the row unwritable.
      { onConflict: "user_id,course_id", ignoreDuplicates: true }
    );

    if (error) {
      logError({
        errorId: ERROR_IDS.OFFLINE_ENROLL_FAILED,
        error: new Error(error.message),
        context: { userId: user.id, courseId },
      });
      return NextResponse.json({ error: "Could not enrol" }, { status: 500 });
    }

    return NextResponse.json({ success: true, courseId, onChain: false });
  } catch (err: unknown) {
    logError({
      errorId: ERROR_IDS.OFFLINE_ENROLL_FAILED,
      error: err instanceof Error ? err : new Error(String(err)),
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
