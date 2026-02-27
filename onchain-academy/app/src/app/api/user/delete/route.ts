import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { createClient } from "@supabase/supabase-js";
import { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from "@/lib/env";

type AcademySession = {
  user: { id?: string; email?: string };
  wallet: string | null;
};

function getUserId(session: AcademySession): string | null {
  return session.wallet || session.user?.id || null;
}

export async function DELETE(request: Request) {
  const session = (await auth()) as AcademySession | null;
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const userId = getUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "No user identifier" }, { status: 400 });
  }

  const body = await request.json();
  const { confirmation } = body;

  if (confirmation !== "DELETE") {
    return NextResponse.json({ error: "Invalid confirmation" }, { status: 400 });
  }

  if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ success: true });
  }

  const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { error } = await supabase
    .from("user_profiles")
    .delete()
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
