import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isAdminRequest } from "@/lib/auth/admin";

/** POST /api/admin/modules — Create a module in Supabase */
export async function POST(req: Request) {
  try {
    if (!(await isAdminRequest(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { courseId, title, description, order } = body as {
      courseId?: string;
      title?: string;
      description?: string;
      order?: number;
    };

    if (!courseId || !title) {
      return NextResponse.json(
        { error: "Missing required fields: courseId, title" },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("modules")
      .insert({
        course_id: courseId,
        title,
        description: description ?? "",
        order: order ?? 0,
      })
      .select()
      .single();

    if (error) {
      console.error("create-module supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      module: {
        _id: data.id,
        title: data.title,
        description: data.description,
        order: data.order,
      },
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to create module";
    console.error("create-module error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
