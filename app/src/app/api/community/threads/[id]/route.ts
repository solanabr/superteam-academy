import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/admin";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const db = getSupabaseAdmin();

    const { data: thread, error: threadError } = await db
      .from("threads")
      .select("*")
      .eq("id", id)
      .single();

    if (threadError || !thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    const { data: replies, error: repliesError } = await db
      .from("replies")
      .select("*")
      .eq("thread_id", id)
      .order("created_at", { ascending: true });

    if (repliesError) {
      return NextResponse.json({ error: repliesError.message }, { status: 500 });
    }

    return NextResponse.json({ thread, replies: replies || [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch thread";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const db = getSupabaseAdmin();
    const url = new URL(req.url);
    const wallet = url.searchParams.get("wallet");

    if (!wallet || !isAdmin(wallet)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { error } = await db
      .from("threads")
      .update({
        title: "[Removed]",
        body: "[deleted]",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete thread";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
