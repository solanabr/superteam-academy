import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import nacl from "tweetnacl";
import bs58 from "bs58";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * POST /api/auth/link-wallet
 * Links a Solana wallet to the currently authenticated user's profile.
 * Requires the user to sign a message proving wallet ownership.
 */
export async function POST(request: Request) {
  try {
    const supabaseServer = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabaseServer.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { walletAddress, signature, message } = await request.json();

    if (!walletAddress || !signature || !message) {
      return NextResponse.json(
        { error: "Missing walletAddress, signature, or message" },
        { status: 400 },
      );
    }

    // Verify the signature
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = bs58.decode(signature);
    const publicKeyBytes = bs58.decode(walletAddress);

    const isValid = nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKeyBytes,
    );

    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    if (!message.includes("Superteam Academy") || !message.includes(walletAddress)) {
      return NextResponse.json({ error: "Invalid message format" }, { status: 400 });
    }

    // Check if another user already has this wallet linked
    const { data: existing } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("wallet_address", walletAddress)
      .neq("id", user.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "This wallet is already linked to another account" },
        { status: 409 },
      );
    }

    // Update the user's profile with the wallet address
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ wallet_address: walletAddress })
      .eq("id", user.id);

    if (error) {
      console.error("[Link Wallet] Failed to update profile:", error.message);
      return NextResponse.json(
        { error: "Failed to link wallet" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, walletAddress });
  } catch (err) {
    console.error("[Link Wallet] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
