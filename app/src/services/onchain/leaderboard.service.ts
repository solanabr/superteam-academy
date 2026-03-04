import type { LeaderboardService } from "../interfaces";
import type { LeaderboardEntry, TimeFilter } from "@/types";
import { deriveLevel } from "@/types";

/* eslint-disable @typescript-eslint/no-explicit-any */

const ACCENTS = ["#34d399", "#eab308", "#22d3ee", "#a78bfa", "#f472b6"];

/**
 * Devnet leaderboard service — fetches from the /api/leaderboard route
 * which in turn calls Helius DAS getTokenAccounts for the XP mint.
 */
export class DevnetLeaderboardService implements LeaderboardService {
  async getEntries(
    timeframe: TimeFilter,
    _courseFilter?: string,
    page: number = 1,
    pageSize: number = 10,
  ): Promise<{ entries: LeaderboardEntry[]; total: number }> {
    try {
      const params = new URLSearchParams({
        timeframe,
        page: String(page),
        pageSize: String(pageSize),
      });
      const res = await fetch(`/api/leaderboard?${params}`);
      if (!res.ok) throw new Error("Failed to fetch leaderboard");
      const data = await res.json();
      return { entries: data.entries, total: data.total };
    } catch {
      return { entries: [], total: 0 };
    }
  }

  async getRank(wallet: string): Promise<number | null> {
    try {
      // Fetch all entries to find the wallet's rank
      const { entries } = await this.getEntries("all-time", undefined, 1, 1000);
      const entry = entries.find(
        (e: LeaderboardEntry) => e.walletAddress === wallet,
      );
      return entry?.rank ?? null;
    } catch {
      return null;
    }
  }
}

/**
 * Fetch leaderboard from Helius DAS — used by the API route (server-side).
 * Returns raw entries sorted by XP balance descending.
 */
export async function fetchHeliusLeaderboard(
  heliusUrl: string,
  xpMint: string,
): Promise<LeaderboardEntry[]> {
  const response = await fetch(heliusUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "leaderboard",
      method: "getTokenAccounts",
      params: { mint: xpMint, page: 1, limit: 1000 },
    }),
  });

  const data = await response.json();
  if (!data.result?.token_accounts) return [];

  return data.result.token_accounts
    .map((account: any) => ({
      owner: account.owner,
      amount: Number(account.amount),
    }))
    .sort((a: any, b: any) => b.amount - a.amount)
    .map((account: any, index: number) => {
      const wallet = account.owner;
      const xp = account.amount;
      const short = wallet.slice(0, 6);
      return {
        rank: index + 1,
        name: `Learner ${short}`,
        username: `learner_${short.toLowerCase()}`,
        initials: short.slice(0, 2).toUpperCase(),
        level: deriveLevel(xp),
        xp,
        streak: 0,
        accent: ACCENTS[index % ACCENTS.length] ?? "#34d399",
        walletAddress: wallet,
      } satisfies LeaderboardEntry;
    });
}
