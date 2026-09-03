import { NextRequest, NextResponse } from "next/server";
import { getRecommendedCourses } from "@/lib/content/queries";
import { parseIds, CONTENT_CACHE_HEADERS } from "../params";
import { localeFromRequest } from "../locale";

/**
 * Public recommended-course summaries — the client-side face of
 * `getRecommendedCourses`. Since the "Recommended For You" dashboard section was
 * removed, its only consumer is the dashboard Continue card's `nextCourse`
 * variant (the next course for an all-complete learner). `exclude` may be absent
 * (recommend from the whole gated catalog). Gated server-side on synced+active.
 */
export async function GET(request: NextRequest) {
  const exclude = parseIds(request.nextUrl.searchParams.get("exclude"), true);
  if (exclude instanceof NextResponse) return exclude;
  try {
    const courses = await getRecommendedCourses(
      exclude,
      localeFromRequest(request)
    );
    return NextResponse.json({ courses }, { headers: CONTENT_CACHE_HEADERS });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch recommendations" },
      { status: 500 }
    );
  }
}
