// apps/web/src/app/api/community/answers/[id]/accept/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkCommunityAchievements } from "@/lib/gamification/achievements";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: answerId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch answer + thread
    const { data: answer } = await supabase
      .from("answers")
      .select("id, thread_id, author_id")
      .eq("id", answerId)
      .single();

    if (!answer) {
      return NextResponse.json({ error: "Answer not found" }, { status: 404 });
    }

    const { data: thread } = await supabase
      .from("threads")
      .select("id, author_id, type")
      .eq("id", answer.thread_id)
      .single();

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    // Only thread author can accept (and only on questions)
    if (thread.author_id !== user.id) {
      return NextResponse.json(
        { error: "Only thread author can accept answers" },
        { status: 403 }
      );
    }
    if (thread.type !== "question") {
      return NextResponse.json(
        { error: "Can only accept answers on questions" },
        { status: 400 }
      );
    }

    // Cannot accept own answer
    if (answer.author_id === user.id) {
      return NextResponse.json(
        { error: "Cannot accept your own answer" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Before accepting new answer, revoke XP from previous accepted answer.
    // NOTE: Revoke + unaccept are not atomic. Concurrent accepts could race on is_accepted
    // flag state. XP is safe (idempotency keys prevent double-award/revoke).
    const { data: prevAccepted } = await admin
      .from("answers")
      .select("id, author_id")
      .eq("thread_id", thread.id)
      .eq("is_accepted", true)
      .maybeSingle();

    if (prevAccepted && prevAccepted.id !== answerId) {
      // Revoke the previously awarded XP (uses revoke_community_xp which
      // deletes the xp_transaction row and decrements user_xp.total_xp)
      await admin
        .rpc("revoke_community_xp", {
          p_user_id: prevAccepted.author_id,
          p_idempotency_key: `accept:${thread.id}:${prevAccepted.id}`,
        })
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err);
          console.error("[community] revoke_community_xp failed:", msg);
        });
    }

    // Unaccept previous answer if any
    await admin
      .from("answers")
      .update({ is_accepted: false })
      .eq("thread_id", thread.id)
      .eq("is_accepted", true);

    // Accept this answer
    await admin
      .from("answers")
      .update({ is_accepted: true })
      .eq("id", answerId);

    // Update thread
    await admin
      .from("threads")
      .update({ is_solved: true, accepted_answer_id: answerId })
      .eq("id", thread.id);

    // Award XP to answerer (25 XP for accepted answer)
    await admin.rpc("award_community_xp", {
      p_user_id: answer.author_id,
      p_amount: 25,
      p_reason: "community:answer_accepted",
      p_idempotency_key: `accept:${thread.id}:${answerId}`,
    });

    // Fire-and-forget achievement check for the answerer
    checkCommunityAchievements(admin, answer.author_id).catch(() => {});

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
