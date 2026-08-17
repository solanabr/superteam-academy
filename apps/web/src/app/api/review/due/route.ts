import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildReviewSession } from "@/lib/review/session";
import { logError } from "@/lib/logging";
import { ERROR_IDS } from "@/constants/errorIds";

/**
 * The dashboard review strip's authoritative due summary (#977).
 *
 * The strip used to count client-side by intersecting the raw due queue with
 * `/api/content/lessons-summary` — a WEAKER rule than the session's
 * (`resolveReviewItems` also requires an owning course in the bundle), so the
 * badge could promise items `/review` then failed to serve. This route runs
 * the SAME `buildReviewSession` the /review page renders, so the count and
 * titles are by construction the session's own. Auth required: due items are
 * the session user's, never a query param.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const session = await buildReviewSession(supabase, user.id);
    return NextResponse.json({
      count: session.length,
      titles: session.map((item) => item.lessonTitle),
    });
  } catch (err: unknown) {
    logError({
      errorId: ERROR_IDS.REVIEW_DUE_FAILED,
      error: err instanceof Error ? err : new Error(String(err)),
      context: { route: "/api/review/due" },
    });
    return NextResponse.json({ error: "internalError" }, { status: 500 });
  }
}
