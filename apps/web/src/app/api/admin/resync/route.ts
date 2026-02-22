import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";
import {
  getAccount,
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { createAdminClient } from "@/lib/supabase/admin";

const ADMIN_SECRET = process.env.ADMIN_SECRET;
const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL!;
const XP_MINT = new PublicKey(process.env.NEXT_PUBLIC_XP_MINT_ADDRESS!);
const HELIUS_API_KEY = process.env.HELIUS_API_KEY;

export async function POST(req: NextRequest) {
  // Admin auth
  const authHeader = req.headers.get("authorization");
  if (!ADMIN_SECRET || authHeader !== `Bearer ${ADMIN_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { walletAddress } = await req.json();
  if (!walletAddress) {
    return NextResponse.json(
      { error: "walletAddress required" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const connection = new Connection(RPC_URL);
  const wallet = new PublicKey(walletAddress);

  // Resolve user
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("wallet_address", walletAddress)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json(
      { error: "No profile for wallet" },
      { status: 404 }
    );
  }

  const results = { xp: 0, achievements: 0, certificates: 0 };

  // 1. Sync XP balance from Token-2022 ATA
  try {
    const ata = getAssociatedTokenAddressSync(
      XP_MINT,
      wallet,
      false,
      TOKEN_2022_PROGRAM_ID
    );
    const account = await getAccount(
      connection,
      ata,
      "confirmed",
      TOKEN_2022_PROGRAM_ID
    );
    const balance = Number(account.amount);
    await supabase
      .from("user_xp")
      .upsert(
        { user_id: profile.id, total_xp: balance },
        { onConflict: "user_id" }
      );
    results.xp = balance;
  } catch {
    // ATA doesn't exist — user has 0 XP
  }

  // 2. Sync NFT assets via Helius DAS API
  if (HELIUS_API_KEY) {
    try {
      const dasRes = await fetch(RPC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "resync",
          method: "getAssetsByOwner",
          params: {
            ownerAddress: walletAddress,
            page: 1,
            limit: 1000,
          },
        }),
      });

      const dasData = await dasRes.json();
      const assets = dasData.result?.items ?? [];

      for (const asset of assets) {
        const attrs =
          (asset.content?.metadata?.attributes as
            | { trait_type: string; value: string }[]
            | undefined) ?? [];
        const achievementAttr = attrs.find(
          (a) => a.trait_type === "achievement_id"
        );

        if (achievementAttr) {
          await supabase.rpc("unlock_achievement", {
            p_user_id: profile.id,
            p_achievement_id: achievementAttr.value,
            p_asset_address: asset.id as string,
          });
          results.achievements++;
        }
      }
    } catch (err) {
      console.error("[resync] DAS API error:", err);
    }
  }

  return NextResponse.json({
    synced: true,
    wallet: walletAddress,
    ...results,
  });
}
