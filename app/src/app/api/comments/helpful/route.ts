import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

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
    const { commentId } = body;

    if (!commentId) {
      return NextResponse.json(
        { error: "commentId is required" },
        { status: 400 },
      );
    }

    // Get the comment to find the author
    const { data: comment, error: fetchError } = await supabaseAdmin
      .from("comments")
      .select("user_id")
      .eq("id", commentId)
      .single();

    if (fetchError || !comment) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 },
      );
    }

    // Can't mark own comment as helpful
    if (comment.user_id === user.id) {
      return NextResponse.json(
        { error: "Cannot mark your own comment as helpful" },
        { status: 400 },
      );
    }

    // Insert community help record
    const { error: helpError } = await supabaseAdmin
      .from("community_help")
      .insert({
        helper_id: comment.user_id,
        helped_user_id: user.id,
        comment_id: commentId,
      });

    if (helpError) {
      if (helpError.code === "23505") {
        return NextResponse.json({ alreadyMarked: true });
      }
      console.error("[Helpful POST] Error:", helpError.message);
      return NextResponse.json(
        { error: "Failed to mark as helpful" },
        { status: 500 },
      );
    }

    // Mark comment as helpful
    await supabaseAdmin
      .from("comments")
      .update({ is_helpful: true })
      .eq("id", commentId);

    // Check if this is the helper's first time being marked helpful
    const { count } = await supabaseAdmin
      .from("community_help")
      .select("id", { count: "exact", head: true })
      .eq("helper_id", comment.user_id);

    let achievementAwarded: string | null = null;

    if (count === 1) {
      // First help — award "helper" achievement to the comment author
      const { error: achError } = await supabaseAdmin
        .from("user_achievements")
        .insert({
          user_id: comment.user_id,
          achievement_id: "helper",
        });

      if (!achError) {
        achievementAwarded = "helper";

        // Log activity for the helper
        await supabaseAdmin.from("activities").insert({
          user_id: comment.user_id,
          type: "achievement_earned",
          title: "Helper",
          description: "Helped another learner in the community",
          xp: 25,
        });
      }
    }

    // Log activity for the person who marked it helpful
    await supabaseAdmin.from("activities").insert({
      user_id: user.id,
      type: "helped_learner",
      title: "Marked a comment as helpful",
      description: "Found a community answer helpful",
      xp: 0,
    });

    return NextResponse.json({
      success: true,
      achievementAwarded,
    });
  } catch (err) {
    console.error("[Helpful POST] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
