import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { requireCourseAuthor } from "@/lib/auth/roles";
import {
  getCourseOwnership,
  patchCourseMeta,
  setAuthoringStatus,
  parseCourseMeta,
} from "@/lib/sanity/teacher-mutations";

/**
 * Update a single teacher-owned course.
 *   PATCH → whitelisted metadata and/or a status transition
 *
 * Ownership is enforced against the course's `author`: teachers may only touch
 * their own courses; admins may touch any. Teachers can move the status to
 * `draft` or `pending_review` (submit for review) — never `approved`, which is
 * admin-only (the review flow, #268). `author`/`onChainStatus` are never
 * writable here.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const authed = await requireCourseAuthor();
  if (authed instanceof NextResponse) return authed;

  const { id } = await params;
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Invalid course id" }, { status: 400 });
  }

  const ownership = await getCourseOwnership(id);
  if (!ownership) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }
  if (authed.role !== "admin" && ownership.author !== authed.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Optional status transition — teachers may only submit for review.
  let nextStatus: "draft" | "pending_review" | undefined;
  if (body.authoringStatus !== undefined) {
    if (
      body.authoringStatus !== "draft" &&
      body.authoringStatus !== "pending_review"
    ) {
      return NextResponse.json(
        { error: "authoringStatus may only be set to draft or pending_review" },
        { status: 400 }
      );
    }
    nextStatus = body.authoringStatus;
  }

  let meta;
  try {
    meta = parseCourseMeta(body);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Invalid input" },
      { status: 400 }
    );
  }

  await patchCourseMeta(id, meta);
  if (nextStatus) await setAuthoringStatus(id, nextStatus);

  return NextResponse.json({ id, ...(nextStatus ? { authoringStatus: nextStatus } : {}) });
}
