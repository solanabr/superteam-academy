import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { requireCourseAuthor } from "@/lib/auth/roles";
import {
  listCoursesByAuthor,
  createDraftCourse,
  parseCourseMeta,
} from "@/lib/sanity/teacher-mutations";

/**
 * Teacher-scoped course collection.
 *   GET  → the caller's own courses
 *   POST → create a new draft course owned by the caller
 *
 * The Sanity write token stays server-side; role is enforced here (and again on
 * writes). New courses are always `author = caller`, `authoringStatus = draft`.
 */

export async function GET(): Promise<NextResponse> {
  const authed = await requireCourseAuthor();
  if (authed instanceof NextResponse) return authed;

  const courses = await listCoursesByAuthor(authed.userId);
  return NextResponse.json({ courses });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const authed = await requireCourseAuthor();
  if (authed instanceof NextResponse) return authed;

  let meta;
  try {
    meta = parseCourseMeta(await req.json());
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Invalid input" },
      { status: 400 }
    );
  }

  const id = await createDraftCourse(authed.userId, meta);
  return NextResponse.json({ id }, { status: 201 });
}
