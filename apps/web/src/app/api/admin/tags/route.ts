import "server-only";

import { NextRequest, NextResponse } from "next/server";
import {
  requireAdminAuth,
  adminUnauthorizedResponse,
  AdminAuthError,
} from "@/lib/admin/auth";
import { getManagedCourseTags } from "@/lib/sanity/queries";
import { createCourseTag, deleteCourseTag } from "@/lib/sanity/admin-mutations";

// Reads the admin cookie + writes to Sanity — never statically prerender.
export const dynamic = "force-dynamic";

const MAX_TAG_LENGTH = 40;

function guard(req: NextRequest): NextResponse | null {
  try {
    requireAdminAuth(req);
    return null;
  } catch (e) {
    if (e instanceof AdminAuthError) return adminUnauthorizedResponse();
    throw e;
  }
}

/** GET — list the managed course-tag vocabulary. */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const denied = guard(req);
  if (denied) return denied;
  const tags = await getManagedCourseTags();
  return NextResponse.json({ tags });
}

/** POST { name } — add a tag (case-insensitive de-dupe). */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const denied = guard(req);
  if (denied) return denied;

  let name: string;
  try {
    const body = (await req.json()) as { name?: unknown };
    if (
      typeof body.name !== "string" ||
      body.name.trim().length === 0 ||
      body.name.trim().length > MAX_TAG_LENGTH
    ) {
      return NextResponse.json(
        { error: `name is required (1–${MAX_TAG_LENGTH} chars)` },
        { status: 400 }
      );
    }
    name = body.name.trim();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const existing = await getManagedCourseTags();
  if (existing.some((t) => t.name.toLowerCase() === name.toLowerCase())) {
    return NextResponse.json(
      { error: "That tag already exists" },
      { status: 409 }
    );
  }

  try {
    const tag = await createCourseTag(name);
    return NextResponse.json({ tag }, { status: 201 });
  } catch (err) {
    console.error("[admin/tags] create failed:", err);
    return NextResponse.json({ error: "Failed to add tag" }, { status: 500 });
  }
}

/** DELETE { id } — remove a tag from the vocabulary. */
export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const denied = guard(req);
  if (denied) return denied;

  let id: string;
  try {
    const body = (await req.json()) as { id?: unknown };
    if (typeof body.id !== "string" || body.id.length === 0) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    id = body.id;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    await deleteCourseTag(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[admin/tags] delete failed:", err);
    return NextResponse.json(
      { error: "Failed to remove tag" },
      { status: 500 }
    );
  }
}
