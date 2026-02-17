export interface CacheEntry<T = unknown> {
	key: string;
	value: T;
	expiresAt?: Date;
	metadata?: {
		createdAt: Date;
		hits: number;
		lastAccessed: Date;
		size: number;
	};
}

export interface CacheConfig {
	ttl: number; // time to live in milliseconds
	maxSize: number; // maximum number of entries
	strategy: "lru" | "lfu" | "fifo";
}

export interface CachePolicy {
	shouldCache(key: string, value: unknown): boolean;
	getTTL(key: string): number;
	getKey(namespace: string, ...parts: string[]): string;
	serialize(value: unknown): string;
	deserialize(value: string): unknown;
}

export interface CacheProvider {
	get<T>(key: string): Promise<T | null>;
	set<T>(key: string, value: T, ttl?: number): Promise<void>;
	delete(key: string): Promise<boolean>;
	clear(): Promise<void>;
	has(key: string): Promise<boolean>;
	getStats(): Promise<{
		entries: number;
		hits: number;
		misses: number;
		hitRate: number;
	}>;
}

export interface MultiLevelCache {
	l1: CacheProvider; // Fast, small (e.g., in-memory)
	l2?: CacheProvider; // Slower, larger (e.g., Redis)
	l3?: CacheProvider; // Persistent (e.g., database)
}

export interface DistributedCache extends CacheProvider {
	lock(key: string, ttl: number): Promise<boolean>;
	unlock(key: string): Promise<void>;
	publish(channel: string, message: unknown): Promise<void>;
	subscribe(channel: string, handler: (message: unknown) => void): Promise<void>;
}
