import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { communityService } from "@/services/community";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { content } = await req.json();
  if (!content?.trim()) {
    return NextResponse.json({ error: "Content required" }, { status: 400 });
  }

  await communityService.createPost(session.user.id, {
    title: "",
    content: content.trim(),
    parentId: id,
  });

  return NextResponse.json({ success: true });
}
