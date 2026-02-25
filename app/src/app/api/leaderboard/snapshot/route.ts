import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { connection } from "@/lib/solana/connection";
import { XP_MINT_ADDRESS } from "@/lib/constants";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/**
 * POST /api/leaderboard/snapshot
 * Records current XP balances into xp_snapshots table.
 * Protected by CRON_SECRET header to prevent unauthorized access.
 */
export async function POST(req: Request) {
  // Verify authorization
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!XP_MINT_ADDRESS) {
    return NextResponse.json(
      { error: "XP_MINT_ADDRESS not configured" },
      { status: 500 },
    );
  }

  try {
    const supabase = getSupabaseAdmin();
    const mint = new PublicKey(XP_MINT_ADDRESS);
    const largestAccounts = await connection.getTokenLargestAccounts(mint);

    const rows: { wallet: string; xp_balance: number }[] = [];

    for (const account of largestAccounts.value) {
      if (account.uiAmount === null || account.uiAmount === 0) continue;

      const accountInfo = await connection.getParsedAccountInfo(
        account.address,
      );
      const data = accountInfo.value?.data;
      const parsed =
        typeof data === "object" && data !== null && "parsed" in data
          ? (data as { parsed: { info?: { owner?: string } } }).parsed
          : undefined;
      const owner = parsed?.info?.owner;
      if (!owner) continue;

      rows.push({ wallet: owner, xp_balance: account.uiAmount });
    }

    if (rows.length === 0) {
      return NextResponse.json({ snapshotted: 0 });
    }

    const { error } = await supabase.from("xp_snapshots").insert(rows);

    if (error) {
      console.error("[snapshot] Supabase insert error:", error);
      return NextResponse.json(
        { error: "Failed to insert snapshots" },
        { status: 500 },
      );
    }

    return NextResponse.json({ snapshotted: rows.length });
  } catch (err) {
    console.error("[snapshot] Error:", err);
    return NextResponse.json(
      { error: "Snapshot failed" },
      { status: 500 },
    );
  }
}
