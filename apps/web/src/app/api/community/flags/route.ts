// apps/web/src/app/api/community/flags/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isRateLimited } from "@/lib/rate-limit";
import { notifyModeration } from "@/lib/community/moderation-notify";

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
      await isRateLimited("community:flags", user.id, {
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

    // Notify admins on the FIRST flag for this target (one ping per item, not
    // per report). Count via the service-role client so RLS doesn't limit it to
    // the reporter's own rows. Non-blocking: never fail the flag on this.
    try {
      const admin = createAdminClient();
      const column = threadId ? "thread_id" : "answer_id";
      const targetId = threadId || answerId;
      const { count } = await admin
        .from("flags")
        .select("id", { count: "exact", head: true })
        .eq(column, targetId);
      if (count === 1) {
        void notifyModeration(
          `🚩 New "${reason}" flag on a community ${threadId ? "thread" : "answer"}. Review it in /admin.`
        );
      }
    } catch {
      // Notification is best-effort; the flag is already recorded.
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
