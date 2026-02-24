import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isAdminRequest } from "@/lib/auth/admin";

/** PATCH /api/admin/modules/[id] — Update module fields */
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
    const { title, description, order } = body as {
      title?: string;
      description?: string;
      order?: number;
    };

    const updates: Record<string, unknown> = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (order !== undefined) updates.order = order;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("modules")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("update-module supabase error:", error);
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
      err instanceof Error ? err.message : "Failed to update module";
    console.error("update-module error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** DELETE /api/admin/modules/[id] — Delete module (lessons cascade via FK) */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!(await isAdminRequest(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("modules").delete().eq("id", id);

    if (error) {
      console.error("delete-module supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to delete module";
    console.error("delete-module error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
