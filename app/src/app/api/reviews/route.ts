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

  if (!courseId) {
    return NextResponse.json(
      { error: "courseId is required" },
      { status: 400 },
    );
  }

  const { data, error } = await supabaseAdmin
    .from("course_reviews")
    .select("*")
    .eq("course_id", courseId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[Reviews GET] Error:", error.message);
    return NextResponse.json({ reviews: [] });
  }

  const reviews = data ?? [];
  const userIds = [...new Set(reviews.map((r) => r.user_id))];

  const profileMap: Record<
    string,
    { username: string; display_name: string; avatar_url: string | null }
  > = {};
  if (userIds.length > 0) {
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .in("id", userIds);

    for (const p of profiles ?? []) {
      profileMap[p.id] = p;
    }
  }

  const enriched = reviews.map((r) => ({
    id: r.id,
    userId: r.user_id,
    courseId: r.course_id,
    rating: r.rating,
    content: r.content ?? "",
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    author: profileMap[r.user_id]
      ? {
          username: profileMap[r.user_id].username ?? "anonymous",
          displayName: profileMap[r.user_id].display_name ?? "Anonymous",
          avatarUrl: profileMap[r.user_id].avatar_url ?? null,
        }
      : { username: "anonymous", displayName: "Anonymous", avatarUrl: null },
  }));

  // Compute summary
  const count = enriched.length;
  const avgRating =
    count > 0 ? enriched.reduce((sum, r) => sum + r.rating, 0) / count : 0;

  return NextResponse.json({
    reviews: enriched,
    summary: { count, avgRating: Math.round(avgRating * 10) / 10 },
  });
}

export async function POST(request: NextRequest) {
  const supabaseServer = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const { courseId, rating, content } = body;

  if (!courseId || !rating || rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: "courseId and rating (1-5) are required" },
      { status: 400 },
    );
  }

  if (content && content.length > 1000) {
    return NextResponse.json(
      { error: "Review must be 1000 characters or less" },
      { status: 400 },
    );
  }

  // Verify user has completed the course
  const { data: progress } = await supabaseAdmin
    .from("course_progress")
    .select("is_completed")
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .single();

  if (!progress?.is_completed) {
    return NextResponse.json(
      { error: "You must complete the course before reviewing" },
      { status: 403 },
    );
  }

  // Upsert review (one per user per course)
  const { data: review, error } = await supabaseAdmin
    .from("course_reviews")
    .upsert(
      {
        user_id: user.id,
        course_id: courseId,
        rating,
        content: content?.trim() || null,
      },
      { onConflict: "user_id,course_id" },
    )
    .select("*")
    .single();

  if (error) {
    console.error("[Reviews POST] Error:", error.message);
    return NextResponse.json(
      { error: "Failed to save review" },
      { status: 500 },
    );
  }

  return NextResponse.json({ review });
}

export async function DELETE(request: NextRequest) {
  const supabaseServer = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const reviewId = searchParams.get("id");

  if (!reviewId) {
    return NextResponse.json(
      { error: "Review id is required" },
      { status: 400 },
    );
  }

  const { error } = await supabaseAdmin
    .from("course_reviews")
    .delete()
    .eq("id", reviewId)
    .eq("user_id", user.id);

  if (error) {
    console.error("[Reviews DELETE] Error:", error.message);
    return NextResponse.json(
      { error: "Failed to delete review" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
