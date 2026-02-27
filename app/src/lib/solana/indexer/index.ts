/**
 * Indexer Module Barrel Export
 */

// Types & constants
export type {
  IndexerProvider,
  IndexedLeaderboardEntry,
  WalletRankResult,
  LeaderboardIndexerClient,
  IndexerSettings,
} from './types';
export { INDEXER_PROVIDERS, DEFAULT_INDEXER_SETTINGS } from './types';

// Provider implementations
export { CustomRpcIndexer } from './custom-indexer';
export { HeliusIndexer } from './helius-indexer';
export { AlchemyIndexer } from './alchemy-indexer';

// Factory
export {
  buildIndexer,
  buildIndexerForProvider,
  getActiveIndexer,
  invalidateIndexerCache,
} from './factory';
