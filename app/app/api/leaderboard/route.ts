import { NextRequest, NextResponse } from "next/server";
import type { LeaderboardEntry } from "@/lib/services/learning-progress";

const XP_MINT = process.env.NEXT_PUBLIC_XP_MINT ?? "";
const HELIUS_RPC = process.env.NEXT_PUBLIC_HELIUS_RPC ?? "";
const HELIUS_API_KEY = process.env.HELIUS_API_KEY ?? "";
const CLUSTER = process.env.NEXT_PUBLIC_CLUSTER ?? "devnet";

function getHeliusUrl(): string | null {
  if (HELIUS_RPC) return HELIUS_RPC;
  if (HELIUS_API_KEY) {
    const base = CLUSTER === "mainnet-beta"
      ? "https://mainnet.helius-rpc.com"
      : "https://devnet.helius-rpc.com";
    return `${base}/?api-key=${HELIUS_API_KEY}`;
  }
  return null;
}

/** DAS getTokenAccounts response item (flexible shape) */
interface TokenAccountItem {
  owner?: string;
  token_amount?: { amount?: string };
  amount?: string;
}

interface GetTokenAccountsResponse {
  result?: {
    token_accounts?: TokenAccountItem[];
    items?: TokenAccountItem[];
  };
  error?: { message?: string };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const timeframe = searchParams.get("timeframe") ?? "all-time";

  if (!XP_MINT) {
    return NextResponse.json(
      { error: "XP mint not configured", entries: [] },
      { status: 200 }
    );
  }

  const url = getHeliusUrl();
  if (!url) {
    return NextResponse.json(
      { error: "Helius RPC not configured", entries: [] },
      { status: 200 }
    );
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "1",
        method: "getTokenAccounts",
        params: {
          mint: XP_MINT,
          limit: 1000,
        },
      }),
    });

    const data = (await response.json()) as GetTokenAccountsResponse;
    if (data.error || !data.result) {
      return NextResponse.json(
        { error: data.error?.message ?? "DAS request failed", entries: [] },
        { status: 200 }
      );
    }

    const accounts = data.result.token_accounts ?? data.result.items ?? [];
    const entries: LeaderboardEntry[] = accounts
      .map((acc) => {
        const owner = acc.owner ?? "";
        const amountStr = acc.token_amount?.amount ?? acc.amount ?? "0";
        const xp = parseInt(amountStr, 10) || 0;
        return { owner, xp };
      })
      .filter((e) => e.owner && e.xp > 0)
      .sort((a, b) => b.xp - a.xp)
      .map((e, i) => ({
        rank: i + 1,
        wallet: e.owner,
        xp: e.xp,
      }));

    return NextResponse.json({ entries });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json(
      { error: msg, entries: [] },
      { status: 200 }
    );
  }
}
