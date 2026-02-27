/**
 * Custom Solana RPC Indexer
 *
 * Fetches Token-2022 XP holders directly from Solana RPC (getProgramAccounts
 * with memcmp filter on mint). Works with any standard RPC endpoint — no
 * third-party API key required. This is the default indexer.
 */
import { Connection, PublicKey } from '@solana/web3.js';
import { XP_MINT, TOKEN_2022_PROGRAM_ID } from '../program-config';
import { calculateLevel } from '../program-client';
import type {
  LeaderboardIndexerClient,
  IndexedLeaderboardEntry,
  WalletRankResult,
  IndexerProvider,
} from './types';

// Token-2022 account layout offsets
const MINT_OFFSET = 0; // mint pubkey starts at byte 0
const OWNER_OFFSET = 32; // owner pubkey starts at byte 32
const AMOUNT_OFFSET = 64; // u64 amount starts at byte 64

export class CustomRpcIndexer implements LeaderboardIndexerClient {
  readonly name = 'Custom Indexer (RPC)';
  readonly provider: IndexerProvider = 'custom';

  private connection: Connection;

  constructor(rpcUrl?: string) {
    const endpoint =
      rpcUrl || process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';
    this.connection = new Connection(endpoint, 'confirmed');
  }

  /**
   * Fetch all Token-2022 accounts for the XP mint and rank by balance.
   */
  async fetchLeaderboard(limit = 100): Promise<IndexedLeaderboardEntry[]> {
    try {
      // Get all token accounts for the XP mint via getProgramAccounts
      const accounts = await this.connection.getProgramAccounts(TOKEN_2022_PROGRAM_ID, {
        filters: [
          { dataSize: 165 }, // Standard token account size
          {
            memcmp: {
              offset: MINT_OFFSET,
              bytes: XP_MINT.toBase58(),
            },
          },
        ],
      });

      // Parse accounts and collect balances
      const holders: { wallet: PublicKey; xpBalance: number }[] = [];

      for (const { account } of accounts) {
        const data = account.data;
        if (data.length < AMOUNT_OFFSET + 8) continue;

        const owner = new PublicKey(data.slice(OWNER_OFFSET, OWNER_OFFSET + 32));

        // Read little-endian u64 balance
        const lo = data.readUInt32LE(AMOUNT_OFFSET);
        const hi = data.readUInt32LE(AMOUNT_OFFSET + 4);
        const balance = hi * 0x100000000 + lo;

        if (balance > 0) {
          holders.push({ wallet: owner, xpBalance: balance });
        }
      }

      // Sort descending by balance and assign ranks
      holders.sort((a, b) => b.xpBalance - a.xpBalance);

      return holders.slice(0, limit).map((h, i) => ({
        rank: i + 1,
        wallet: h.wallet,
        xpBalance: h.xpBalance,
        level: calculateLevel(h.xpBalance),
      }));
    } catch (error) {
      console.error('[CustomRpcIndexer] fetchLeaderboard error:', error);
      return [];
    }
  }

  /**
   * Derive wallet rank from full holder list.
   */
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
      console.error('[CustomRpcIndexer] fetchWalletRank error:', error);
      return null;
    }
  }
}
