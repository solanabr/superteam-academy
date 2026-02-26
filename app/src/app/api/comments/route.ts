import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get("courseId");
  const lessonIndex = searchParams.get("lessonIndex");

  if (!courseId || lessonIndex === null) {
    return NextResponse.json(
      { error: "courseId and lessonIndex are required" },
      { status: 400 },
    );
  }

  const { data, error } = await supabaseAdmin
    .from("comments")
    .select("*")
    .eq("course_id", courseId)
    .eq("lesson_index", Number(lessonIndex))
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[Comments GET] Error:", error.message);
    return NextResponse.json({ comments: [] });
  }

  const comments = data ?? [];
  const userIds = [...new Set(comments.map((c) => c.user_id))];

  const profileMap: Record<string, { username: string; display_name: string; avatar_url: string | null }> = {};
  if (userIds.length > 0) {
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .in("id", userIds);

    for (const p of profiles ?? []) {
      profileMap[p.id] = p;
    }
  }

  const enriched = comments.map((c) => ({
    ...c,
    profiles: profileMap[c.user_id] ?? null,
  }));

  return NextResponse.json({ comments: enriched });
}

export async function POST(request: NextRequest) {
  try {
    const supabaseServer = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabaseServer.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { courseId, lessonIndex, content, parentId } = body;

    if (!courseId || lessonIndex === undefined || !content?.trim()) {
      return NextResponse.json(
        { error: "courseId, lessonIndex, and content are required" },
        { status: 400 },
      );
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { error: "Comment must be 2000 characters or less" },
        { status: 400 },
      );
    }

    // Create the comment
    const { data: comment, error } = await supabaseAdmin
      .from("comments")
      .insert({
        user_id: user.id,
        course_id: courseId,
        lesson_index: Number(lessonIndex),
        parent_id: parentId ?? null,
        content: content.trim(),
      })
      .select("*")
      .single();

    if (error) {
      console.error("[Comments POST] Error:", error.message);
      return NextResponse.json(
        { error: "Failed to create comment" },
        { status: 500 },
      );
    }

    // Check for first-comment achievement
    const { count } = await supabaseAdmin
      .from("comments")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    let achievementAwarded: string | null = null;

    if (count === 1) {
      // First comment — award achievement
      const { error: achError } = await supabaseAdmin
        .from("user_achievements")
        .insert({
          user_id: user.id,
          achievement_id: "first-comment",
        });

      if (!achError) {
        achievementAwarded = "first-comment";

        // Log activity
        await supabaseAdmin.from("activities").insert({
          user_id: user.id,
          type: "achievement_earned",
          title: "First Comment",
          description: "Left your first comment on a lesson",
          xp: 10,
        });
      }
    }

    // Log comment activity
    await supabaseAdmin.from("activities").insert({
      user_id: user.id,
      type: "comment_posted",
      title: "Posted a comment",
      description: `Commented on a lesson`,
      xp: 0,
      course_id: courseId,
      lesson_index: Number(lessonIndex),
    });

    return NextResponse.json({
      comment,
      achievementAwarded,
    });
  } catch (err) {
    console.error("[Comments POST] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabaseServer = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabaseServer.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get("id");

    if (!commentId) {
      return NextResponse.json(
        { error: "Comment id is required" },
        { status: 400 },
      );
    }

    const { error } = await supabaseAdmin
      .from("comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", user.id);

    if (error) {
      console.error("[Comments DELETE] Error:", error.message);
      return NextResponse.json(
        { error: "Failed to delete comment" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Comments DELETE] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
