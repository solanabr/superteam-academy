// apps/web/src/app/api/community/threads/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categorySlug = searchParams.get("category");
    const courseId = searchParams.get("courseId");
    const lessonId = searchParams.get("lessonId");
    const sort = searchParams.get("sort") || "latest";
    const type = searchParams.get("type"); // 'question' | 'discussion' | null
    const cursor = searchParams.get("cursor"); // 'timestamp|uuid'
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 50);

    const supabase = await createClient();

    // Get current user (optional, for vote status)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Base query
    let query = supabase
      .from("threads")
      .select(
        `
        *,
        author:profiles!author_id(username, avatar_url),
        category:forum_categories!category_id(id, name, slug)
      `
      )
      .limit(limit);

    // Scope filters
    if (categorySlug) {
      const { data: cat } = await supabase
        .from("forum_categories")
        .select("id")
        .eq("slug", categorySlug)
        .single();
      if (!cat) {
        return NextResponse.json(
          { error: "Category not found" },
          { status: 404 }
        );
      }
      query = query.eq("category_id", cat.id);
    }
    if (courseId) query = query.eq("course_id", courseId);
    if (lessonId) query = query.eq("lesson_id", lessonId);
    if (type) query = query.eq("type", type);

    // Sort
    if (sort === "latest") {
      query = query
        .order("is_pinned", { ascending: false })
        .order("last_activity_at", { ascending: false })
        .order("id", { ascending: false });
    } else if (sort === "top") {
      query = query
        .order("vote_score", { ascending: false })
        .order("id", { ascending: false });
    } else if (sort === "unanswered") {
      query = query
        .eq("type", "question")
        .eq("is_solved", false)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false });
    }

    // Cursor-based pagination (last_activity_at|id for 'latest' sort)
    if (cursor) {
      const [ts, id] = cursor.split("|");
      if (ts && id) {
        if (sort === "latest") {
          query = query.or(
            `last_activity_at.lt.${ts},and(last_activity_at.eq.${ts},id.lt.${id})`
          );
        } else if (sort === "top") {
          query = query.or(
            `vote_score.lt.${ts},and(vote_score.eq.${ts},id.lt.${id})`
          );
        } else {
          query = query.or(
            `created_at.lt.${ts},and(created_at.eq.${ts},id.lt.${id})`
          );
        }
      }
    }

    const { data: threads, error } = await query;
    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch threads" },
        { status: 500 }
      );
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
          votes.map((v: { thread_id: string; value: number }) => [
            v.thread_id,
            v.value,
          ])
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
          xpData.map((x: { user_id: string; level: number }) => [
            x.user_id,
            x.level,
          ])
        );
      }
    }

    // Build response
    const result = (threads || []).map((t: Record<string, unknown>) => ({
      ...t,
      author: {
        ...(t.author as Record<string, unknown>),
        level: authorLevels[t.author_id as string] || 0,
      },
      userVote: userVotes[t.id as string] || null,
    }));

    // Build next cursor
    const lastThread = threads?.[threads.length - 1];
    const nextCursor =
      lastThread && threads?.length === limit
        ? `${sort === "top" ? lastThread.vote_score : sort === "unanswered" ? lastThread.created_at : lastThread.last_activity_at}|${lastThread.id}`
        : null;

    return NextResponse.json({ threads: result, nextCursor });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, body: content, type, categoryId, courseId, lessonId } = body;

    // Validate
    if (
      !title ||
      typeof title !== "string" ||
      title.length < 5 ||
      title.length > 200
    ) {
      return NextResponse.json(
        { error: "Title must be 5-200 characters" },
        { status: 400 }
      );
    }
    if (
      !content ||
      typeof content !== "string" ||
      content.length < 10 ||
      content.length > 10000
    ) {
      return NextResponse.json(
        { error: "Body must be 10-10000 characters" },
        { status: 400 }
      );
    }
    if (!type || !["question", "discussion"].includes(type)) {
      return NextResponse.json(
        { error: "Type must be question or discussion" },
        { status: 400 }
      );
    }
    // Global threads must have a category
    if (!courseId && !categoryId) {
      return NextResponse.json(
        { error: "Global threads require a category" },
        { status: 400 }
      );
    }

    // Generate slug base from title (cosmetic only — short_id resolves the thread)
    const slugBase = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 70); // Leave room for -{short_id} suffix

    // Atomic insert + slug update via SECURITY DEFINER function
    const admin = createAdminClient();
    const { data: thread, error } = await admin
      .rpc("create_thread", {
        p_author_id: user.id,
        p_title: title,
        p_body: content,
        p_type: type,
        p_category_id: categoryId || null,
        p_course_id: courseId || null,
        p_lesson_id: lessonId || null,
        p_slug_base: slugBase,
      })
      .single();

    if (error || !thread) {
      return NextResponse.json(
        { error: "Failed to create thread" },
        { status: 500 }
      );
    }

    // Award community XP (5 XP for creating thread)
    await admin.rpc("award_community_xp", {
      p_user_id: user.id,
      p_amount: 5,
      p_reason: "community:thread_created",
      p_idempotency_key: `thread:${thread.id}`,
    });

    return NextResponse.json(thread, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
