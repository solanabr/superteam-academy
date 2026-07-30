import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isRateLimited } from "@/lib/rate-limit";
import { getLessonBySlug } from "@/lib/content/queries";
import { resetAssists } from "@/lib/ai/assist-budget";

const MAX_BODY_CHARS = 4_000;
const MAX_SLUG_CHARS = 256;

/**
 * Self-serve per-lesson assist reset (#864, P2-5 / owner D-8). Self-only by
 * construction: keyed to the AUTHENTICATED user's id — the request body only
 * names the lesson. Both guards — once per (user, lesson) AND the 7-day
 * cooldown — are enforced INSIDE the SECURITY DEFINER
 * `reset_challenge_assists` RPC (rule R-6), shipped in the same migration as
 * this route; this handler only relays the verdict. A denial is 200 with
 * `{ allowed: false, reason }` — it is an expected product state (cooldown /
 * already used), not an error.
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

  const raw = await request.text();
  if (raw.length > MAX_BODY_CHARS) {
    return NextResponse.json(
      { error: "Request body too large" },
      { status: 413 }
    );
  }

  let body: { courseSlug?: unknown; lessonSlug?: unknown };
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { courseSlug, lessonSlug } = body;
  if (
    typeof courseSlug !== "string" ||
    typeof lessonSlug !== "string" ||
    !courseSlug ||
    !lessonSlug ||
    courseSlug.length > MAX_SLUG_CHARS ||
    lessonSlug.length > MAX_SLUG_CHARS
  ) {
    return NextResponse.json({ error: "Missing lesson" }, { status: 400 });
  }

  // Abuse throttle only — the RPC's internal guards are the real ceiling.
  // Fail-open is fine here (unlike the paid partner route): a reset spends no
  // Gemini tokens, and the once+cooldown guards hold regardless.
  if (
    await isRateLimited("ai:partner:reset", user.id, {
      maxTokens: 5,
      refillIntervalMs: 60_000,
    })
  ) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please wait before trying again." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  // Resolve the lesson id the budget is keyed by (same seam the paid route
  // uses — the catalog gate applies here too).
  const lesson = await getLessonBySlug(courseSlug, lessonSlug);
  if (!lesson) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  const result = await resetAssists(user.id, lesson._id);
  return NextResponse.json({
    allowed: result.allowed,
    reason: result.reason,
    availableAt: result.availableAt,
  });
}
