import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const db = getAdminClient();
  if (!db) {
    return NextResponse.json([]);
  }

  const search = req.nextUrl.searchParams.get("search") ?? "";

  let query = db
    .from("community_posts")
    .select(
      "id, title, content, course_id, upvotes, created_at, user_id, parent_id, profiles!inner(display_name, username)",
    )
    .is("parent_id", null)
    .order("created_at", { ascending: false })
    .limit(50);

  if (search) {
    query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error || !data) return NextResponse.json([]);

  // Count replies per post
  const postIds = data.map((p: Record<string, unknown>) => p.id);
  const { data: replyCounts } = await db
    .from("community_posts")
    .select("parent_id")
    .in("parent_id", postIds);

  const replyMap = new Map<string, number>();
  for (const r of replyCounts ?? []) {
    replyMap.set(r.parent_id, (replyMap.get(r.parent_id) ?? 0) + 1);
  }

  const posts = data.map((p: Record<string, unknown>) => {
    const profile = p.profiles as Record<string, unknown>;
    return {
      id: p.id,
      author: (profile?.display_name as string) ?? (profile?.username as string) ?? "Anonymous",
      title: p.title ?? "",
      content: p.content ?? "",
      course: p.course_id ?? null,
      upvotes: p.upvotes ?? 0,
      replies: replyMap.get(p.id as string) ?? 0,
      createdAt: p.created_at,
    };
  });

  return NextResponse.json(posts);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getAdminClient();
  if (!db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  const { title, content, courseId } = await req.json();
  if (!content) {
    return NextResponse.json({ error: "Content required" }, { status: 400 });
  }

  const { error } = await db.from("community_posts").insert({
    user_id: session.user.id,
    title,
    content,
    course_id: courseId || null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
