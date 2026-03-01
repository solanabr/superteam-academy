import { NextRequest, NextResponse } from "next/server";
import { createReply, getThreadById } from "@/lib/community-db";

export const runtime = "nodejs";

function parseThreadId(id: string): number | null {
  const parsed = Number.parseInt(id, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

function normalizeAuthorName(value: unknown): string {
  if (typeof value !== "string") return "Anonymous";
  const trimmed = value.trim();
  if (!trimmed) return "Anonymous";
  return trimmed.slice(0, 80);
}

function normalizeWallet(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, 80) : null;
}

export async function POST(
  request: NextRequest,
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

    const payload = (await request.json()) as {
      body?: string;
      authorName?: string;
      walletAddress?: string;
    };

    const body = (payload.body ?? "").trim();
    if (!body || body.length < 2 || body.length > 10000) {
      return NextResponse.json(
        { error: "Reply must be between 2 and 10000 characters." },
        { status: 400 }
      );
    }

    const reply = await createReply({
      threadId,
      body,
      authorName: normalizeAuthorName(payload.authorName),
      walletAddress: normalizeWallet(payload.walletAddress),
    });

    return NextResponse.json({ reply }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create reply.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
