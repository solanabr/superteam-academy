import { NextResponse } from "next/server";
import { DiscussionService } from "@/lib/services/discussion-service";

const service = new DiscussionService();

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ threadId: string }> },
) {
  const { threadId } = await params;
  await service.incrementViewCount(threadId);
  return NextResponse.json({ ok: true });
}
