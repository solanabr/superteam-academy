import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { authorizeTeacher } from "@/lib/teacher/authorize";
import { getCourseAuthorship } from "@/lib/sanity/teacher-mutations";
import { getCourseStats } from "@/lib/teacher/stats";

export const dynamic = "force-dynamic";

/**
 * GET /api/teacher/courses/[id]/stats — headline stats for a course the caller
 * owns (enrolled / completions / certificates). Ownership is checked against
 * the course's `author` (teacher owns it, or admin); the aggregation runs
 * server-side against Supabase.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const auth = await authorizeTeacher();
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: auth.status }
    );
  }

  const { id } = await params;
  const course = await getCourseAuthorship(id);
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }
  if (auth.caller.role !== "admin" && course.author !== auth.caller.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const stats = await getCourseStats(id);
  return NextResponse.json(stats);
}
