import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getLessonBySlug } from "@/lib/content/queries";
import { getAssistState } from "@/lib/ai/assist-budget";

const MAX_SLUG_CHARS = 256;

/**
 * Returns the persisted AI Partner chat log + paid-assist count for the current
 * learner on a lesson, so the pane can rehydrate past notes on load WITHOUT a
 * paid model call. Own-data only: keyed by the authenticated user's id, read
 * through the SECURITY DEFINER `get_challenge_assist_state` RPC.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const courseSlug = searchParams.get("courseSlug") ?? "";
  const lessonSlug = searchParams.get("lessonSlug") ?? "";
  if (
    !courseSlug ||
    !lessonSlug ||
    courseSlug.length > MAX_SLUG_CHARS ||
    lessonSlug.length > MAX_SLUG_CHARS
  ) {
    return NextResponse.json({ error: "Missing lesson" }, { status: 400 });
  }

  // Resolve the lesson id the budget/log is keyed by (same seam the paid route
  // uses). A lesson not yet live has no partner surface, so no log either.
  const lesson = await getLessonBySlug(courseSlug, lessonSlug);
  if (!lesson) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  const { paidUsed, log } = await getAssistState(user.id, lesson._id);
  return NextResponse.json({ log, paidUsed });
}
