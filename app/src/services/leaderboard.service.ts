import type { LeaderboardService } from "./interfaces";
import type { LeaderboardEntry, TimeFilter } from "@/types";
import { getLeaderboard } from "@/data/leaderboard";
import { getLocalXp } from "./xp.service";

/**
 * Stub leaderboard service using mock data + localStorage XP.
 *
 * On-chain swap:
 * - getEntries → Helius DAS getTokenAccounts for XP mint, sorted by balance desc
 * - Endpoint: GET /api/leaderboard?timeframe=weekly&course=all&page=1
 * - Cache with 5 min TTL server-side
 *
 * Helius DAS call:
 *   POST https://devnet.helius-rpc.com/?api-key=KEY
 *   { method: "getTokenAccounts", params: { mint: XP_MINT, page: 1, limit: 100 } }
 */
export class LocalLeaderboardService implements LeaderboardService {
  async getEntries(
    timeframe: TimeFilter,
    _courseFilter?: string,
    page: number = 1,
    pageSize: number = 10,
  ): Promise<{ entries: LeaderboardEntry[]; total: number }> {
    const allEntries = getLeaderboard(timeframe);
    const total = allEntries.length;
    const start = (page - 1) * pageSize;
    const entries = allEntries.slice(start, start + pageSize);

    return { entries, total };
  }

  async getRank(wallet: string): Promise<number | null> {
    const xp = getLocalXp(wallet);
    if (xp <= 0) return null;
    const entries = getLeaderboard("all-time");
    const rank = entries.filter((e) => e.xp > xp).length + 1;
    return rank;
  }
}
