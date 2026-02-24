import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * POST /api/auth/unlink-wallet
 * Removes the linked Solana wallet from the authenticated user's profile.
 */
export async function POST() {
  try {
    const supabaseServer = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabaseServer.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Verify the user actually has a wallet linked
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("wallet_address")
      .eq("id", user.id)
      .single();

    if (!profile?.wallet_address) {
      return NextResponse.json(
        { error: "No wallet linked to this account" },
        { status: 400 },
      );
    }

    // Clear the wallet address
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ wallet_address: null })
      .eq("id", user.id);

    if (error) {
      console.error("[Unlink Wallet] Failed to update profile:", error.message);
      return NextResponse.json(
        { error: "Failed to unlink wallet" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Unlink Wallet] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
