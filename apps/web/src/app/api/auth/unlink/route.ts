import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { burnXpFromWallet } from "@/lib/solana/xp-mint";
import { logError } from "@/lib/logging";
import { ERROR_IDS } from "@/constants/errorIds";

type UnlinkProvider = "wallet" | "google" | "github";

interface UnlinkRequest {
  provider: UnlinkProvider;
}

export async function POST(request: NextRequest) {
  try {
    // Env var guards
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      console.error(
        "[auth/unlink] Missing required Supabase environment variables"
      );
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as UnlinkRequest;
    const { provider } = body;

    if (
      provider !== "wallet" &&
      provider !== "google" &&
      provider !== "github"
    ) {
      return NextResponse.json(
        { error: "Invalid provider. Must be 'wallet', 'google', or 'github'" },
        { status: 400 }
      );
    }

    const supabaseAdmin = createAdminClient();

    // Fetch user's profile to check wallet_address
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("wallet_address")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      console.error(
        "[auth/unlink] Profile fetch error:",
        profileError?.message
      );
      return NextResponse.json(
        { error: "Failed to fetch profile" },
        { status: 500 }
      );
    }

    // Check OAuth identities from auth identities
    const googleIdentity = user.identities?.find(
      (id) => id.provider === "google"
    );
    const githubIdentity = user.identities?.find(
      (id) => id.provider === "github"
    );

    const hasWallet = !!profile.wallet_address;
    const hasGoogle = !!googleIdentity;
    const hasGitHub = !!githubIdentity;

    // Count auth methods — must have at least 2 to unlink one
    const authMethodCount =
      (hasWallet ? 1 : 0) + (hasGoogle ? 1 : 0) + (hasGitHub ? 1 : 0);

    if (authMethodCount <= 1) {
      return NextResponse.json({ error: "cannotUnlinkLast" }, { status: 403 });
    }

    // Perform the unlink operation
    if (provider === "wallet") {
      if (!hasWallet) {
        return NextResponse.json(
          { error: "No wallet linked" },
          { status: 400 }
        );
      }

      // Burn all Token-2022 XP from the wallet BEFORE unlinking.
      // This prevents double-spending: XP lives in Supabase as source of truth,
      // and is re-minted to whatever wallet the user links next.
      let xpBurned = 0;
      let burnSignature: string | undefined;

      const burnResult = await burnXpFromWallet(profile.wallet_address!);
      if (burnResult.success) {
        xpBurned = burnResult.amount ?? 0;
        burnSignature = burnResult.signature;
      } else if (burnResult.error) {
        logError({
          errorId: ERROR_IDS.UNLINK_FAILED,
          error: new Error(`XP burn failed: ${burnResult.error}`),
          context: { userId: user.id, walletAddress: profile.wallet_address },
        });
        // Don't block the unlink — Supabase is the XP source of truth.
        // On-chain tokens on an unlinked wallet are harmless (non-transferable).
      }

      // Clear wallet link. Only reset wallet_xp_synced_at if burn succeeded,
      // so a re-link won't double-mint if tokens are still on-chain.
      const updatePayload: Record<string, string | null> = {
        wallet_address: null,
      };
      if (burnResult.success) {
        updatePayload.wallet_xp_synced_at = null;
      }

      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update(updatePayload)
        .eq("id", user.id);

      if (updateError) {
        console.error(
          "[auth/unlink] Wallet unlink error:",
          updateError.message
        );
        return NextResponse.json(
          { error: "Failed to unlink wallet" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        provider: "wallet",
        xpBurned,
        burnSignature,
      });
    }

    if (provider === "google") {
      if (!hasGoogle || !googleIdentity) {
        return NextResponse.json(
          { error: "No Google account linked" },
          { status: 400 }
        );
      }

      const { error: unlinkError } =
        await supabase.auth.unlinkIdentity(googleIdentity);

      if (unlinkError) {
        console.error(
          "[auth/unlink] Google unlink error:",
          unlinkError.message
        );
        return NextResponse.json(
          { error: "Failed to unlink Google account" },
          { status: 500 }
        );
      }

      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({ google_id: null })
        .eq("id", user.id);

      if (updateError) {
        console.error(
          "[auth/unlink] Google profile update error:",
          updateError.message
        );
      }

      return NextResponse.json({ success: true, provider: "google" });
    }

    // provider === "github"
    if (!hasGitHub || !githubIdentity) {
      return NextResponse.json(
        { error: "No GitHub account linked" },
        { status: 400 }
      );
    }

    const { error: unlinkError } =
      await supabase.auth.unlinkIdentity(githubIdentity);

    if (unlinkError) {
      console.error("[auth/unlink] GitHub unlink error:", unlinkError.message);
      return NextResponse.json(
        { error: "Failed to unlink GitHub account" },
        { status: 500 }
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ github_id: null })
      .eq("id", user.id);

    if (updateError) {
      console.error(
        "[auth/unlink] GitHub profile update error:",
        updateError.message
      );
    }

    return NextResponse.json({ success: true, provider: "github" });
  } catch (err: unknown) {
    logError({
      errorId: ERROR_IDS.UNLINK_FAILED,
      error: err instanceof Error ? err : new Error(String(err)),
      context: { route: "/api/auth/unlink" },
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
