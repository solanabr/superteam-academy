import { NextRequest, NextResponse } from "next/server";
import { parseIds } from "../params";
import { getCoursesByIds } from "@/lib/content/queries";

/**
 * Public course summaries by id — the client-side face of `getCoursesByIds`
 * (dashboard / profile / certificates). Gated server-side on synced+active, so
 * it only ever exposes the public catalog `CourseSummary` shape (no lesson
 * content). Reading search params makes the route dynamic; the underlying
 * deployment map stays cached (tag "courses", 3600s) via `getActiveDeployments`.
 */
export async function GET(request: NextRequest) {
  const ids = parseIds(request.nextUrl.searchParams.get("ids"), false);
  if (ids instanceof NextResponse) return ids;
  try {
    const courses = await getCoursesByIds(ids);
    return NextResponse.json({ courses });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}
