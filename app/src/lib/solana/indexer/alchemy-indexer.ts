/**
 * Alchemy Enhanced API Indexer
 *
 * Uses Alchemy's getTokenBalances / getTokenAccountsByOwner equivalent
 * to fetch XP Token-2022 holder balances. Requires an Alchemy API key.
 *
 * NOTE: Alchemy Solana supports getProgramAccounts with filters — so
 * we use the same RPC-level approach as the custom indexer but routed
 * through Alchemy's enhanced infrastructure for speed & reliability.
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

// Token-2022 account layout offsets (same as custom indexer)
const MINT_OFFSET = 0;
const OWNER_OFFSET = 32;
const AMOUNT_OFFSET = 64;

export class AlchemyIndexer implements LeaderboardIndexerClient {
  readonly name = 'Alchemy Enhanced API';
  readonly provider: IndexerProvider = 'alchemy';

  private connection: Connection;
  private apiKey: string;

  constructor(apiKey?: string, rpcUrl?: string) {
    this.apiKey = apiKey || process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || '';
    const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';

    const endpoint =
      rpcUrl ||
      process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL ||
      (this.apiKey
        ? `https://solana-${network}.g.alchemy.com/v2/${this.apiKey}`
        : process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
          'https://api.devnet.solana.com');

    this.connection = new Connection(endpoint, 'confirmed');
  }

  /**
   * Fetch all XP token holders via Alchemy-backed getProgramAccounts.
   */
  async fetchLeaderboard(limit = 100): Promise<IndexedLeaderboardEntry[]> {
    try {
      const accounts = await this.connection.getProgramAccounts(
        TOKEN_2022_PROGRAM_ID,
        {
          filters: [
            { dataSize: 165 },
            {
              memcmp: {
                offset: MINT_OFFSET,
                bytes: XP_MINT.toBase58(),
              },
            },
          ],
        }
      );

      const holders: { wallet: PublicKey; xpBalance: number }[] = [];

      for (const { account } of accounts) {
        const data = account.data;
        if (data.length < AMOUNT_OFFSET + 8) continue;

        const owner = new PublicKey(data.slice(OWNER_OFFSET, OWNER_OFFSET + 32));

        const lo = data.readUInt32LE(AMOUNT_OFFSET);
        const hi = data.readUInt32LE(AMOUNT_OFFSET + 4);
        const balance = hi * 0x100000000 + lo;

        if (balance > 0) {
          holders.push({ wallet: owner, xpBalance: balance });
        }
      }

      holders.sort((a, b) => b.xpBalance - a.xpBalance);

      return holders.slice(0, limit).map((h, i) => ({
        rank: i + 1,
        wallet: h.wallet,
        xpBalance: h.xpBalance,
        level: calculateLevel(h.xpBalance),
      }));
    } catch (error) {
      console.error('[AlchemyIndexer] fetchLeaderboard error:', error);
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
      console.error('[AlchemyIndexer] fetchWalletRank error:', error);
      return null;
    }
  }
}
