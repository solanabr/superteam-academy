// apps/web/src/app/api/community/flags/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isRateLimited } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit: 20 flags per hour per user
    if (
      isRateLimited("community:flags", user.id, {
        maxTokens: 20,
        refillIntervalMs: 3_600_000,
      })
    ) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    const { threadId, answerId, reason, details } = await request.json();

    if ((!threadId && !answerId) || (threadId && answerId)) {
      return NextResponse.json(
        { error: "Specify exactly one of threadId or answerId" },
        { status: 400 }
      );
    }
    if (!["spam", "offensive", "off-topic", "other"].includes(reason)) {
      return NextResponse.json(
        { error: "Invalid flag reason" },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("flags").insert({
      reporter_id: user.id,
      thread_id: threadId || null,
      answer_id: answerId || null,
      reason,
      details: details?.slice(0, 1000) || null,
    });

    if (error) {
      return NextResponse.json(
        { error: "Failed to submit flag" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
