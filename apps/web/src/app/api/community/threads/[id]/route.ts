import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logError } from "@/lib/logging";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: shortId } = await params;
    if (!shortId || shortId.length < 8) {
      return NextResponse.json({ error: "Invalid thread ID" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Find thread by short_id
    const { data: thread, error } = await supabase
      .from("threads")
      .select(
        `
        *,
        author:profiles!author_id(username, avatar_url),
        category:forum_categories!category_id(id, name, slug)
      `
      )
      .eq("short_id", shortId)
      .is("deleted_at", null)
      .single();

    if (error || !thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    // Fetch answers sorted: accepted first, then by vote_score desc
    const { data: answers } = await supabase
      .from("answers")
      .select(
        `
        *,
        author:profiles!author_id(username, avatar_url)
      `
      )
      .eq("thread_id", thread.id)
      .is("deleted_at", null)
      .order("is_accepted", { ascending: false })
      .order("vote_score", { ascending: false })
      .order("created_at", { ascending: true });

    // Fetch author levels for thread + all answers
    const allAuthorIds = [
      thread.author_id,
      ...(answers || []).map((a: { author_id: string }) => a.author_id),
    ];
    const uniqueAuthorIds = [...new Set(allAuthorIds)];
    const { data: xpData } = await supabase
      .from("user_xp")
      .select("user_id, level")
      .in("user_id", uniqueAuthorIds);
    const authorLevels: Record<string, number> = Object.fromEntries(
      (xpData || []).map((x) => [x.user_id ?? "", x.level ?? 0])
    );

    // Fetch user's votes (if authenticated)
    let userThreadVote = null;
    let userAnswerVotes: Record<string, number> = {};
    if (user) {
      const { data: threadVote } = await supabase
        .from("votes")
        .select("value")
        .eq("user_id", user.id)
        .eq("thread_id", thread.id)
        .maybeSingle();
      userThreadVote = threadVote?.value || null;

      if (answers && answers.length > 0) {
        const answerIds = answers.map((a: { id: string }) => a.id);
        const { data: answerVotes } = await supabase
          .from("votes")
          .select("answer_id, value")
          .eq("user_id", user.id)
          .in("answer_id", answerIds);
        if (answerVotes) {
          userAnswerVotes = Object.fromEntries(
            answerVotes.map((v) => [v.answer_id ?? "", v.value])
          );
        }
      }
    }

    // Increment view count (fire-and-forget via admin client)
    if (
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      const admin = createAdminClient();
      admin
        .rpc("increment_view_count", {
          p_thread_id: thread.id,
          p_user_id: user?.id,
        })
        .then(null, (err: Error) =>
          console.error("[threads] view count increment failed:", err.message)
        );
    }

    // Build response
    const result = {
      ...thread,
      author: {
        ...(thread.author as Record<string, unknown>),
        level: authorLevels[thread.author_id] || 0,
      },
      userVote: userThreadVote,
      answers: (answers || []).map((a: Record<string, unknown>) => ({
        ...a,
        author: {
          ...(a.author as Record<string, unknown>),
          level: authorLevels[a.author_id as string] || 0,
        },
        userVote: userAnswerVotes[a.id as string] || null,
      })),
    };

    return NextResponse.json(result);
  } catch (err) {
    logError({
      errorId: "thread-detail",
      error: err instanceof Error ? err : new Error(String(err)),
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
