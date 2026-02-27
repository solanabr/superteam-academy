import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const db = getSupabaseAdmin();
    const body = await req.json();
    const { replyId, wallet } = body as {
      replyId?: string;
      wallet?: string;
    };

    if (!wallet) {
      return NextResponse.json({ error: "Wallet address required" }, { status: 401 });
    }
    if (!replyId) {
      return NextResponse.json({ error: "Reply ID required" }, { status: 400 });
    }

    const { data: thread } = await db
      .from("threads")
      .select("author_wallet")
      .eq("id", id)
      .single();

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    if (thread.author_wallet !== wallet) {
      return NextResponse.json(
        { error: "Only thread author can mark answers" },
        { status: 403 },
      );
    }

    // Clear any previous accepted answers for this thread
    await db
      .from("replies")
      .update({ is_accepted_answer: false })
      .eq("thread_id", id)
      .eq("is_accepted_answer", true);

    // Mark the reply as accepted
    const { error: replyError } = await db
      .from("replies")
      .update({ is_accepted_answer: true })
      .eq("id", replyId)
      .eq("thread_id", id);

    if (replyError) {
      return NextResponse.json({ error: replyError.message }, { status: 500 });
    }

    // Mark thread as answered
    const { error: threadError } = await db
      .from("threads")
      .update({
        is_answered: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (threadError) {
      return NextResponse.json({ error: threadError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to mark answer";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
