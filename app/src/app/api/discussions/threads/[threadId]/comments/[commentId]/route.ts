import { NextResponse } from "next/server";
import { resolveUserId } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { DiscussionService } from "@/lib/services/discussion-service";

const service = new DiscussionService();

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ threadId: string; commentId: string }> },
) {
  const { commentId } = await params;
  const userId = await resolveUserId();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  if (!body.body?.trim()) {
    return NextResponse.json({ error: "Body is required" }, { status: 400 });
  }

  try {
    await service.updateComment(commentId, userId, body.body.trim());
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    const status = msg === "Not found" ? 404 : msg === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ threadId: string; commentId: string }> },
) {
  const { commentId } = await params;
  const userId = await resolveUserId();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true },
  });

  try {
    await service.softDeleteComment(commentId, userId, user?.isAdmin ?? false);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    const status = msg === "Not found" ? 404 : msg === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
