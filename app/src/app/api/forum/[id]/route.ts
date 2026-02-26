import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sanityClient } from "@/lib/sanity/client";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

interface ProfileRow {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

/**
 * GET /api/forum/[id]
 * Fetches a single post and all its replies.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Fetch the post
  const { data: post, error: postError } = await supabaseAdmin
    .from("comments")
    .select("*")
    .eq("id", id)
    .single();

  if (postError || !post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  // Fetch replies
  const { data: replies } = await supabaseAdmin
    .from("comments")
    .select("*")
    .eq("parent_id", id)
    .order("created_at", { ascending: true });

  const allComments = [post, ...(replies ?? [])];
  const userIds = [...new Set(allComments.map((c) => c.user_id))];

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

  const authorFor = (userId: string) =>
    profileMap[userId]
      ? {
          username: profileMap[userId].username,
          displayName: profileMap[userId].display_name,
          avatarUrl: profileMap[userId].avatar_url,
        }
      : { username: "unknown", displayName: "Unknown", avatarUrl: null };

  // Fetch course info from Sanity if post is linked to a course
  let courseName: string | null = null;
  let courseSlug: string | null = null;
  let lessonTitle: string | null = null;
  if (post.course_id) {
    try {
      const course = await sanityClient.fetch<
        { title: string; slug: string; modules: { lessons: { title: string }[] }[] } | null
      >(
        `*[_type == "course" && courseId == $courseId][0] { title, "slug": slug.current, "modules": modules[]{ "lessons": lessons[]{ title } } }`,
        { courseId: post.course_id },
      );
      if (course) {
        courseName = course.title;
        courseSlug = course.slug;
        if (post.lesson_index != null) {
          let idx = 0;
          for (const m of course.modules ?? []) {
            for (const l of m.lessons ?? []) {
              if (idx === post.lesson_index) {
                lessonTitle = l.title;
              }
              idx++;
            }
          }
        }
      }
    } catch (sanityErr) {
      console.error("[Forum GET] Sanity fetch error:", sanityErr);
    }
  }

  const enrichedPost = {
    id: post.id,
    userId: post.user_id,
    courseId: post.course_id,
    lessonIndex: post.lesson_index,
    title: post.title,
    content: post.content,
    isHelpful: post.is_helpful,
    createdAt: post.created_at,
    replyCount: (replies ?? []).length,
    courseName,
    courseSlug,
    lessonTitle,
    author: authorFor(post.user_id),
  };

  const enrichedReplies = (replies ?? []).map((r) => ({
    id: r.id,
    userId: r.user_id,
    content: r.content,
    isHelpful: r.is_helpful,
    createdAt: r.created_at,
    author: authorFor(r.user_id),
  }));

  return NextResponse.json({ post: enrichedPost, replies: enrichedReplies });
}

/**
 * POST /api/forum/[id]
 * Creates a reply to a post.
 * Body: { content }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabaseServer = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const { content } = body;

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

  // Verify parent post exists
  const { data: parent } = await supabaseAdmin
    .from("comments")
    .select("id, course_id, lesson_index")
    .eq("id", id)
    .single();

  if (!parent) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const { data: reply, error } = await supabaseAdmin
    .from("comments")
    .insert({
      user_id: user.id,
      course_id: parent.course_id,
      lesson_index: parent.lesson_index,
      parent_id: id,
      content: content.trim(),
    })
    .select("*")
    .single();

  if (error) {
    console.error("[Forum Reply POST] Error:", error.message);
    return NextResponse.json(
      { error: "Failed to create reply" },
      { status: 500 },
    );
  }

  // Log activity
  await supabaseAdmin.from("activities").insert({
    user_id: user.id,
    type: "comment_posted",
    title: "Replied to a forum post",
    description: content.trim().slice(0, 100),
    xp: 0,
  });

  return NextResponse.json({ reply });
}
