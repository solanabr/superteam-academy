import { NextResponse } from "next/server";
import { getSanityWriteClient } from "@/lib/sanity/write-client";
import { adminCourseDetailQuery } from "@/lib/sanity/admin-queries";
import { isAdminRequest } from "@/lib/auth/admin";

/** GET /api/admin/sanity-courses/[id] — Fetch single course with modules/lessons */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!(await isAdminRequest(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const sanity = getSanityWriteClient();
    const course = await sanity.fetch(adminCourseDetailQuery, { id });

    if (!course) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ course });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch course";
    console.error("admin sanity-course GET error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** PATCH /api/admin/sanity-courses/[id] — Update course fields */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!(await isAdminRequest(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const fields = body as {
      title?: string;
      description?: string;
      longDescription?: string;
      track?: string;
      difficulty?: string;
      xpReward?: number;
      estimatedHours?: number;
      learningOutcomes?: string[];
    };

    const sanity = getSanityWriteClient();
    const updates: Record<string, unknown> = {};

    if (fields.title !== undefined) {
      updates.title = fields.title;
      updates.slug = {
        _type: "slug",
        current: fields.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, ""),
      };
    }
    if (fields.description !== undefined)
      updates.description = fields.description;
    if (fields.longDescription !== undefined)
      updates.longDescription = fields.longDescription;
    if (fields.track !== undefined) updates.track = fields.track;
    if (fields.difficulty !== undefined) updates.difficulty = fields.difficulty;
    if (fields.xpReward !== undefined) updates.xpReward = fields.xpReward;
    if (fields.estimatedHours !== undefined)
      updates.estimatedHours = fields.estimatedHours;
    if (fields.learningOutcomes !== undefined)
      updates.learningOutcomes = fields.learningOutcomes;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 },
      );
    }

    await sanity.patch(id).set(updates).commit();

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to update course";
    console.error("admin sanity-course PATCH error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
