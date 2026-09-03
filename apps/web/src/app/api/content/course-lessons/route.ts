import { NextRequest, NextResponse } from "next/server";
import { getCourseLessonOrders } from "@/lib/content/queries";
import { parseIds, CONTENT_CACHE_HEADERS } from "../params";
import { localeFromRequest } from "../locale";

/**
 * Ordered lesson summaries per course id — the client-side face of
 * `getCourseLessonOrders` (dashboard Continue card, LX-B2). Gated server-side
 * on synced+active; only the summary-safe `{_id,title,slug}` lesson shape
 * crosses this boundary (no lesson content). Reading search params makes the
 * route dynamic; the deployment map stays cached via `getActiveDeployments`.
 */
export async function GET(request: NextRequest) {
  const ids = parseIds(request.nextUrl.searchParams.get("ids"), false);
  if (ids instanceof NextResponse) return ids;
  try {
    const courses = await getCourseLessonOrders(
      ids,
      localeFromRequest(request)
    );
    return NextResponse.json({ courses }, { headers: CONTENT_CACHE_HEADERS });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch course lessons" },
      { status: 500 }
    );
  }
}
