// apps/web/src/app/api/community/votes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isRateLimited } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit: 60 votes per hour per user
    if (
      isRateLimited("community:votes", user.id, {
        maxTokens: 60,
        refillIntervalMs: 3_600_000,
      })
    ) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    const { threadId, answerId, value } = await request.json();

    // Exactly one target
    if ((!threadId && !answerId) || (threadId && answerId)) {
      return NextResponse.json(
        { error: "Specify exactly one of threadId or answerId" },
        { status: 400 }
      );
    }
    if (![1, -1, 0].includes(value)) {
      return NextResponse.json(
        { error: "Value must be 1, -1, or 0" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // NOTE: Read-then-write pattern could cause 1-2 XP drift under rapid vote toggling.
    // Mitigated by unique constraints and idempotency keys. Atomic RPC considered but deferred.

    // Find existing vote
    let existingVoteQuery = admin
      .from("votes")
      .select("id, value")
      .eq("user_id", user.id);
    if (threadId)
      existingVoteQuery = existingVoteQuery.eq("thread_id", threadId);
    else existingVoteQuery = existingVoteQuery.eq("answer_id", answerId);
    const { data: existing } = await existingVoteQuery.maybeSingle();

    // Determine content author for XP
    let contentAuthorId: string | null = null;
    if (threadId) {
      const { data: t } = await supabase
        .from("threads")
        .select("author_id")
        .eq("id", threadId)
        .single();
      contentAuthorId = t?.author_id || null;
    } else {
      const { data: a } = await supabase
        .from("answers")
        .select("author_id")
        .eq("id", answerId)
        .single();
      contentAuthorId = a?.author_id || null;
    }

    const xpAmount = threadId ? 1 : 2; // 1 XP for thread upvote, 2 for answer
    const xpKey = `upvote:${threadId || answerId}:${user.id}`;

    if (value === 0) {
      // Remove vote
      if (existing) {
        await admin.from("votes").delete().eq("id", existing.id);
        // Revoke XP if it was an upvote
        if (
          existing.value === 1 &&
          contentAuthorId &&
          contentAuthorId !== user.id
        ) {
          await admin.rpc("revoke_community_xp", {
            p_user_id: contentAuthorId,
            p_idempotency_key: xpKey,
          });
        }
      }
    } else if (existing) {
      // Update existing vote
      if (existing.value !== value) {
        await admin.from("votes").update({ value }).eq("id", existing.id);
        // Handle XP: old upvote -> revoke; new upvote -> award
        if (contentAuthorId && contentAuthorId !== user.id) {
          if (existing.value === 1) {
            await admin.rpc("revoke_community_xp", {
              p_user_id: contentAuthorId,
              p_idempotency_key: xpKey,
            });
          }
          if (value === 1) {
            await admin.rpc("award_community_xp", {
              p_user_id: contentAuthorId,
              p_amount: xpAmount,
              p_reason: threadId
                ? "community:upvote_thread"
                : "community:upvote_answer",
              p_idempotency_key: xpKey,
            });
          }
        }
      }
    } else {
      // New vote (self-vote prevented by DB trigger)
      const insertData: {
        user_id: string;
        value: number;
        thread_id?: string | null;
        answer_id?: string | null;
      } = { user_id: user.id, value };
      if (threadId) insertData.thread_id = threadId;
      else insertData.answer_id = answerId;

      const { error } = await admin.from("votes").insert(insertData);
      if (error) {
        if (error.message.includes("Cannot vote on your own content")) {
          return NextResponse.json(
            { error: "Cannot vote on your own content" },
            { status: 400 }
          );
        }
        return NextResponse.json({ error: "Failed to vote" }, { status: 500 });
      }

      // Award XP for upvote (not downvote)
      if (value === 1 && contentAuthorId && contentAuthorId !== user.id) {
        await admin.rpc("award_community_xp", {
          p_user_id: contentAuthorId,
          p_amount: xpAmount,
          p_reason: threadId
            ? "community:upvote_thread"
            : "community:upvote_answer",
          p_idempotency_key: xpKey,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
