/**
 * Helius DAS API Indexer
 *
 * Wraps the existing Helius client into the LeaderboardIndexerClient
 * interface so it can be swapped interchangeably with the custom and
 * Alchemy indexers.
 */
import { PublicKey } from '@solana/web3.js';
import { XP_MINT } from '../program-config';
import { calculateLevel } from '../program-client';
import type {
  LeaderboardIndexerClient,
  IndexedLeaderboardEntry,
  WalletRankResult,
  IndexerProvider,
} from './types';

interface HeliusTokenHolder {
  owner: string;
  balance: number;
  mint: string;
}

interface TokenHoldersResponse {
  token_accounts: HeliusTokenHolder[];
  cursor?: string;
}

export class HeliusIndexer implements LeaderboardIndexerClient {
  readonly name = 'Helius DAS API';
  readonly provider: IndexerProvider = 'helius';

  private apiKey: string;
  private rpcUrl: string;

  constructor(apiKey?: string, rpcUrl?: string) {
    this.apiKey = apiKey || process.env.NEXT_PUBLIC_HELIUS_API_KEY || '';
    const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';
    this.rpcUrl =
      rpcUrl ||
      process.env.NEXT_PUBLIC_HELIUS_RPC_URL ||
      (this.apiKey
        ? `https://${network}.helius-rpc.com/?api-key=${this.apiKey}`
        : '');
  }

  async fetchLeaderboard(limit = 100): Promise<IndexedLeaderboardEntry[]> {
    if (!this.apiKey) {
      console.warn('[HeliusIndexer] No API key configured');
      return [];
    }

    try {
      const url = `https://api.helius.xyz/v0/token-holders?api-key=${this.apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mint: XP_MINT.toBase58(),
          limit,
        }),
      });

      if (!response.ok) {
        throw new Error(`Helius API returned ${response.status}: ${response.statusText}`);
      }

      const data: TokenHoldersResponse = await response.json();

      const entries: IndexedLeaderboardEntry[] = data.token_accounts
        .map((holder) => ({
          rank: 0,
          wallet: new PublicKey(holder.owner),
          xpBalance: holder.balance,
          level: calculateLevel(holder.balance),
        }))
        .sort((a, b) => b.xpBalance - a.xpBalance)
        .map((entry, index) => ({ ...entry, rank: index + 1 }));

      return entries.slice(0, limit);
    } catch (error) {
      console.error('[HeliusIndexer] fetchLeaderboard error:', error);
      return [];
    }
  }

  async fetchWalletRank(wallet: PublicKey): Promise<WalletRankResult | null> {
    try {
      const leaderboard = await this.fetchLeaderboard(10_000);
      const walletStr = wallet.toBase58();
      const entry = leaderboard.find((e) => e.wallet.toBase58() === walletStr);

      if (!entry) {
        return {
          rank: leaderboard.length + 1,
          xpBalance: 0,
          level: 0,
          totalParticipants: leaderboard.length,
        };
      }

      return {
        rank: entry.rank,
        xpBalance: entry.xpBalance,
        level: entry.level,
        totalParticipants: leaderboard.length,
      };
    } catch (error) {
      console.error('[HeliusIndexer] fetchWalletRank error:', error);
      return null;
    }
  }
}
