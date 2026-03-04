/**
 * Lightweight in-memory cache with TTL and request deduplication.
 * Designed for server-side use in Next.js — prevents duplicate RPC calls
 * within a request lifetime and across close-together renders.
 */

interface CacheEntry<T> {
	value: T;
	expiresAt: number;
}

/** In-flight promise deduplication + TTL result cache */
export class RequestCache {
	private cache = new Map<string, CacheEntry<unknown>>();
	private inflight = new Map<string, Promise<unknown>>();
	private defaultTtlMs: number;

	constructor(defaultTtlMs = 15_000) {
		this.defaultTtlMs = defaultTtlMs;
	}

	/**
	 * Get a cached value or execute the fetcher. Concurrent calls with the
	 * same key will share a single in-flight promise (deduplication).
	 */
	async get<T>(key: string, fetcher: () => Promise<T>, ttlMs?: number): Promise<T> {
		const ttl = ttlMs ?? this.defaultTtlMs;

		// 1. Check TTL cache
		const cached = this.cache.get(key) as CacheEntry<T> | undefined;
		if (cached && cached.expiresAt > Date.now()) {
			return cached.value;
		}

		// 2. Check in-flight deduplication
		const pending = this.inflight.get(key) as Promise<T> | undefined;
		if (pending) {
			return pending;
		}

		// 3. Execute fetcher with deduplication
		const promise = fetcher().then(
			(value) => {
				this.cache.set(key, { value, expiresAt: Date.now() + ttl });
				this.inflight.delete(key);
				return value;
			},
			(err) => {
				this.inflight.delete(key);
				throw err;
			}
		);

		this.inflight.set(key, promise);
		return promise;
	}

	/** Invalidate a specific key */
	invalidate(key: string): void {
		this.cache.delete(key);
	}

	/** Invalidate all keys matching a prefix */
	invalidatePrefix(prefix: string): void {
		for (const key of this.cache.keys()) {
			if (key.startsWith(prefix)) {
				this.cache.delete(key);
			}
		}
	}

	/** Clear the entire cache */
	clear(): void {
		this.cache.clear();
		this.inflight.clear();
	}
}

/** Singleton cache shared across all server-side callers */
let globalCache: RequestCache | null = null;

export function getRpcCache(): RequestCache {
	if (!globalCache) {
		globalCache = new RequestCache();
	}
	return globalCache;
}
