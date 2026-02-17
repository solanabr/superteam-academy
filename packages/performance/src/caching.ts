// Cache Configuration
export interface CacheConfig {
	strategy: "memory" | "localStorage" | "sessionStorage" | "indexedDB" | "redis" | "cdn";
	maxSize: number;
	ttl: number; // Time to live in milliseconds
	compression: boolean;
	encryption: boolean;
	namespace: string;
}

// Cache Entry
export interface CacheEntry<T = unknown> {
	key: string;
	value: T;
	timestamp: number;
	ttl: number;
	metadata?: Record<string, unknown>;
}

// Cache Statistics
export interface CacheStats {
	hits: number;
	misses: number;
	sets: number;
	deletes: number;
	evictions: number;
	hitRate: number;
	totalSize: number;
	entries: number;
}

// Base Cache Interface
export interface Cache<T = unknown> {
	get(key: string): Promise<T | null>;
	set(key: string, value: T, ttl?: number): Promise<void>;
	delete(key: string): Promise<boolean>;
	clear(): Promise<void>;
	has(key: string): Promise<boolean>;
	size(): Promise<number>;
	keys(): Promise<string[]>;
	stats(): Promise<CacheStats>;
}

// Memory Cache Implementation
export class MemoryCache<T = unknown> implements Cache<T> {
	private cache: Map<string, CacheEntry<T>> = new Map();
	private _stats: CacheStats = {
		hits: 0,
		misses: 0,
		sets: 0,
		deletes: 0,
		evictions: 0,
		hitRate: 0,
		totalSize: 0,
		entries: 0,
	};

	constructor(private config: CacheConfig) {
		// Start cleanup interval
		setInterval(() => this.cleanup(), 60_000); // Clean every minute
	}

	async get(key: string): Promise<T | null> {
		const entry = this.cache.get(key);

		if (!entry) {
			this._stats.misses++;
			this.updateHitRate();
			return null;
		}

		if (this.isExpired(entry)) {
			this.cache.delete(key);
			this._stats.misses++;
			this._stats.evictions++;
			this.updateHitRate();
			return null;
		}

		this._stats.hits++;
		this.updateHitRate();
		return entry.value;
	}

	async set(key: string, value: T, ttl?: number): Promise<void> {
		const entry: CacheEntry<T> = {
			key,
			value,
			timestamp: Date.now(),
			ttl: ttl || this.config.ttl,
		};

		// Check size limits
		if (this.cache.size >= this.config.maxSize) {
			this.evictOldest();
		}

		this.cache.set(key, entry);
		this._stats.sets++;
		this._stats.entries = this.cache.size;
	}

	async delete(key: string): Promise<boolean> {
		const deleted = this.cache.delete(key);
		if (deleted) {
			this._stats.deletes++;
			this._stats.entries = this.cache.size;
		}
		return deleted;
	}

	async clear(): Promise<void> {
		this.cache.clear();
		this._stats.entries = 0;
	}

	async has(key: string): Promise<boolean> {
		const entry = this.cache.get(key);
		return entry ? !this.isExpired(entry) : false;
	}

	async size(): Promise<number> {
		return this.cache.size;
	}

	async keys(): Promise<string[]> {
		return Array.from(this.cache.keys()).filter((key) => {
			const entry = this.cache.get(key);
			return entry && !this.isExpired(entry);
		});
	}

	async stats(): Promise<CacheStats> {
		return { ...this._stats };
	}

	private isExpired(entry: CacheEntry<T>): boolean {
		return Date.now() - entry.timestamp > entry.ttl;
	}

	private evictOldest(): void {
		let oldestKey: string | null = null;
		let oldestTime = Date.now();

		for (const [key, entry] of this.cache) {
			if (entry.timestamp < oldestTime) {
				oldestTime = entry.timestamp;
				oldestKey = key;
			}
		}

		if (oldestKey) {
			this.cache.delete(oldestKey);
			this._stats.evictions++;
		}
	}

	private cleanup(): void {
		const now = Date.now();
		for (const [key, entry] of this.cache) {
			if (now - entry.timestamp > entry.ttl) {
				this.cache.delete(key);
				this._stats.evictions++;
			}
		}
		this._stats.entries = this.cache.size;
	}

	private updateHitRate(): void {
		const total = this._stats.hits + this._stats.misses;
		this._stats.hitRate = total > 0 ? this._stats.hits / total : 0;
	}
}

// Local Storage Cache Implementation
export class LocalStorageCache<T = unknown> implements Cache<T> {
	private _stats: CacheStats = {
		hits: 0,
		misses: 0,
		sets: 0,
		deletes: 0,
		evictions: 0,
		hitRate: 0,
		totalSize: 0,
		entries: 0,
	};

	constructor(private config: CacheConfig) {}

	async get(key: string): Promise<T | null> {
		try {
			const item = localStorage.getItem(this.getNamespacedKey(key));
			if (!item) {
				this._stats.misses++;
				this.updateHitRate();
				return null;
			}

			const entry: CacheEntry<T> = JSON.parse(item);

			if (this.isExpired(entry)) {
				await this.delete(key);
				this._stats.misses++;
				this._stats.evictions++;
				this.updateHitRate();
				return null;
			}

			this._stats.hits++;
			this.updateHitRate();
			return entry.value;
		} catch (error) {
			console.error("LocalStorage get error:", error);
			return null;
		}
	}

	async set(key: string, value: T, ttl?: number): Promise<void> {
		try {
			const entry: CacheEntry<T> = {
				key,
				value,
				timestamp: Date.now(),
				ttl: ttl || this.config.ttl,
			};

			localStorage.setItem(this.getNamespacedKey(key), JSON.stringify(entry));
			this._stats.sets++;
			this.updateStats();
		} catch (error) {
			console.error("LocalStorage set error:", error);
		}
	}

	async delete(key: string): Promise<boolean> {
		try {
			const namespacedKey = this.getNamespacedKey(key);
			const exists = localStorage.getItem(namespacedKey) !== null;
			if (exists) {
				localStorage.removeItem(namespacedKey);
				this._stats.deletes++;
				this.updateStats();
			}
			return exists;
		} catch (error) {
			console.error("LocalStorage delete error:", error);
			return false;
		}
	}

	async clear(): Promise<void> {
		try {
			const keys = Object.keys(localStorage);
			keys.forEach((key) => {
				if (key.startsWith(`${this.config.namespace}:`)) {
					localStorage.removeItem(key);
				}
			});
			this.updateStats();
		} catch (error) {
			console.error("LocalStorage clear error:", error);
		}
	}

	async has(key: string): Promise<boolean> {
		try {
			const item = localStorage.getItem(this.getNamespacedKey(key));
			if (!item) return false;

			const entry: CacheEntry<T> = JSON.parse(item);
			return !this.isExpired(entry);
		} catch (_error) {
			return false;
		}
	}

	async size(): Promise<number> {
		try {
			const keys = Object.keys(localStorage);
			return keys.filter((key) => key.startsWith(`${this.config.namespace}:`)).length;
		} catch (_error) {
			return 0;
		}
	}

	async keys(): Promise<string[]> {
		try {
			const keys = Object.keys(localStorage);
			return keys
				.filter((key) => key.startsWith(`${this.config.namespace}:`))
				.map((key) => key.replace(`${this.config.namespace}:`, ""));
		} catch (_error) {
			return [];
		}
	}

	async stats(): Promise<CacheStats> {
		this.updateStats();
		return { ...this._stats };
	}

	private getNamespacedKey(key: string): string {
		return `${this.config.namespace}:${key}`;
	}

	private isExpired(entry: CacheEntry<T>): boolean {
		return Date.now() - entry.timestamp > entry.ttl;
	}

	private updateStats(): void {
		// Update entries count
		this._stats.entries = 0;
		try {
			const keys = Object.keys(localStorage);
			this._stats.entries = keys.filter((key) =>
				key.startsWith(`${this.config.namespace}:`)
			).length;
		} catch (_error) {
			// Ignore errors
		}
	}

	private updateHitRate(): void {
		const total = this._stats.hits + this._stats.misses;
		this._stats.hitRate = total > 0 ? this._stats.hits / total : 0;
	}
}

// HTTP Cache with Service Worker
export class HTTPCache {
	private cache: CacheMap = new Map();

	// Cache HTTP response
	async cacheResponse(
		request: Request,
		response: Response,
		ttl = 300_000 // 5 minutes
	): Promise<void> {
		const cacheKey = this.getCacheKey(request);
		const cacheEntry = {
			response: response.clone(),
			timestamp: Date.now(),
			ttl,
		};

		this.cache.set(cacheKey, cacheEntry);
	}

	// Get cached response
	async getCachedResponse(request: Request): Promise<Response | null> {
		const cacheKey = this.getCacheKey(request);
		const entry = this.cache.get(cacheKey);

		if (!entry) return null;

		if (this.isExpired(entry)) {
			this.cache.delete(cacheKey);
			return null;
		}

		return entry.response.clone();
	}

	// Clear expired entries
	cleanup(): void {
		const now = Date.now();
		for (const [key, entry] of this.cache) {
			if (now - entry.timestamp > entry.ttl) {
				this.cache.delete(key);
			}
		}
	}

	private getCacheKey(request: Request): string {
		return `${request.method}:${request.url}`;
	}

	private isExpired(entry: HTTPCacheEntry): boolean {
		return Date.now() - entry.timestamp > entry.ttl;
	}
}

interface HTTPCacheEntry {
	response: Response;
	timestamp: number;
	ttl: number;
}

type CacheMap = Map<string, HTTPCacheEntry>;

// Multi-Level Cache
export class MultiLevelCache<T = unknown> implements Cache<T> {
	private levels: Cache<T>[] = [];

	constructor(levels: Cache<T>[]) {
		this.levels = levels;
	}

	async get(key: string): Promise<T | null> {
		// Try each level from fastest to slowest
		for (let i = 0; i < this.levels.length; i++) {
			const value = await this.levels[i].get(key);
			if (value !== null) {
				// Populate faster levels
				for (let j = 0; j < i; j++) {
					await this.levels[j].set(key, value);
				}
				return value;
			}
		}
		return null;
	}

	async set(key: string, value: T, ttl?: number): Promise<void> {
		// Set in all levels
		await Promise.all(this.levels.map((level) => level.set(key, value, ttl)));
	}

	async delete(key: string): Promise<boolean> {
		// Delete from all levels
		const results = await Promise.all(this.levels.map((level) => level.delete(key)));
		return results.some((result) => result);
	}

	async clear(): Promise<void> {
		await Promise.all(this.levels.map((level) => level.clear()));
	}

	async has(key: string): Promise<boolean> {
		// Check any level
		const results = await Promise.all(this.levels.map((level) => level.has(key)));
		return results.some((result) => result);
	}

	async size(): Promise<number> {
		// Return size of first level
		return this.levels[0]?.size() || 0;
	}

	async keys(): Promise<string[]> {
		// Return keys from first level
		return this.levels[0]?.keys() || [];
	}

	async stats(): Promise<CacheStats> {
		// Aggregate stats from all levels
		const allStats = await Promise.all(this.levels.map((level) => level.stats()));

		return {
			hits: allStats.reduce((sum, stats) => sum + stats.hits, 0),
			misses: allStats.reduce((sum, stats) => sum + stats.misses, 0),
			sets: allStats.reduce((sum, stats) => sum + stats.sets, 0),
			deletes: allStats.reduce((sum, stats) => sum + stats.deletes, 0),
			evictions: allStats.reduce((sum, stats) => sum + stats.evictions, 0),
			hitRate: 0, // Calculate weighted average
			totalSize: allStats.reduce((sum, stats) => sum + stats.totalSize, 0),
			entries: allStats.reduce((sum, stats) => sum + stats.entries, 0),
		};
	}
}

// Cache Factory
export const CacheFactory = {
	createMemoryCache<T = unknown>(config: Partial<CacheConfig> = {}): MemoryCache<T> {
		const defaultConfig: CacheConfig = {
			strategy: "memory",
			maxSize: 1000,
			ttl: 300_000, // 5 minutes
			compression: false,
			encryption: false,
			namespace: "default",
			...config,
		};
		return new MemoryCache<T>(defaultConfig);
	},

	createLocalStorageCache<T = unknown>(config: Partial<CacheConfig> = {}): LocalStorageCache<T> {
		const defaultConfig: CacheConfig = {
			strategy: "localStorage",
			maxSize: 100,
			ttl: 3_600_000, // 1 hour
			compression: false,
			encryption: false,
			namespace: "app-cache",
			...config,
		};
		return new LocalStorageCache<T>(defaultConfig);
	},

	createMultiLevelCache<T = unknown>(configs: Partial<CacheConfig>[]): MultiLevelCache<T> {
		const caches = configs.map((config) => CacheFactory.createMemoryCache<T>(config));
		return new MultiLevelCache<T>(caches);
	},

	createHTTPCache(): HTTPCache {
		return new HTTPCache();
	},
};

// Cache Warming
export class CacheWarmer {
	private cache: Cache;
	private warmingTasks: Map<string, Promise<void>> = new Map();

	constructor(cache: Cache) {
		this.cache = cache;
	}

	// Warm cache with data
	async warmCache(
		data: Array<{ key: string; value: unknown; ttl?: number }>,
		options: {
			batchSize?: number;
			concurrency?: number;
		} = {}
	): Promise<void> {
		const { batchSize = 10, concurrency = 3 } = options;

		// Process in batches with concurrency control
		for (let i = 0; i < data.length; i += batchSize) {
			const batch = data.slice(i, i + batchSize);
			const promises: Promise<void>[] = [];

			for (const item of batch) {
				if (promises.length >= concurrency) {
					await Promise.race(promises);
				}

				const promise = this.cache.set(item.key, item.value, item.ttl);
				promises.push(promise);
			}

			await Promise.all(promises);
		}
	}

	// Warm cache from API
	async warmFromAPI(
		endpoint: string,
		keyFn: (item: unknown) => string,
		options: {
			headers?: Record<string, string>;
			transform?: (data: unknown) => unknown;
			ttl?: number;
		} = {}
	): Promise<void> {
		try {
			const response = await fetch(endpoint, {
				...(options.headers !== undefined && { headers: options.headers }),
			});

			if (!response.ok) {
				throw new Error(`API request failed: ${response.status}`);
			}

			const data = await response.json();
			const items = Array.isArray(data) ? data : [data];

			const cacheData = items.map((item) => ({
				key: keyFn(item),
				value: options.transform ? options.transform(item) : item,
				...(options.ttl !== undefined && { ttl: options.ttl }),
			}));

			await this.warmCache(cacheData);
		} catch (error) {
			console.error("Cache warming from API failed:", error);
		}
	}

	// Get warming status
	getWarmingStatus(): { activeTasks: number; completedTasks: number } {
		return {
			activeTasks: this.warmingTasks.size,
			completedTasks: 0, // Would need to track completed tasks
		};
	}
}

// Cache Invalidation Strategies
export class CacheInvalidation {
	private cache: Cache;
	private invalidationRules: Map<string, InvalidationRule> = new Map();

	constructor(cache: Cache) {
		this.cache = cache;
	}

	// Register invalidation rule
	registerRule(
		pattern: string,
		rule: {
			strategy: "immediate" | "lazy" | "time-based";
			ttl?: number;
			dependencies?: string[];
		}
	): void {
		this.invalidationRules.set(pattern, rule);
	}

	// Invalidate by pattern
	async invalidatePattern(pattern: string): Promise<void> {
		const keys = await this.cache.keys();
		const matchingKeys = keys.filter((key) => this.matchesPattern(key, pattern));

		await Promise.all(matchingKeys.map((key) => this.cache.delete(key)));
	}

	// Invalidate by dependency
	async invalidateDependencies(dependencyKey: string): Promise<void> {
		for (const [pattern, rule] of this.invalidationRules) {
			if (rule.dependencies?.includes(dependencyKey)) {
				await this.invalidatePattern(pattern);
			}
		}
	}

	// Time-based invalidation
	async invalidateExpired(): Promise<void> {
		// This would be handled by individual cache implementations
		// but we can trigger cleanup
		await this.cache.clear();
	}

	private matchesPattern(key: string, pattern: string): boolean {
		// Simple wildcard matching
		const regex = new RegExp(pattern.replace(/\*/g, ".*"));
		return regex.test(key);
	}
}

interface InvalidationRule {
	strategy: "immediate" | "lazy" | "time-based";
	ttl?: number;
	dependencies?: string[];
}
