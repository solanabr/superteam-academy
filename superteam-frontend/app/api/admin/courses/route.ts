import { NextResponse } from "next/server";
import { checkPermission } from "@/lib/server/admin-auth";
import { getAllCourses, upsertCourse } from "@/lib/server/admin-store";
import { ensureCourseOnChain } from "@/lib/server/academy-program";
import type { Course } from "@/lib/course-catalog";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET() {
  const user = await checkPermission("courses.read");
  if (!user) return unauthorized();
  return NextResponse.json(getAllCourses());
}

export async function POST(request: Request) {
  const user = await checkPermission("courses.write");
  if (!user) return unauthorized();
  const body = (await request.json()) as Course;
  if (!body.slug || !body.title) {
    return NextResponse.json(
      { error: "slug and title are required" },
      { status: 400 },
    );
  }

  upsertCourse(body);

  const lessonsCount = body.modules
    ? body.modules.reduce((sum, m) => sum + m.lessons.length, 0)
    : 0;
  const allCourses = getAllCourses();
  const trackId = allCourses.findIndex((c) => c.slug === body.slug) + 1;

  let onChain = false;
  let chainError: string | null = null;
  try {
    await ensureCourseOnChain(body.slug, lessonsCount, trackId);
    onChain = true;
    console.log(`[admin] create_course on-chain OK: ${body.slug}`);
  } catch (err) {
    chainError = err instanceof Error ? err.message : String(err);
    console.error(
      `[admin] create_course on-chain FAILED for ${body.slug}:`,
      chainError,
    );
  }

  return NextResponse.json({ ...body, onChain, chainError }, { status: 201 });
}
