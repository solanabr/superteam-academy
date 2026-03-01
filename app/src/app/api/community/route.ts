import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { communityService } from "@/services/community";
import type { PostType } from "@/services/interfaces";

export async function GET(req: NextRequest) {
  const session = await auth();
  const sp = req.nextUrl.searchParams;

  const sort = (sp.get("sort") as "newest" | "oldest" | "popular") ?? "newest";
  const type = sp.get("type") as PostType | null;
  const tag = sp.get("tag") ?? undefined;
  const page = Math.max(1, Number(sp.get("page") ?? 1));
  const limit = Math.min(50, Math.max(1, Number(sp.get("limit") ?? 20)));
  const search = sp.get("search") ?? undefined;
  const courseId = sp.get("courseId") ?? undefined;

  const { posts, total } = await communityService.getPosts({
    search,
    courseId,
    userId: session?.user?.id,
    sort,
    type: type || undefined,
    tag,
    page,
    limit,
  });

  return NextResponse.json({ posts, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, content, courseId, type, tags } = await req.json();
  if (!content) {
    return NextResponse.json({ error: "Content required" }, { status: 400 });
  }

  try {
    await communityService.createPost(session.user.id, {
      title,
      content,
      courseId: courseId || undefined,
      type: type || "post",
      tags: Array.isArray(tags) ? tags : [],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create post";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
