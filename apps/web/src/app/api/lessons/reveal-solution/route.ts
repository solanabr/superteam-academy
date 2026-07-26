import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getLessonBySlug } from "@/lib/content/queries";
import { scheduleReviewItem } from "@/lib/review/schedule-review";

const MAX_SLUG_CHARS = 256;

/**
 * LX-C6 solution-reveal soft-gate side effect: when a learner deliberately
 * reveals a challenge's reference solution, reschedule that lesson into their
 * spaced-review queue (LX-B3). The reveal happens client-side (the solution is
 * already in the lesson payload) — this route only records the review
 * consequence, so it is best-effort: it never gates the reveal.
 *
 * XP is untouched: xpPerLesson is fixed on-chain, so there is no "reduced XP"
 * path here (unified-spec zero-on-chain edge #1) — the only consequence is the
 * review reschedule. Own-data only: the review row is keyed by the authenticated
 * user's id; the lesson is resolved from slugs so a client cannot enqueue an
 * arbitrary item_key.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { courseSlug?: unknown; lessonSlug?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const courseSlug = typeof body.courseSlug === "string" ? body.courseSlug : "";
  const lessonSlug = typeof body.lessonSlug === "string" ? body.lessonSlug : "";
  if (
    !courseSlug ||
    !lessonSlug ||
    courseSlug.length > MAX_SLUG_CHARS ||
    lessonSlug.length > MAX_SLUG_CHARS
  ) {
    return NextResponse.json({ error: "Missing lesson" }, { status: 400 });
  }

  // Resolve the canonical lesson _id the review queue is keyed by (same seam the
  // AI Partner log route uses). A lesson not yet live has no review item.
  const lesson = await getLessonBySlug(courseSlug, lessonSlug);
  if (!lesson) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  const scheduled = await scheduleReviewItem(user.id, lesson._id);
  return NextResponse.json({ scheduled });
}
