import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { ApiError, ApiErrorCode, apiErrorResponse, handleApiError } from "@/lib/api/errors";

const PUBLIC_CACHE = "public, s-maxage=60, stale-while-revalidate=300";

function buildHeliusUrl(): string {
  const apiKey = (process.env.HELIUS_API_KEY ?? "").trim();
  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? "devnet";
  if (apiKey) {
    const subdomain = network === "mainnet-beta" ? "mainnet" : "devnet";
    return `https://${subdomain}.helius-rpc.com/?api-key=${apiKey}`;
  }
  return process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
}

interface TokenHolder {
  owner: string;
  amount: number;
}

async function fetchXpLeaderboard(
  xpMintAddress: string,
  limit = 100
): Promise<TokenHolder[]> {
  const response = await fetch(buildHeliusUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "leaderboard",
      method: "getTokenAccounts",
      params: { mint: xpMintAddress, limit, page: 1 },
    }),
  });
  if (!response.ok) return [];
  const data = (await response.json()) as {
    result?: { token_accounts?: Array<{ owner: string; amount: number }> };
    error?: unknown;
  };
  if (data.error) return [];
  const accounts = data.result?.token_accounts ?? [];
  return accounts
    .map((a) => ({ owner: a.owner, amount: Number(a.amount) }))
    .sort((a, b) => b.amount - a.amount);
}

export async function GET(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

    if (!checkRateLimit(`helius-lb:${ip}`, 60, 60_000)) {
      throw new ApiError(ApiErrorCode.RATE_LIMITED, "Too many requests");
    }

    // Timeframe param accepted for future use.
    // All timeframes currently return the same data: XP is cumulative on-chain
    // and Token-2022 accounts carry no per-period timestamps.
    const timeframe = new URL(request.url).searchParams.get("timeframe") ?? "allTime";
    void timeframe;

    const xpMint = (process.env.NEXT_PUBLIC_XP_MINT ?? "").trim();
    if (!xpMint) {
      throw new ApiError(ApiErrorCode.INTERNAL_ERROR, "XP mint not configured");
    }

    let holders: TokenHolder[];
    try {
      holders = await fetchXpLeaderboard(xpMint);
    } catch (err) {
      throw new ApiError(
        ApiErrorCode.ON_CHAIN_ERROR,
        "Failed to fetch leaderboard",
        err instanceof Error ? err.message : undefined
      );
    }

    return NextResponse.json(holders, {
      headers: { "Cache-Control": PUBLIC_CACHE },
    });
  } catch (err: unknown) {
    return apiErrorResponse(handleApiError(err));
  }
}
