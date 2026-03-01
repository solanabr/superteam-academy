import { NextRequest, NextResponse } from "next/server";
import {
  countThreads,
  createThread,
  listThreads,
  type ThreadType,
} from "@/lib/community-db";

export const runtime = "nodejs";

function parseThreadType(value: string | null): ThreadType | undefined {
  if (!value || value === "all") return undefined;
  if (value === "discussion" || value === "question") return value;
  return undefined;
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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = parseThreadType(searchParams.get("type"));
  const query = (searchParams.get("q") ?? "").trim();
  const page = Math.max(Number.parseInt(searchParams.get("page") ?? "1", 10) || 1, 1);
  const limitRaw = Number.parseInt(searchParams.get("limit") ?? "20", 10) || 20;
  const limit = Math.min(Math.max(limitRaw, 1), 50);
  const offset = (page - 1) * limit;

  try {
    const [threads, total] = await Promise.all([
      listThreads({
        type,
        query,
        limit,
        offset,
      }),
      countThreads(type, query),
    ]);

    return NextResponse.json({
      threads,
      pagination: {
        page,
        limit,
        total,
        hasMore: offset + threads.length < total,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load community threads.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as {
      type?: string;
      title?: string;
      body?: string;
      authorName?: string;
      walletAddress?: string;
    };

    const type = parseThreadType(payload.type ?? "all");
    if (!type) {
      return NextResponse.json(
        { error: "Invalid thread type. Use discussion or question." },
        { status: 400 }
      );
    }

    const title = (payload.title ?? "").trim();
    const body = (payload.body ?? "").trim();
    if (!title || title.length < 5 || title.length > 160) {
      return NextResponse.json(
        { error: "Title must be between 5 and 160 characters." },
        { status: 400 }
      );
    }
    if (!body || body.length < 10 || body.length > 10000) {
      return NextResponse.json(
        { error: "Body must be between 10 and 10000 characters." },
        { status: 400 }
      );
    }

    const thread = await createThread({
      type,
      title,
      body,
      authorName: normalizeAuthorName(payload.authorName),
      walletAddress: normalizeWallet(payload.walletAddress),
    });

    return NextResponse.json({ thread }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create thread.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
