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
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const value = body.value;
  if (value !== 1 && value !== -1) {
    return NextResponse.json(
      { error: "Value must be 1 or -1" },
      { status: 400 },
    );
  }

  const result = await service.voteThread(threadId, userId, value);
  return NextResponse.json(result);
}
