import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { authorizeTeacher } from "@/lib/teacher/authorize";
import {
  getCourseAuthorship,
  uploadCourseThumbnail,
} from "@/lib/sanity/teacher-mutations";
import { reportTeacherWriteError } from "@/lib/teacher/errors";
import {
  validateThumbnail,
  thumbnailRejectionMessage,
} from "@/lib/teacher/thumbnail";

export const dynamic = "force-dynamic";

const MAX_COURSE_ID_LEN = 256;

/**
 * POST /api/teacher/courses/[id]/thumbnail — upload a thumbnail for a course the
 * caller owns (issue #278).
 *
 * Mediated upload: teachers have no Sanity login and the browser never holds the
 * Sanity write token. The image is sent here as `multipart/form-data` (field
 * `file`); the server authorizes, validates the bytes, streams them into Sanity
 * via the server-only admin client, and patches the course `thumbnail` through
 * the single-sourced field whitelist (`uploadCourseThumbnail` → `patchTeacherCourse`).
 *
 * Authorization (all server-side), identical to the sibling teacher routes:
 *   1. Authenticated + role in (teacher, admin) — else 401/403.
 *   2. Course's `author` must equal the caller (or caller is admin) — else 403.
 *
 * Validation: content-type must be `image/*` (else 400) and the ACTUAL byte
 * length must be within the cap (else 413). The size is measured on the received
 * bytes, never a client-supplied header.
 */
export async function POST(
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

  // --- Read the uploaded file (multipart/form-data, field `file`) ---
  let file: File | null;
  try {
    const form = await req.formData();
    const entry = form.get("file");
    file = entry instanceof File ? entry : null;
  } catch {
    return NextResponse.json(
      { error: "Expected multipart/form-data with a file field" },
      { status: 400 }
    );
  }
  if (!file) {
    return NextResponse.json(
      { error: "No image was provided" },
      { status: 400 }
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  // Validate against the ACTUAL bytes, not any client-supplied header.
  const check = validateThumbnail(file.type, bytes.byteLength);
  if (!check.ok) {
    return NextResponse.json(
      { error: thumbnailRejectionMessage(check.error) },
      { status: check.error.status }
    );
  }

  // --- Ownership check (the security core) ---
  let course;
  try {
    course = await getCourseAuthorship(courseId);
  } catch (err) {
    const reason = reportTeacherWriteError("teacher-thumbnail-load", err, {
      route: "/api/teacher/courses/[id]/thumbnail",
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

  const filename =
    typeof file.name === "string" && file.name.length > 0
      ? file.name
      : "thumbnail";

  try {
    const uploaded = await uploadCourseThumbnail(courseId, bytes, {
      filename,
      contentType: check.contentType,
    });
    return NextResponse.json(uploaded);
  } catch (err) {
    const reason = reportTeacherWriteError("teacher-thumbnail-upload", err, {
      route: "/api/teacher/courses/[id]/thumbnail",
      courseId,
      userId: auth.caller.userId,
    });
    return NextResponse.json(
      { error: "Failed to upload thumbnail", reason },
      { status: 500 }
    );
  }
}
