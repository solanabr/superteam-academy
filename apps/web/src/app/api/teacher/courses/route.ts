import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { authorizeTeacher } from "@/lib/teacher/authorize";
import { validateTeacherCourseInput } from "@/lib/teacher/validate";
import { slugifyCourseTitle } from "@/lib/teacher/slug";
import {
  createTeacherCourse,
  listAllCourses,
  listTeacherCourses,
} from "@/lib/sanity/teacher-mutations";

// Reads the caller's session + own profile row and writes to Sanity — never
// statically prerender (DYNAMIC_SERVER_USAGE).
export const dynamic = "force-dynamic";

/**
 * GET /api/teacher/courses — list the caller's own courses.
 *
 * Auth: authenticated + role in (teacher, admin). Teachers see only courses
 * where `author == their user id`; admins may list every course (`?all=1`,
 * default when admin).
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = await authorizeTeacher();
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: auth.status }
    );
  }

  try {
    const { userId, role } = auth.caller;
    // Only admins may see the full catalog; teachers are always scoped to self,
    // regardless of any query param.
    const wantsAll =
      role === "admin" && req.nextUrl.searchParams.get("all") !== "0";

    const courses = wantsAll
      ? await listAllCourses()
      : await listTeacherCourses(userId);

    return NextResponse.json({ courses });
  } catch {
    return NextResponse.json(
      { error: "Failed to list courses" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/teacher/courses — create a new DRAFT course.
 *
 * The server sets `author = <caller user id>` and forces
 * `authoringStatus = "draft"`. Body is validated against the whitelist; only
 * `title` is required (used to generate the slug). Any `author` /
 * `authoringStatus` / on-chain field in the body is ignored — it is never read.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = await authorizeTeacher();
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: auth.status }
    );
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const validated = validateTeacherCourseInput(raw, "create");
  if (!validated.ok) {
    return NextResponse.json(
      { error: `Invalid ${validated.error.field}: ${validated.error.message}` },
      { status: 400 }
    );
  }

  // `title` is guaranteed present in "create" mode by the validator.
  const slug = slugifyCourseTitle(validated.value.title!);

  try {
    const created = await createTeacherCourse(
      auth.caller.userId,
      slug,
      validated.value
    );
    return NextResponse.json(
      { _id: created._id, slug, authoringStatus: "draft" },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to create course" },
      { status: 500 }
    );
  }
}
