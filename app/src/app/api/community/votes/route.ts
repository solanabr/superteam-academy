import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const db = getSupabaseAdmin();
    const body = await req.json();
    const { wallet, threadId, replyId } = body as {
      wallet?: string;
      threadId?: string;
      replyId?: string;
    };

    if (!wallet) {
      return NextResponse.json({ error: "Wallet address required" }, { status: 401 });
    }
    if (!threadId && !replyId) {
      return NextResponse.json(
        { error: "Either threadId or replyId is required" },
        { status: 400 },
      );
    }

    // Check for existing vote
    let existingQuery = db
      .from("votes")
      .select("id")
      .eq("user_wallet", wallet);

    if (threadId) {
      existingQuery = existingQuery.eq("thread_id", threadId);
    } else {
      existingQuery = existingQuery.eq("reply_id", replyId!);
    }

    const { data: existing } = await existingQuery.maybeSingle();

    if (existing) {
      // Remove vote (toggle off)
      await db.from("votes").delete().eq("id", existing.id);

      // Decrement upvote count
      if (threadId) {
        const { data: thread } = await db
          .from("threads")
          .select("upvotes")
          .eq("id", threadId)
          .single();
        if (thread) {
          await db
            .from("threads")
            .update({ upvotes: Math.max(0, (thread.upvotes || 0) - 1) })
            .eq("id", threadId);
        }
      } else if (replyId) {
        const { data: reply } = await db
          .from("replies")
          .select("upvotes")
          .eq("id", replyId)
          .single();
        if (reply) {
          await db
            .from("replies")
            .update({ upvotes: Math.max(0, (reply.upvotes || 0) - 1) })
            .eq("id", replyId);
        }
      }

      return NextResponse.json({ voted: false });
    }

    // Create vote
    const { error: insertError } = await db.from("votes").insert({
      user_wallet: wallet,
      thread_id: threadId || null,
      reply_id: replyId || null,
      vote_type: "up",
    });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Increment upvote count
    if (threadId) {
      const { data: thread } = await db
        .from("threads")
        .select("upvotes")
        .eq("id", threadId)
        .single();
      if (thread) {
        await db
          .from("threads")
          .update({ upvotes: (thread.upvotes || 0) + 1 })
          .eq("id", threadId);
      }
    } else if (replyId) {
      const { data: reply } = await db
        .from("replies")
        .select("upvotes")
        .eq("id", replyId)
        .single();
      if (reply) {
        await db
          .from("replies")
          .update({ upvotes: (reply.upvotes || 0) + 1 })
          .eq("id", replyId);
      }
    }

    return NextResponse.json({ voted: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to vote";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
