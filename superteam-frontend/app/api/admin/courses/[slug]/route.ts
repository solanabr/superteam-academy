import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { checkPermission } from "@/lib/server/admin-auth";
import {
  getCourse,
  getAllCourses,
  upsertCourse,
  deleteCourse,
} from "@/lib/server/admin-store";
import {
  ensureCourseOnChain,
  updateCourseOnChain,
  deactivateCourseOnChain,
} from "@/lib/server/academy-program";
import { CacheTags } from "@/lib/server/cache-tags";
import type { Course } from "@/lib/course-catalog";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

type Params = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Params) {
  const user = await checkPermission("courses.read");
  if (!user) return unauthorized();
  const { slug } = await params;
  const course = await getCourse(slug);
  if (!course) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(course);
}

export async function PUT(request: Request, { params }: Params) {
  const user = await checkPermission("courses.write");
  if (!user) return unauthorized();
  const { slug } = await params;
  const body = (await request.json()) as Course;
  body.slug = slug;
  await upsertCourse(body);
  revalidateTag(CacheTags.COURSES, "max");

  const lessonsCount = body.modules
    ? body.modules.reduce((sum, m) => sum + m.lessons.length, 0)
    : 0;
  const allCourses = await getAllCourses();
  const trackId = allCourses.findIndex((c) => c.slug === slug) + 1;

  let onChain = false;
  let chainError: string | null = null;
  try {
    await ensureCourseOnChain(slug, lessonsCount, trackId);
    await updateCourseOnChain(slug, lessonsCount, true);
    onChain = true;
    console.log(
      `[admin] update_course on-chain OK: ${slug} (lessons=${lessonsCount})`,
    );
  } catch (err) {
    chainError = err instanceof Error ? err.message : String(err);
    console.error(
      `[admin] update_course on-chain FAILED for ${slug}:`,
      chainError,
    );
  }

  return NextResponse.json({ ...body, onChain, chainError });
}

export async function DELETE(_request: Request, { params }: Params) {
  const user = await checkPermission("courses.write");
  if (!user) return unauthorized();
  const { slug } = await params;
  const deleted = await deleteCourse(slug);
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  revalidateTag(CacheTags.COURSES, "max");

  let deactivated = false;
  let chainError: string | null = null;
  try {
    await deactivateCourseOnChain(slug);
    deactivated = true;
    console.log(`[admin] deactivate_course on-chain OK: ${slug}`);
  } catch (err) {
    chainError = err instanceof Error ? err.message : String(err);
    console.error(
      `[admin] deactivate_course on-chain FAILED for ${slug}:`,
      chainError,
    );
  }

  return NextResponse.json({ ok: true, deactivated, chainError });
}
