/**
 * XP Token Service — reads soulbound Token-2022 XP balances.
 *
 * Per SPEC.md §1: XP is a soulbound fungible SPL token using Token-2022.
 * Per ARCHITECTURE.md: Leaderboard derived from XP token balances via Helius DAS API.
 * Per ecosystem.md §Data Indexing: Use Helius DAS API for token queries.
 *
 * @module services/xp-service
 */

import { RPCError, WalletNotConnectedError } from "@/lib/errors";
import { deriveLevel, levelProgress } from "@/lib/constants";

// ─── Types ──────────────────────────────────────────────────────────

export interface XPBalance {
  /** Raw XP amount from Token-2022 balance */
  xp: number;
  /** Derived level per SPEC.md §1: floor(sqrt(xp / 100)) */
  level: number;
  /** Progress percentage (0–100) to next level */
  progress: number;
  /** Season number this XP belongs to */
  season: number;
}

export interface LeaderboardEntry {
  rank: number;
  wallet: string;
  displayName: string;
  xp: number;
  level: number;
}

// ─── Service ────────────────────────────────────────────────────────

/**
 * Fetches the XP balance for a wallet from the current season's Token-2022 mint.
 * Uses Helius DAS API `getAssetsByOwner` to find Token-2022 accounts.
 *
 * @param walletAddress - The wallet public key string
 * @param rpcEndpoint - Helius RPC endpoint URL
 * @returns XP balance with derived level info
 * @throws {WalletNotConnectedError} If walletAddress is empty
 * @throws {RPCError} If the Helius RPC call fails
 */
export async function fetchXPBalance(
  walletAddress: string,
  rpcEndpoint: string
): Promise<XPBalance> {
  if (!walletAddress) {
    throw new WalletNotConnectedError();
  }

  try {
    const response = await fetch(rpcEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "xp-balance",
        method: "getAssetsByOwner",
        params: {
          ownerAddress: walletAddress,
          page: 1,
          limit: 100,
          displayOptions: {
            showFungible: true,
          },
        },
      }),
    });

    if (!response.ok) {
      throw new RPCError("getAssetsByOwner", `HTTP ${response.status}`);
    }

    const data = await response.json();
    const items = data?.result?.items ?? [];

    // Find the XP token by matching metadata name pattern "Superteam Academy XP S{n}"
    const xpToken = items.find(
      (item: { content?: { metadata?: { name?: string } } }) =>
        item?.content?.metadata?.name?.startsWith("Superteam Academy XP")
    );

    if (!xpToken) {
      // No XP token found — learner has 0 XP
      return { xp: 0, level: 0, progress: 0, season: 0 };
    }

    const xp = Number(xpToken.token_info?.balance ?? 0);
    const seasonMatch = xpToken.content?.metadata?.name?.match(/S(\d+)/);
    const season = seasonMatch ? Number(seasonMatch[1]) : 1;

    return {
      xp,
      level: deriveLevel(xp),
      progress: levelProgress(xp),
      season,
    };
  } catch (error) {
    if (
      error instanceof WalletNotConnectedError ||
      error instanceof RPCError
    ) {
      throw error;
    }
    throw new RPCError("getAssetsByOwner", error);
  }
}

/**
 * Fetches the live leaderboard from Helius DAS API by querying all holders
 * of the current season's XP mint.
 *
 * Per SPEC.md §1:
 * ```typescript
 * const holders = await getTokenHolders(currentSeasonMint);
 * const leaderboard = holders
 *   .sort((a, b) => b.balance - a.balance)
 *   .map((h, i) => ({ rank: i + 1, wallet: h.owner, xp: h.balance }));
 * ```
 *
 * @param mintAddress - The current season's XP Token-2022 mint address
 * @param rpcEndpoint - Helius RPC endpoint URL
 * @param limit - Maximum entries to return (default 50)
 * @returns Sorted leaderboard entries
 * @throws {RPCError} If the Helius RPC call fails
 */
export async function fetchLeaderboard(
  mintAddress: string,
  rpcEndpoint: string,
  limit: number = 50
): Promise<LeaderboardEntry[]> {
  if (!mintAddress) {
    // No mint configured — return empty leaderboard
    return [];
  }

  try {
    const response = await fetch(rpcEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "leaderboard",
        method: "getTokenAccounts",
        params: {
          mint: mintAddress,
          page: 1,
          limit,
        },
      }),
    });

    if (!response.ok) {
      throw new RPCError("getTokenAccounts", `HTTP ${response.status}`);
    }

    const data = await response.json();
    const accounts = data?.result?.token_accounts ?? [];

    return accounts
      .map(
        (acc: { owner: string; amount: string | number }) => ({
          wallet: acc.owner,
          displayName: `${acc.owner.slice(0, 4)}...${acc.owner.slice(-4)}`,
          xp: Number(acc.amount),
          level: deriveLevel(Number(acc.amount)),
          rank: 0,
        })
      )
      .sort((a: { xp: number }, b: { xp: number }) => b.xp - a.xp)
      .map((entry: LeaderboardEntry, index: number) => ({
        ...entry,
        rank: index + 1,
      }))
      .slice(0, limit);
  } catch (error) {
    if (error instanceof RPCError) throw error;
    throw new RPCError("getTokenAccounts", error);
  }
}
