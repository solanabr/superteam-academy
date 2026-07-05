import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { authorizeTeacher } from "@/lib/teacher/authorize";
import { validateTeacherCourseInput } from "@/lib/teacher/validate";
import { reportTeacherWriteError } from "@/lib/teacher/errors";
import {
  getCourseAuthorship,
  patchTeacherCourse,
} from "@/lib/sanity/teacher-mutations";

export const dynamic = "force-dynamic";

const MAX_COURSE_ID_LEN = 256;

/**
 * PATCH /api/teacher/courses/[id] — update a course the caller owns.
 *
 * Authorization (all server-side):
 *   1. Authenticated + role in (teacher, admin) — else 401/403.
 *   2. Load the course's `author` from Sanity via the server-only admin client.
 *      If `author !== caller` AND caller is not an admin → 403. This is the
 *      cross-author write guard.
 *
 * The body is validated against the field whitelist. `author`, `onChainStatus`,
 * `_id`, `_type`, `_rev`, and `authoringStatus: "approved"` are all
 * unreachable — they are never read from the body. A teacher therefore cannot
 * reassign ownership, touch on-chain state, or self-publish.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const auth = await authorizeTeacher();
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: auth.status }
    );
  }

  const { id: courseId } = await params;
  if (
    typeof courseId !== "string" ||
    courseId.length === 0 ||
    courseId.length > MAX_COURSE_ID_LEN
  ) {
    return NextResponse.json({ error: "Invalid course id" }, { status: 400 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const validated = validateTeacherCourseInput(raw, "patch");
  if (!validated.ok) {
    return NextResponse.json(
      { error: `Invalid ${validated.error.field}: ${validated.error.message}` },
      { status: 400 }
    );
  }

  // --- Ownership check (the security core) ---
  let course;
  try {
    course = await getCourseAuthorship(courseId);
  } catch (err) {
    const reason = reportTeacherWriteError("teacher-course-load", err, {
      route: "/api/teacher/courses/[id]",
      courseId,
    });
    return NextResponse.json(
      { error: "Failed to load course", reason },
      { status: 500 }
    );
  }
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  const isOwner = course.author === auth.caller.userId;
  const isAdmin = auth.caller.role === "admin";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await patchTeacherCourse(courseId, validated.value);
  } catch (err) {
    const reason = reportTeacherWriteError("teacher-course-update", err, {
      route: "/api/teacher/courses/[id]",
      courseId,
      userId: auth.caller.userId,
    });
    return NextResponse.json(
      { error: "Failed to update course", reason },
      { status: 500 }
    );
  }

  return NextResponse.json({ _id: courseId, updated: true });
}
