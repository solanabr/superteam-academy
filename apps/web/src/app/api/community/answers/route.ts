// apps/web/src/app/api/community/answers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

    const { threadId, body } = await request.json();

    if (!threadId || typeof threadId !== "string") {
      return NextResponse.json(
        { error: "Thread ID required" },
        { status: 400 }
      );
    }
    if (
      !body ||
      typeof body !== "string" ||
      body.length < 1 ||
      body.length > 10000
    ) {
      return NextResponse.json(
        { error: "Body must be 1-10000 characters" },
        { status: 400 }
      );
    }

    // Check thread exists and is not locked
    const { data: thread } = await supabase
      .from("threads")
      .select("id, is_locked")
      .eq("id", threadId)
      .single();

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }
    if (thread.is_locked) {
      return NextResponse.json({ error: "Thread is locked" }, { status: 403 });
    }

    const { data: answer, error } = await supabase
      .from("answers")
      .insert({
        thread_id: threadId,
        author_id: user.id,
        body,
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to create answer" },
        { status: 500 }
      );
    }

    // Award community XP (10 XP for posting answer)
    const admin = createAdminClient();
    await admin.rpc("award_community_xp", {
      p_user_id: user.id,
      p_amount: 10,
      p_reason: "community:answer_posted",
      p_idempotency_key: `answer:${answer.id}`,
    });

    return NextResponse.json(answer, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
