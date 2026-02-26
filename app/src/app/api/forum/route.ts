import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sanityClient } from "@/lib/sanity/client";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

interface CommentRow {
  id: string;
  user_id: string;
  course_id: string | null;
  lesson_index: number | null;
  title: string | null;
  parent_id: string | null;
  content: string;
  is_helpful: boolean;
  created_at: string;
  updated_at: string;
}

interface ProfileRow {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

/**
 * GET /api/forum
 * Fetches all top-level forum posts (standalone + lesson comments).
 * Query params: type=all|forum|lesson, courseId, limit, offset
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "all";
  const courseId = searchParams.get("courseId");
  const limit = Math.min(Number(searchParams.get("limit") ?? 50), 100);
  const offset = Number(searchParams.get("offset") ?? 0);

  let query = supabaseAdmin
    .from("comments")
    .select("*")
    .is("parent_id", null)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (type === "forum") {
    query = query.is("course_id", null);
  } else if (type === "lesson" || courseId) {
    query = query.not("course_id", "is", null);
    if (courseId) {
      query = query.eq("course_id", courseId);
    }
  }

  const { data, error } = await query;

  if (error) {
    console.error("[Forum GET] Error:", error.message);
    return NextResponse.json({ posts: [] });
  }

  const posts = (data ?? []) as CommentRow[];
  const userIds = [...new Set(posts.map((p) => p.user_id))];

  const profileMap: Record<string, ProfileRow> = {};
  if (userIds.length > 0) {
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .in("id", userIds);

    for (const p of (profiles ?? []) as ProfileRow[]) {
      profileMap[p.id] = p;
    }
  }

  // Get reply counts for each post
  const postIds = posts.map((p) => p.id);
  const replyCounts: Record<string, number> = {};
  if (postIds.length > 0) {
    const { data: replies } = await supabaseAdmin
      .from("comments")
      .select("parent_id")
      .in("parent_id", postIds);

    for (const r of replies ?? []) {
      const pid = (r as { parent_id: string }).parent_id;
      replyCounts[pid] = (replyCounts[pid] ?? 0) + 1;
    }
  }

  // Fetch course info from Sanity for lesson-linked posts
  const courseIds = [...new Set(posts.filter((p) => p.course_id).map((p) => p.course_id!))];
  const courseMap: Record<string, { title: string; slug: string; lessons: { index: number; title: string }[] }> = {};
  if (courseIds.length > 0) {
    try {
      const courses = await sanityClient.fetch<
        { courseId: string; title: string; slug: string; modules: { lessons: { title: string }[] }[] }[]
      >(
        `*[_type == "course" && courseId in $courseIds] { courseId, title, "slug": slug.current, "modules": modules[]{ "lessons": lessons[]{ title } } }`,
        { courseIds },
      );
      for (const c of courses) {
        const flatLessons: { index: number; title: string }[] = [];
        let idx = 0;
        for (const m of c.modules ?? []) {
          for (const l of m.lessons ?? []) {
            flatLessons.push({ index: idx, title: l.title });
            idx++;
          }
        }
        courseMap[c.courseId] = { title: c.title, slug: c.slug, lessons: flatLessons };
      }
    } catch (sanityErr) {
      console.error("[Forum GET] Sanity fetch error:", sanityErr);
    }
  }

  const enriched = posts.map((p) => {
    const course = p.course_id ? courseMap[p.course_id] : null;
    const lessonInfo = course && p.lesson_index != null
      ? course.lessons.find((l) => l.index === p.lesson_index)
      : null;

    return {
      id: p.id,
      userId: p.user_id,
      courseId: p.course_id,
      lessonIndex: p.lesson_index,
      title: p.title,
      content: p.content,
      isHelpful: p.is_helpful,
      createdAt: p.created_at,
      replyCount: replyCounts[p.id] ?? 0,
      courseName: course?.title ?? null,
      courseSlug: course?.slug ?? null,
      lessonTitle: lessonInfo?.title ?? null,
      author: profileMap[p.user_id]
        ? {
            username: profileMap[p.user_id].username,
            displayName: profileMap[p.user_id].display_name,
            avatarUrl: profileMap[p.user_id].avatar_url,
          }
        : { username: "unknown", displayName: "Unknown", avatarUrl: null },
    };
  });

  return NextResponse.json({ posts: enriched });
}

/**
 * POST /api/forum
 * Creates a standalone forum post (not linked to a course).
 * Body: { title, content } or { courseId, lessonIndex, content } for lesson discussion links.
 */
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
    const { title, content } = body;

    if (!content?.trim()) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 },
      );
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { error: "Content must be 2000 characters or less" },
        { status: 400 },
      );
    }

    const { data: post, error } = await supabaseAdmin
      .from("comments")
      .insert({
        user_id: user.id,
        course_id: null,
        lesson_index: null,
        title: title?.trim() || null,
        parent_id: null,
        content: content.trim(),
      })
      .select("*")
      .single();

    if (error) {
      console.error("[Forum POST] Error:", error.message);
      return NextResponse.json(
        { error: "Failed to create post" },
        { status: 500 },
      );
    }

    // Log activity
    await supabaseAdmin.from("activities").insert({
      user_id: user.id,
      type: "comment_posted",
      title: "Created a forum post",
      description: title?.trim() || "Community discussion",
      xp: 0,
    });

    return NextResponse.json({ post });
  } catch (err) {
    console.error("[Forum POST] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
