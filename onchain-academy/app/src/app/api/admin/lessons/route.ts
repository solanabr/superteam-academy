import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isAdminRequest } from "@/lib/auth/admin";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** POST /api/admin/lessons — Create a lesson in Supabase */
export async function POST(req: Request) {
  try {
    if (!(await isAdminRequest(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const {
      moduleId,
      title,
      type,
      markdownContent,
      xpReward,
      estimatedMinutes,
      order,
      challenge,
    } = body as {
      moduleId?: string;
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

    if (!moduleId || !title || !type) {
      return NextResponse.json(
        { error: "Missing required fields: moduleId, title, type" },
        { status: 400 },
      );
    }

    const slug = slugify(title);

    const insertData: Record<string, unknown> = {
      module_id: moduleId,
      title,
      slug,
      type,
      content: markdownContent ?? "",
      xp_reward: xpReward ?? 25,
      estimated_minutes: estimatedMinutes ?? 10,
      order: order ?? 0,
    };

    if (type === "challenge" && challenge) {
      insertData.challenge_instructions = challenge.instructions ?? "";
      insertData.challenge_starter_code = challenge.starterCode ?? "";
      insertData.challenge_solution = challenge.solution ?? "";
      insertData.challenge_language = challenge.language ?? "typescript";
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("lessons")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("create-lesson supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      lesson: {
        _id: data.id,
        title: data.title,
        slug: data.slug,
        type: data.type,
        xpReward: data.xp_reward,
        order: data.order,
      },
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to create lesson";
    console.error("create-lesson error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
