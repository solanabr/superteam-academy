/**
 * Indexer Provider Types
 *
 * Shared types & interface for all leaderboard indexer backends
 * (Custom RPC, Helius DAS, Alchemy).
 */
import { PublicKey } from '@solana/web3.js';

// ==================== Provider Enum ====================

export type IndexerProvider = 'custom' | 'helius' | 'alchemy';

export const INDEXER_PROVIDERS: {
  value: IndexerProvider;
  label: string;
  description: string;
}[] = [
  {
    value: 'custom',
    label: 'Custom Indexer (RPC)',
    description:
      'Queries Solana RPC directly for Token-2022 accounts. No third-party API key needed.',
  },
  {
    value: 'helius',
    label: 'Helius DAS API',
    description:
      'Uses Helius getTokenHolders / searchAssets for fast indexed queries. Requires API key.',
  },
  {
    value: 'alchemy',
    label: 'Alchemy Enhanced API',
    description:
      'Uses Alchemy getTokenBalances / getTokenMetadata for holder queries. Requires API key.',
  },
];

// ==================== Leaderboard Entry ====================

export interface IndexedLeaderboardEntry {
  rank: number;
  wallet: PublicKey;
  xpBalance: number;
  level: number;
}

export interface WalletRankResult {
  rank: number;
  xpBalance: number;
  level: number;
  totalParticipants: number;
}

// ==================== Provider Interface ====================

export interface LeaderboardIndexerClient {
  /** Human-readable provider name */
  readonly name: string;

  /** Underlying provider key */
  readonly provider: IndexerProvider;

  /**
   * Return sorted leaderboard entries (highest XP first).
   * @param limit  max entries to return
   */
  fetchLeaderboard(limit?: number): Promise<IndexedLeaderboardEntry[]>;

  /**
   * Return a specific wallet's rank + stats.
   * May make an extra call if the wallet is outside the cached set.
   */
  fetchWalletRank(wallet: PublicKey): Promise<WalletRankResult | null>;
}

// ==================== Persisted Settings ====================

export interface IndexerSettings {
  activeProvider: IndexerProvider;
  helius: {
    apiKey: string;
    rpcUrl: string;
  };
  alchemy: {
    apiKey: string;
    rpcUrl: string;
  };
  custom: {
    rpcUrl: string;
  };
}

export const DEFAULT_INDEXER_SETTINGS: IndexerSettings = {
  activeProvider: 'custom',
  helius: {
    apiKey: '',
    rpcUrl: '',
  },
  alchemy: {
    apiKey: '',
    rpcUrl: '',
  },
  custom: {
    rpcUrl: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  },
};
