import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  try {
    const supabaseServer = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabaseServer.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check if profile already exists
    const { data: existing } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    if (existing) {
      return NextResponse.json({ exists: true });
    }

    // Derive profile fields from auth user metadata
    const walletAddress = user.user_metadata?.wallet_address ?? null;
    const baseUsername =
      user.user_metadata?.preferred_username ??
      user.user_metadata?.user_name ??
      (walletAddress
        ? walletAddress.slice(0, 8).toLowerCase()
        : user.email?.split("@")[0]) ??
      user.id.slice(0, 8);

    const displayName =
      user.user_metadata?.full_name ??
      user.user_metadata?.name ??
      (walletAddress
        ? `Wallet ${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
        : baseUsername);

    // Try insert with the base username; on conflict, append random suffix
    let username = baseUsername;
    for (let attempt = 0; attempt < 3; attempt++) {
      const { error } = await supabaseAdmin.from("profiles").upsert(
        {
          id: user.id,
          email: user.email,
          wallet_address: walletAddress,
          username,
          display_name: displayName,
          avatar_url: user.user_metadata?.avatar_url ?? null,
          bio: "",
          is_public: true,
          preferred_language: "en",
          theme: "light",
        },
        { onConflict: "id" }
      );

      if (!error) {
        return NextResponse.json({ created: true });
      }

      // If the error is a unique constraint violation on username, retry with suffix
      if (error.code === "23505" && error.message?.includes("username")) {
        const suffix = Math.random().toString(36).slice(2, 6);
        username = `${baseUsername.slice(0, 12)}_${suffix}`;
        continue;
      }

      console.error("[EnsureProfile] Upsert failed:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ created: true });
  } catch (err) {
    console.error("[EnsureProfile] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
