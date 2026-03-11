/**
 * In-memory binary cache for compiled Solana programs.
 *
 * Solves Cloud Run multi-instance routing: after a successful build, the
 * /api/build-program route pre-fetches the binary from the same Cloud Run
 * instance and stores it here. The /api/deploy/[uuid] route checks this
 * cache first, avoiding 404s when Cloud Run routes the deploy request to
 * a different instance than the one that built the binary.
 */

interface CachedBinary {
  data: ArrayBuffer;
  timestamp: number;
}

const cache = new Map<string, CachedBinary>();
const TTL_MS = 10 * 60 * 1000; // 10 minutes

export function getCachedBinary(uuid: string): ArrayBuffer | null {
  const entry = cache.get(uuid);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > TTL_MS) {
    cache.delete(uuid);
    return null;
  }
  return entry.data;
}

export function setCachedBinary(uuid: string, data: ArrayBuffer): void {
  cache.set(uuid, { data, timestamp: Date.now() });
}

export function evictExpiredBinaries(): void {
  const now = Date.now();
  for (const [uuid, entry] of cache) {
    if (now - entry.timestamp > TTL_MS) {
      cache.delete(uuid);
    }
  }
}
