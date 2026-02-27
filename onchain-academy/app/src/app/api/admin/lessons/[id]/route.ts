import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isAdminRequest } from "@/lib/auth/admin";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** PATCH /api/admin/lessons/[id] — Update lesson fields */
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
    const {
      title,
      type,
      markdownContent,
      xpReward,
      estimatedMinutes,
      order,
      challenge,
    } = body as {
      title?: string;
      type?: string;
      markdownContent?: string;
      xpReward?: number;
      estimatedMinutes?: number;
      order?: number;
      challenge?: {
        instructions?: string;
        starterCode?: string;
        solution?: string;
        language?: string;
      };
    };

    const updates: Record<string, unknown> = {};

    if (title !== undefined) {
      updates.title = title;
      updates.slug = slugify(title);
    }
    if (type !== undefined) updates.type = type;
    if (markdownContent !== undefined) updates.content = markdownContent;
    if (xpReward !== undefined) updates.xp_reward = xpReward;
    if (estimatedMinutes !== undefined)
      updates.estimated_minutes = estimatedMinutes;
    if (order !== undefined) updates.order = order;
    if (challenge !== undefined) {
      updates.challenge_instructions = challenge.instructions ?? null;
      updates.challenge_starter_code = challenge.starterCode ?? null;
      updates.challenge_solution = challenge.solution ?? null;
      updates.challenge_language = challenge.language ?? null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("lessons")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("update-lesson supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      lesson: {
        _id: data.id,
        title: data.title,
        type: data.type,
      },
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to update lesson";
    console.error("update-lesson error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** DELETE /api/admin/lessons/[id] — Delete lesson */
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
    const { error } = await supabase.from("lessons").delete().eq("id", id);

    if (error) {
      console.error("delete-lesson supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to delete lesson";
    console.error("delete-lesson error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
