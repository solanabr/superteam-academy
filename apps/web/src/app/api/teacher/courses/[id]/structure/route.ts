import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { authorizeTeacher } from "@/lib/teacher/authorize";
import { getCourseAuthorship } from "@/lib/sanity/teacher-mutations";
import {
  getCourseStructure,
  applyCourseStructure,
} from "@/lib/sanity/teacher-structure";
import { validateStructure } from "@/lib/teacher/validate-structure";

export const dynamic = "force-dynamic";

const MAX_COURSE_ID_LEN = 256;

/**
 * Course body (modules + lessons) for a single teacher-owned course.
 *   GET → the current tree, for the builder to load
 *   PUT → reconcile the whole tree (create/patch/delete docs + ordered refs)
 *
 * Both authorize on the PARENT course's `author` (teacher owns it, or admin).
 * The Sanity write token never leaves the server.
 */

async function authorizeForCourse(courseId: string): Promise<
  | { ok: true }
  | { ok: false; res: NextResponse }
> {
  const auth = await authorizeTeacher();
  if (!auth.ok) {
    return {
      ok: false,
      res: NextResponse.json(
        { error: auth.status === 401 ? "Unauthorized" : "Forbidden" },
        { status: auth.status }
      ),
    };
  }
  if (
    typeof courseId !== "string" ||
    !courseId ||
    courseId.length > MAX_COURSE_ID_LEN
  ) {
    return {
      ok: false,
      res: NextResponse.json({ error: "Invalid course id" }, { status: 400 }),
    };
  }
  const course = await getCourseAuthorship(courseId);
  if (!course) {
    return {
      ok: false,
      res: NextResponse.json({ error: "Course not found" }, { status: 404 }),
    };
  }
  if (auth.caller.role !== "admin" && course.author !== auth.caller.userId) {
    return {
      ok: false,
      res: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { ok: true };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;
  const gate = await authorizeForCourse(id);
  if (!gate.ok) return gate.res;

  const modules = await getCourseStructure(id);
  return NextResponse.json({ modules });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;
  const gate = await authorizeForCourse(id);
  if (!gate.ok) return gate.res;

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const validated = validateStructure(raw);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  try {
    await applyCourseStructure(id, validated.value);
  } catch {
    return NextResponse.json(
      { error: "Failed to save course structure" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
