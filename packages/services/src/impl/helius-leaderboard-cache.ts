import type {
	LeaderboardCacheService,
	CacheEntry,
	CacheConfig,
	CacheStats,
	ServiceResponse,
} from "../interfaces/leaderboard-cache";
import type { LeaderboardCategory, Timeframe, LeaderboardResult } from "../interfaces/leaderboard";

// Leaderboard Caching Service Implementation
export class RedisLeaderboardCacheService implements LeaderboardCacheService {
	private cache: Map<string, CacheEntry<LeaderboardResult>> = new Map();
	private config: CacheConfig;
	private stats: CacheStats;

	constructor(config: CacheConfig = {}) {
		this.config = {
			defaultTTL: 5 * 60 * 1000, // 5 minutes
			maxSize: 1000,
			enableCompression: false,
			...config,
		};

		this.stats = {
			hits: 0,
			misses: 0,
			sets: 0,
			deletes: 0,
			evictions: 0,
			size: 0,
			lastCleanup: new Date(),
		};
	}

	async get<T>(key: string): Promise<ServiceResponse<T | null>> {
		try {
			const entry = this.cache.get(key);

			if (!entry) {
				this.stats.misses++;
				return { success: true, data: null };
			}

			if (this.isExpired(entry)) {
				this.cache.delete(key);
				this.stats.misses++;
				this.stats.deletes++;
				return { success: true, data: null };
			}

			this.stats.hits++;
			return { success: true, data: entry.data as T };
		} catch (error) {
			console.error("Error getting from cache:", error);
			return {
				success: false,
				error: "Failed to get from cache",
			};
		}
	}

	async set<T>(key: string, data: T, ttl?: number): Promise<ServiceResponse<void>> {
		try {
			// Check cache size limit
			if (this.config.maxSize && this.cache.size >= this.config.maxSize) {
				await this.evictOldEntries();
			}

			const entry: CacheEntry<T> = {
				data,
				timestamp: new Date(),
				ttl: ttl || this.config.defaultTTL || 0,
				accessCount: 0,
				lastAccessed: new Date(),
			};

			this.cache.set(key, entry as CacheEntry<LeaderboardResult>);
			this.stats.sets++;
			this.stats.size = this.cache.size;

			return { success: true };
		} catch (error) {
			console.error("Error setting cache:", error);
			return {
				success: false,
				error: "Failed to set cache",
			};
		}
	}

	async delete(key: string): Promise<ServiceResponse<boolean>> {
		try {
			const deleted = this.cache.delete(key);
			if (deleted) {
				this.stats.deletes++;
				this.stats.size = this.cache.size;
			}
			return { success: true, data: deleted };
		} catch (error) {
			console.error("Error deleting from cache:", error);
			return {
				success: false,
				error: "Failed to delete from cache",
			};
		}
	}

	async clear(): Promise<ServiceResponse<void>> {
		try {
			this.cache.clear();
			this.stats.size = 0;
			this.stats.deletes += this.stats.size;
			return { success: true };
		} catch (error) {
			console.error("Error clearing cache:", error);
			return {
				success: false,
				error: "Failed to clear cache",
			};
		}
	}

	async has(key: string): Promise<ServiceResponse<boolean>> {
		try {
			const entry = this.cache.get(key);
			if (!entry) return { success: true, data: false };

			if (this.isExpired(entry)) {
				this.cache.delete(key);
				this.stats.deletes++;
				return { success: true, data: false };
			}

			return { success: true, data: true };
		} catch (error) {
			console.error("Error checking cache:", error);
			return {
				success: false,
				error: "Failed to check cache",
			};
		}
	}

	async getMultiple<T>(keys: string[]): Promise<ServiceResponse<Map<string, T>>> {
		try {
			const results = new Map<string, T>();

			for (const key of keys) {
				const result = await this.get<T>(key);
				if (result.success && result.data !== null && result.data !== undefined) {
					results.set(key, result.data as T);
				}
			}

			return { success: true, data: results };
		} catch (error) {
			console.error("Error getting multiple from cache:", error);
			return {
				success: false,
				error: "Failed to get multiple from cache",
			};
		}
	}

	async setMultiple<T>(entries: Map<string, T>, ttl?: number): Promise<ServiceResponse<void>> {
		try {
			for (const [key, data] of entries) {
				await this.set(key, data, ttl);
			}
			return { success: true };
		} catch (error) {
			console.error("Error setting multiple in cache:", error);
			return {
				success: false,
				error: "Failed to set multiple in cache",
			};
		}
	}

	async getStats(): Promise<ServiceResponse<CacheStats>> {
		try {
			// Update stats
			this.stats.size = this.cache.size;
			this.stats.lastCleanup = new Date();

			return { success: true, data: { ...this.stats } };
		} catch (error) {
			console.error("Error getting cache stats:", error);
			return {
				success: false,
				error: "Failed to get cache stats",
			};
		}
	}

	async cleanup(): Promise<ServiceResponse<void>> {
		try {
			let cleaned = 0;
			const now = new Date();

			for (const [key, entry] of this.cache.entries()) {
				if (this.isExpired(entry)) {
					this.cache.delete(key);
					cleaned++;
				}
			}

			this.stats.deletes += cleaned;
			this.stats.size = this.cache.size;
			this.stats.lastCleanup = now;

			return { success: true };
		} catch (error) {
			console.error("Error cleaning up cache:", error);
			return {
				success: false,
				error: "Failed to cleanup cache",
			};
		}
	}

	async invalidatePattern(pattern: string): Promise<ServiceResponse<number>> {
		try {
			let deleted = 0;
			const regex = new RegExp(pattern.replace(/\*/g, ".*"));

			for (const [key, _entry] of this.cache.entries()) {
				if (regex.test(key)) {
					this.cache.delete(key);
					deleted++;
				}
			}

			this.stats.deletes += deleted;
			this.stats.size = this.cache.size;

			return { success: true, data: deleted };
		} catch (error) {
			console.error("Error invalidating pattern:", error);
			return {
				success: false,
				error: "Failed to invalidate pattern",
			};
		}
	}

	async getKeys(pattern?: string): Promise<ServiceResponse<string[]>> {
		try {
			let keys = Array.from(this.cache.keys());

			if (pattern) {
				const regex = new RegExp(pattern.replace(/\*/g, ".*"));
				keys = keys.filter((key) => regex.test(key));
			}

			return { success: true, data: keys };
		} catch (error) {
			console.error("Error getting keys:", error);
			return {
				success: false,
				error: "Failed to get keys",
			};
		}
	}

	// Leaderboard-specific methods
	async getLeaderboardCache(
		category: LeaderboardCategory,
		timeframe: Timeframe
	): Promise<ServiceResponse<LeaderboardResult | null>> {
		const key = `leaderboard-${category}-${timeframe}`;
		return this.get<LeaderboardResult>(key);
	}

	async setLeaderboardCache(
		category: LeaderboardCategory,
		timeframe: Timeframe,
		data: LeaderboardResult,
		ttl?: number
	): Promise<ServiceResponse<void>> {
		const key = `leaderboard-${category}-${timeframe}`;
		return this.set(key, data, ttl);
	}

	async invalidateLeaderboardCache(
		category?: LeaderboardCategory,
		timeframe?: Timeframe
	): Promise<ServiceResponse<number>> {
		let pattern = "leaderboard-";

		if (category) {
			pattern += `${category}-`;
			if (timeframe) {
				pattern += timeframe;
			} else {
				pattern += "*";
			}
		} else {
			pattern += "*";
		}

		return this.invalidatePattern(pattern);
	}

	async getUserCache(userId: string): Promise<ServiceResponse<unknown | null>> {
		const key = `user-${userId}`;
		return this.get(key);
	}

	async setUserCache(
		userId: string,
		data: unknown,
		ttl?: number
	): Promise<ServiceResponse<void>> {
		const key = `user-${userId}`;
		return this.set(key, data, ttl);
	}

	async invalidateUserCache(userId: string): Promise<ServiceResponse<boolean>> {
		const key = `user-${userId}`;
		return this.delete(key);
	}

	// Private helper methods
	private isExpired(entry: CacheEntry<unknown>): boolean {
		const now = new Date();
		const age = now.getTime() - entry.timestamp.getTime();
		return age > entry.ttl;
	}

	private async evictOldEntries(): Promise<void> {
		// Simple LRU eviction - remove oldest entries
		const entries = Array.from(this.cache.entries());

		// Sort by last accessed time (oldest first)
		entries.sort(([, a], [, b]) => a.lastAccessed.getTime() - b.lastAccessed.getTime());

		// Remove oldest 10% of entries
		const toRemove = Math.ceil(entries.length * 0.1);
		for (let i = 0; i < toRemove; i++) {
			this.cache.delete(entries[i][0]);
			this.stats.evictions++;
		}

		this.stats.size = this.cache.size;
	}
}

// In-memory implementation for development/testing
export class InMemoryLeaderboardCacheService extends RedisLeaderboardCacheService {}

// Factory function for cache service
export function createLeaderboardCacheService(
	type: "redis" | "memory" = "memory",
	config?: CacheConfig
): LeaderboardCacheService {
	switch (type) {
		case "redis":
			// In a real implementation, this would connect to Redis
			// For now, fall back to in-memory
			return new InMemoryLeaderboardCacheService(config);
		default:
			return new InMemoryLeaderboardCacheService(config);
	}
}
