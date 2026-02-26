import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { xpProgress } from "@/lib/constants";
import type { LeaderboardEntry } from "@/types";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const HELIUS_RPC =
  process.env.NEXT_PUBLIC_HELIUS_RPC ??
  `https://devnet.helius-rpc.com/?api-key=${process.env.NEXT_PUBLIC_HELIUS_API_KEY ?? ""}`;

const XP_MINT =
  process.env.NEXT_PUBLIC_XP_MINT ??
  "XPTkMWRRH1QLbAYGSkwNmmHF8Q75RURmC269nHVhUoe";

interface TokenAccount {
  address: string;
  mint: string;
  owner: string;
  amount: number;
  delegatedAmount: number;
  frozen: boolean;
}

async function getXpHolders(): Promise<Map<string, number>> {
  const holders = new Map<string, number>();
  let page = 1;

  // Paginate through all token accounts for the XP mint
  while (true) {
    const res = await fetch(HELIUS_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "leaderboard",
        method: "getTokenAccounts",
        params: { mint: XP_MINT, page, limit: 1000 },
      }),
    });

    const json = await res.json();
    const accounts: TokenAccount[] = json?.result?.token_accounts ?? [];

    if (accounts.length === 0) break;

    for (const acc of accounts) {
      if (acc.amount > 0) {
        holders.set(acc.owner, (holders.get(acc.owner) ?? 0) + acc.amount);
      }
    }

    // Helius returns up to 1000 per page
    if (accounts.length < 1000) break;
    page++;
  }

  return holders;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const limit = Math.min(Number(searchParams.get("limit") ?? 50), 200);
    const offset = Number(searchParams.get("offset") ?? 0);

    // Fetch on-chain XP balances from Helius DAS API
    const xpByWallet = await getXpHolders();

    if (xpByWallet.size === 0) {
      return NextResponse.json({ entries: [], total: 0 });
    }

    const total = xpByWallet.size;

    // Sort by XP descending
    const sorted = Array.from(xpByWallet.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(offset, offset + limit);

    const walletAddresses = sorted.map(([wallet]) => wallet);

    // Look up profiles by wallet_address
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, username, display_name, avatar_url, wallet_address")
      .in("wallet_address", walletAddresses);

    const profileByWallet = new Map(
      (profiles ?? []).map((p: Record<string, unknown>) => [
        p.wallet_address as string,
        p,
      ]),
    );

    const entries: LeaderboardEntry[] = sorted.map(([wallet, xp], i) => {
      const profile = profileByWallet.get(wallet);
      const info = xpProgress(xp);
      return {
        rank: offset + i + 1,
        walletAddress: wallet,
        username: (profile?.username as string) ?? undefined,
        displayName: (profile?.display_name as string) ?? undefined,
        avatarUrl: (profile?.avatar_url as string) ?? undefined,
        xp,
        level: info.level,
      };
    });

    return NextResponse.json({ entries, total });
  } catch (err) {
    console.error("[Leaderboard API] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
