import { NextResponse } from "next/server";
import { resolveUserId } from "@/lib/auth-utils";
import { DiscussionService } from "@/lib/services/discussion-service";
import type { ThreadListParams } from "@/types";

const service = new DiscussionService();

export async function GET(request: Request) {
  const userId = await resolveUserId();
  const { searchParams } = new URL(request.url);

  const params: ThreadListParams = {
    scope: (searchParams.get("scope") as ThreadListParams["scope"]) ?? undefined,
    category: (searchParams.get("category") as ThreadListParams["category"]) ?? undefined,
    lessonId: searchParams.get("lessonId") ?? undefined,
    sort: (searchParams.get("sort") as ThreadListParams["sort"]) ?? undefined,
    search: searchParams.get("search") ?? undefined,
    cursor: searchParams.get("cursor") ?? undefined,
    limit: searchParams.has("limit") ? Number(searchParams.get("limit")) : undefined,
  };

  const data = await service.listThreads(params, userId);
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const userId = await resolveUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  if (!body.title?.trim() || !body.scope) {
    return NextResponse.json({ error: "Title and scope are required" }, { status: 400 });
  }

  const thread = await service.createThread(userId, {
    title: body.title.trim(),
    body: body.body?.trim() ?? "",
    scope: body.scope,
    category: body.category,
    tags: body.tags,
    lessonId: body.lessonId,
    courseId: body.courseId,
  });

  return NextResponse.json(thread, { status: 201 });
}
