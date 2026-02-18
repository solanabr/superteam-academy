import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { verifySIWSRequest } from "@/lib/solana/verify-siws";
import { createAdminClient } from "@/lib/supabase/admin";
import { mintXpToWallet } from "@/lib/solana/xp-mint";
import { logError } from "@/lib/logging";
import { ERROR_IDS } from "@/constants/errorIds";
import type { Database } from "@/lib/supabase/types";

interface LinkWalletRequest {
  message: string;
  signature: number[];
  publicKey: string;
}

export async function POST(request: NextRequest) {
  try {
    // Env var guards
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      console.error("Missing required Supabase environment variables");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const bodyText = await request.text();
    if (bodyText.length > 10_000) {
      return NextResponse.json({ error: "Request too large" }, { status: 413 });
    }

    // Verify current session — user must be authenticated
    const cookieStore = await cookies();
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = JSON.parse(bodyText) as LinkWalletRequest;

    // Verify SIWS request (nonce, domain, expiry, signature)
    const verification = await verifySIWSRequest({
      message: body.message,
      signature: body.signature,
      publicKey: body.publicKey,
      expectedHost: request.headers.get("host") ?? "",
    });

    if (!verification.success) {
      return NextResponse.json(
        { error: verification.error },
        { status: verification.statusCode ?? 400 }
      );
    }

    // Use admin client for cross-user checks (RLS blocks querying other users)
    const supabaseAdmin = createAdminClient();

    // Check if this wallet is already linked to ANOTHER account
    const { data: existingWallet } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("wallet_address", body.publicKey)
      .neq("id", user.id)
      .maybeSingle();

    if (existingWallet) {
      return NextResponse.json(
        { error: "walletAlreadyLinked" },
        { status: 409 }
      );
    }

    // Check if user already has a DIFFERENT wallet linked
    const { data: ownProfile } = await supabaseAdmin
      .from("profiles")
      .select("wallet_address, wallet_xp_synced_at")
      .eq("id", user.id)
      .single();

    if (
      ownProfile?.wallet_address &&
      ownProfile.wallet_address !== body.publicKey
    ) {
      return NextResponse.json(
        { error: "differentWalletLinked" },
        { status: 409 }
      );
    }

    // Link wallet to current user's profile
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ wallet_address: body.publicKey })
      .eq("id", user.id);

    if (updateError) {
      // UNIQUE constraint violation — race condition
      if (updateError.code === "23505") {
        return NextResponse.json(
          { error: "walletAlreadyLinked" },
          { status: 409 }
        );
      }
      console.error("[link-wallet] Update error:", updateError.message);
      return NextResponse.json(
        { error: "Failed to link wallet" },
        { status: 500 }
      );
    }

    // One-time XP sync: mint existing Supabase XP to the newly linked wallet
    // so on-chain balance reflects all XP earned before wallet was connected.
    // Guarded by wallet_xp_synced_at to prevent double-mint if a previous
    // unlink's burn failed and the user re-links.
    let xpSynced = 0;
    let syncSignature: string | undefined;

    if (!ownProfile?.wallet_xp_synced_at) {
      const { data: xpRow } = await supabaseAdmin
        .from("user_xp")
        .select("total_xp")
        .eq("user_id", user.id)
        .single();

      if (xpRow?.total_xp && xpRow.total_xp > 0) {
        const mintResult = await mintXpToWallet(body.publicKey, xpRow.total_xp);
        if (mintResult.success) {
          xpSynced = xpRow.total_xp;
          syncSignature = mintResult.signature;

          await supabaseAdmin
            .from("profiles")
            .update({ wallet_xp_synced_at: new Date().toISOString() })
            .eq("id", user.id);
        } else if (mintResult.error) {
          logError({
            errorId: ERROR_IDS.LINK_WALLET_FAILED,
            error: new Error(`XP sync mint failed: ${mintResult.error}`),
            context: {
              userId: user.id,
              walletAddress: body.publicKey,
              xp: xpRow.total_xp,
            },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      walletAddress: body.publicKey,
      xpSynced,
      syncSignature,
    });
  } catch (err: unknown) {
    logError({
      errorId: ERROR_IDS.LINK_WALLET_FAILED,
      error: err instanceof Error ? err : new Error(String(err)),
      context: { route: "/api/auth/link-wallet" },
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
