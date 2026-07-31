import { NextRequest, NextResponse } from "next/server";
import { getRecommendedCourses } from "@/lib/content/queries";
import { parseIds } from "../params";

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
    const courses = await getRecommendedCourses(exclude);
    return NextResponse.json({ courses });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch recommendations" },
      { status: 500 }
    );
  }
}
