import type { ServiceResponse } from "../types";

export type { ServiceResponse };
// Re-export for convenience

export interface CacheEntry<T> {
	data: T;
	timestamp: Date;
	ttl: number;
	accessCount: number;
	lastAccessed: Date;
}

export interface CacheConfig {
	defaultTTL?: number;
	maxSize?: number;
	enableCompression?: boolean;
}

export interface CacheStats {
	hits: number;
	misses: number;
	sets: number;
	deletes: number;
	evictions: number;
	size: number;
	lastCleanup: Date;
}

export interface LeaderboardCacheService {
	get<T>(key: string): Promise<ServiceResponse<T | null>>;
	set<T>(key: string, data: T, ttl?: number): Promise<ServiceResponse<void>>;
	delete(key: string): Promise<ServiceResponse<boolean>>;
	clear(): Promise<ServiceResponse<void>>;
	has(key: string): Promise<ServiceResponse<boolean>>;
	getMultiple<T>(keys: string[]): Promise<ServiceResponse<Map<string, T>>>;
	setMultiple<T>(entries: Map<string, T>, ttl?: number): Promise<ServiceResponse<void>>;
	getStats(): Promise<ServiceResponse<CacheStats>>;
	cleanup(): Promise<ServiceResponse<void>>;
	invalidatePattern(pattern: string): Promise<ServiceResponse<number>>;
	getKeys(pattern?: string): Promise<ServiceResponse<string[]>>;
}
