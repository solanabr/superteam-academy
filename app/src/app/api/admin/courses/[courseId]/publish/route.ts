import { NextResponse } from "next/server";
import { getSanityWriteClient } from "@/lib/sanity/write-client";
import { adminCourseDetailQuery } from "@/lib/sanity/admin-queries";
import { isAdminRequest } from "@/lib/auth/admin";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  try {
    const { courseId } = await params;
    const body = await req.json();
    if (!(await isAdminRequest(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { published } = body as {
      published?: boolean;
    };

    if (typeof published !== "boolean") {
      return NextResponse.json(
        { error: "Missing required field: published (boolean)" },
        { status: 400 },
      );
    }

    const sanity = getSanityWriteClient();

    // If publishing, validate course has required fields
    if (published) {
      const course = await sanity.fetch(adminCourseDetailQuery, { id: courseId });
      if (!course) {
        return NextResponse.json(
          { error: "Course not found" },
          { status: 404 },
        );
      }

      const errors: string[] = [];
      if (!course.title) errors.push("Course must have a title");
      if (!course.description) errors.push("Course must have a description");
      if (!course.modules || course.modules.length === 0)
        errors.push("Course must have at least one module");

      const hasLessons = course.modules?.some(
        (m: { lessons?: unknown[] }) => m.lessons && m.lessons.length > 0,
      );
      if (!hasLessons)
        errors.push("Course must have at least one lesson in a module");

      if (errors.length > 0) {
        return NextResponse.json(
          { error: "Validation failed", details: errors },
          { status: 422 },
        );
      }
    }

    const result = await sanity.patch(courseId).set({ published }).commit();

    return NextResponse.json({
      success: true,
      published: result.published,
      _id: result._id,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to toggle publish";
    console.error("publish error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
