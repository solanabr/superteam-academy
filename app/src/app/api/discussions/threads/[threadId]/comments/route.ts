import { NextResponse } from "next/server";
import { resolveUserId } from "@/lib/auth-utils";
import { DiscussionService } from "@/lib/services/discussion-service";

const service = new DiscussionService();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ threadId: string }> },
) {
  const { threadId } = await params;
  const userId = await resolveUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  if (!body.body?.trim()) {
    return NextResponse.json({ error: "Body is required" }, { status: 400 });
  }

  try {
    const comment = await service.createComment(threadId, userId, {
      body: body.body.trim(),
      parentId: body.parentId,
    });
    return NextResponse.json(comment, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    if (msg === "Locked") return NextResponse.json({ error: "Thread is locked" }, { status: 403 });
    if (msg === "Not found") return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
