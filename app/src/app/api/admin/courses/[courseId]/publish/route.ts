import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
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

    const { published } = body as { published?: boolean };

    if (typeof published !== "boolean") {
      return NextResponse.json(
        { error: "Missing required field: published (boolean)" },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdmin();

    // If publishing, validate course has required fields
    if (published) {
      const { data: course, error: fetchErr } = await supabase
        .from("courses")
        .select("id, title, description")
        .eq("id", courseId)
        .single();

      if (fetchErr || !course) {
        return NextResponse.json(
          { error: "Course not found" },
          { status: 404 },
        );
      }

      const errors: string[] = [];
      if (!course.title) errors.push("Course must have a title");
      if (!course.description) errors.push("Course must have a description");

      const { data: modules } = await supabase
        .from("modules")
        .select("id")
        .eq("course_id", courseId);

      if (!modules || modules.length === 0) {
        errors.push("Course must have at least one module");
      } else {
        const moduleIds = modules.map((m) => m.id);
        const { count } = await supabase
          .from("lessons")
          .select("id", { count: "exact", head: true })
          .in("module_id", moduleIds);

        if (!count || count === 0) {
          errors.push("Course must have at least one lesson");
        }
      }

      if (errors.length > 0) {
        return NextResponse.json(
          { error: "Validation failed", details: errors },
          { status: 422 },
        );
      }
    }

    const { error: updateErr } = await supabase
      .from("courses")
      .update({ published })
      .eq("id", courseId);

    if (updateErr) throw updateErr;

    return NextResponse.json({
      success: true,
      published,
      _id: courseId,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to toggle publish";
    console.error("publish error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
