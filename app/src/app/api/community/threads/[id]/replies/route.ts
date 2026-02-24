import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const db = getSupabaseAdmin();

    const { data, error } = await db
      .from("replies")
      .select("*")
      .eq("thread_id", id)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ replies: data || [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch replies";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const db = getSupabaseAdmin();
    const body = await req.json();
    const { content, wallet, parentReplyId } = body as {
      content?: string;
      wallet?: string;
      parentReplyId?: string;
    };

    if (!wallet) {
      return NextResponse.json({ error: "Wallet address required" }, { status: 401 });
    }
    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const { data: thread } = await db
      .from("threads")
      .select("id")
      .eq("id", id)
      .single();

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    const { data, error } = await db
      .from("replies")
      .insert({
        thread_id: id,
        body: content.trim(),
        author_wallet: wallet,
        parent_reply_id: parentReplyId || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Increment reply count on the thread
    const { data: currentThread } = await db
      .from("threads")
      .select("reply_count")
      .eq("id", id)
      .single();

    if (currentThread) {
      await db
        .from("threads")
        .update({
          reply_count: (currentThread.reply_count || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
    }

    return NextResponse.json({ reply: data }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create reply";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
