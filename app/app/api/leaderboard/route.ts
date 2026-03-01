import { NextRequest, NextResponse } from "next/server";
import type { LeaderboardEntry } from "@/lib/services/learning-progress";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:3001";
const BACKEND_API_TOKEN = process.env.BACKEND_API_TOKEN ?? "";
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

async function fetchFromBackend(): Promise<LeaderboardEntry[] | null> {
  if (!BACKEND_URL || !BACKEND_API_TOKEN) return null;
  try {
    const res = await fetch(
      `${BACKEND_URL.replace(/\/$/, "")}/v1/academy/leaderboard`,
      { headers: { "X-API-Key": BACKEND_API_TOKEN } }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { entries?: Array<{ rank?: number; wallet?: string; xp?: number; coursesCompleted?: number }> };
    const entries = data.entries ?? [];
    if (entries.length === 0) return null;
    return entries.map((e) => ({
      rank: e.rank ?? 0,
      wallet: e.wallet ?? "",
      xp: e.xp ?? 0,
    }));
  } catch {
    return null;
  }
}

async function fetchFromHelius(): Promise<LeaderboardEntry[]> {
  if (!XP_MINT) return [];
  const url = getHeliusUrl();
  if (!url) return [];
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "1",
        method: "getTokenAccounts",
        params: { mint: XP_MINT, limit: 1000 },
      }),
    });
    const data = (await response.json()) as GetTokenAccountsResponse;
    if (data.error || !data.result) return [];
    const accounts = data.result.token_accounts ?? data.result.items ?? [];
    return accounts
      .map((acc) => {
        const owner = acc.owner ?? "";
        const amountStr = acc.token_amount?.amount ?? acc.amount ?? "0";
        const xp = parseInt(amountStr, 10) || 0;
        return { owner, xp };
      })
      .filter((e) => e.owner && e.xp > 0)
      .sort((a, b) => b.xp - a.xp)
      .map((e, i) => ({ rank: i + 1, wallet: e.owner, xp: e.xp }));
  } catch {
    return [];
  }
}

export async function GET(_request: NextRequest) {
  const backend = await fetchFromBackend();
  if (backend && backend.length > 0) {
    return NextResponse.json({ entries: backend });
  }
  const entries = await fetchFromHelius();
  return NextResponse.json({ entries });
}
