import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { communityService } from "@/services/community";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();

  const [post, replies] = await Promise.all([
    communityService.getPost(id, session?.user?.id),
    communityService.getReplies(id, session?.user?.id),
  ]);

  if (!post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ post, replies });
}
