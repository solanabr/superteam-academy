/**
 * Indexer Factory
 *
 * Constructs the correct LeaderboardIndexerClient based on
 * persisted admin settings (or env-var fallbacks).
 */
import type { IndexerProvider, IndexerSettings, LeaderboardIndexerClient } from './types';
import { DEFAULT_INDEXER_SETTINGS } from './types';
import { CustomRpcIndexer } from './custom-indexer';
import { HeliusIndexer } from './helius-indexer';
import { AlchemyIndexer } from './alchemy-indexer';

// In-memory cache so we don't re-read DB on every request during
// the same server lifetime. Null means "not loaded yet".
let cachedSettings: IndexerSettings | null = null;
let cachedProvider: LeaderboardIndexerClient | null = null;

/**
 * Build a provider from explicit settings (no caching).
 */
export function buildIndexer(settings: IndexerSettings): LeaderboardIndexerClient {
  switch (settings.activeProvider) {
    case 'helius':
      return new HeliusIndexer(settings.helius.apiKey, settings.helius.rpcUrl);
    case 'alchemy':
      return new AlchemyIndexer(settings.alchemy.apiKey, settings.alchemy.rpcUrl);
    case 'custom':
    default:
      return new CustomRpcIndexer(settings.custom.rpcUrl);
  }
}

/**
 * Build a provider from just the provider key + env vars
 * (handy for quick tests).
 */
export function buildIndexerForProvider(provider: IndexerProvider): LeaderboardIndexerClient {
  switch (provider) {
    case 'helius':
      return new HeliusIndexer();
    case 'alchemy':
      return new AlchemyIndexer();
    case 'custom':
    default:
      return new CustomRpcIndexer();
  }
}

/**
 * Get (or build) the currently active indexer.
 * On first call it reads settings from DB; afterwards it caches in memory.
 */
export async function getActiveIndexer(): Promise<LeaderboardIndexerClient> {
  if (cachedProvider) return cachedProvider;

  const settings = await loadSettings();
  cachedProvider = buildIndexer(settings);
  return cachedProvider;
}

/**
 * Flush the cached provider so it's rebuilt on next request.
 * Call this after the admin saves new settings.
 */
export function invalidateIndexerCache(): void {
  cachedProvider = null;
  cachedSettings = null;
}

/**
 * Load settings from DB, falling back to env-based defaults.
 */
async function loadSettings(): Promise<IndexerSettings> {
  if (cachedSettings) return cachedSettings;

  try {
    // Dynamic import to avoid pulling mongoose into client bundles
    const { IndexerSettingsModel } = await import('@/models/IndexerSettings');
    const { connectToDatabase } = await import('@/lib/mongodb');
    await connectToDatabase();

    const doc = await IndexerSettingsModel.findOne({ key: 'indexer' }).lean();
    if (doc) {
      cachedSettings = {
        activeProvider: doc.activeProvider as IndexerProvider,
        helius: {
          apiKey: doc.heliusApiKey || '',
          rpcUrl: doc.heliusRpcUrl || '',
        },
        alchemy: {
          apiKey: doc.alchemyApiKey || '',
          rpcUrl: doc.alchemyRpcUrl || '',
        },
        custom: {
          rpcUrl: doc.customRpcUrl || '',
        },
      };
      return cachedSettings;
    }
  } catch {
    // DB not available — use defaults
  }

  cachedSettings = { ...DEFAULT_INDEXER_SETTINGS };
  return cachedSettings;
}
