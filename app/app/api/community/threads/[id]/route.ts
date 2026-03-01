import { NextRequest, NextResponse } from "next/server";
import { getThreadById, listReplies } from "@/lib/community-db";

export const runtime = "nodejs";

function parseThreadId(id: string): number | null {
  const parsed = Number.parseInt(id, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const threadId = parseThreadId(params.id);
  if (!threadId) {
    return NextResponse.json({ error: "Invalid thread id." }, { status: 400 });
  }

  try {
    const thread = await getThreadById(threadId);
    if (!thread) {
      return NextResponse.json({ error: "Thread not found." }, { status: 404 });
    }
    const replies = await listReplies(threadId);
    return NextResponse.json({ thread, replies });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch thread.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
