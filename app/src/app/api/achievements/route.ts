import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const supabaseServer = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabaseServer.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: earned, error } = await supabaseAdmin
      .from("user_achievements")
      .select("achievement_id, earned_at")
      .eq("user_id", user.id);

    if (error) {
      console.error("[Achievements GET] Error:", error.message);
      return NextResponse.json({ earned: [] });
    }

    return NextResponse.json({ earned: earned ?? [] });
  } catch (err) {
    console.error("[Achievements GET] Error:", err);
    return NextResponse.json({ earned: [] });
  }
}
