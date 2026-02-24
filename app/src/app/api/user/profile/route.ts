import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getSupabaseAdmin } from "@/lib/supabase/server";

type AcademySession = {
  user: { id?: string };
  wallet: string | null;
};

function getUserId(session: AcademySession): string | null {
  return session.wallet || session.user?.id || null;
}

export async function GET() {
  const session = (await auth()) as AcademySession | null;
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = getUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "No user identifier" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error && error.code === "PGRST116") {
    // No row found — return defaults
    return NextResponse.json({
      user_id: userId,
      display_name: "",
      bio: "",
      is_public: true,
      show_on_leaderboard: true,
      email_notifications: true,
      streak_reminders: true,
    });
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = (await auth()) as AcademySession | null;
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = getUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "No user identifier" }, { status: 400 });
  }

  const body = await req.json();
  const updates: Record<string, unknown> = {};

  if (typeof body.display_name === "string") {
    updates.display_name = body.display_name.slice(0, 50);
  }
  if (typeof body.bio === "string") {
    updates.bio = body.bio.slice(0, 300);
  }
  if (typeof body.is_public === "boolean") {
    updates.is_public = body.is_public;
  }
  if (typeof body.show_on_leaderboard === "boolean") {
    updates.show_on_leaderboard = body.show_on_leaderboard;
  }
  if (typeof body.email_notifications === "boolean") {
    updates.email_notifications = body.email_notifications;
  }
  if (typeof body.streak_reminders === "boolean") {
    updates.streak_reminders = body.streak_reminders;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("user_profiles")
    .upsert({ user_id: userId, ...updates }, { onConflict: "user_id" })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
