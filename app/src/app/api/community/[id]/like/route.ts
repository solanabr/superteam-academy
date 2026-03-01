import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { communityService } from "@/services/community";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const result = await communityService.toggleLike(session.user.id, id);
  return NextResponse.json(result);
}
