import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 50);

    if (!q || q.trim().length < 2) {
      return NextResponse.json({ threads: [] });
    }

    const supabase = await createClient();

    // Get current user (optional, for vote status)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: threads, error } = await supabase
      .from("threads")
      .select(
        `
        *,
        author:profiles!author_id(username, avatar_url),
        category:forum_categories!category_id(id, name, slug)
      `
      )
      .textSearch("search_vector", q, { type: "plain" })
      .is("deleted_at", null)
      .order("last_activity_at", { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: "Search failed" }, { status: 500 });
    }

    // Fetch user's votes on these threads (if authenticated)
    let userVotes: Record<string, number> = {};
    if (user && threads && threads.length > 0) {
      const threadIds = threads.map((t: { id: string }) => t.id);
      const { data: votes } = await supabase
        .from("votes")
        .select("thread_id, value")
        .eq("user_id", user.id)
        .in("thread_id", threadIds);
      if (votes) {
        userVotes = Object.fromEntries(
          votes.map((v) => [v.thread_id ?? "", v.value])
        );
      }
    }

    // Fetch author levels
    const authorIds = [
      ...new Set(
        (threads || []).map((t: { author_id: string }) => t.author_id)
      ),
    ];
    let authorLevels: Record<string, number> = {};
    if (authorIds.length > 0) {
      const { data: xpData } = await supabase
        .from("user_xp")
        .select("user_id, level")
        .in("user_id", authorIds);
      if (xpData) {
        authorLevels = Object.fromEntries(
          xpData.map((x) => [x.user_id ?? "", x.level ?? 0])
        );
      }
    }

    // Build response with enriched author data and user votes
    const result = (threads || []).map((t: Record<string, unknown>) => ({
      ...t,
      author: {
        ...(t.author as Record<string, unknown>),
        level: authorLevels[t.author_id as string] || 0,
      },
      userVote: userVotes[t.id as string] || null,
    }));

    return NextResponse.json({ threads: result });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
