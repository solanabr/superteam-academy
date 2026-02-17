// Caching Strategies - Re-exports from caching module
export {
	type CacheConfig,
	type CacheEntry,
	type CacheStats,
	type Cache,
	MemoryCache,
	LocalStorageCache,
	HTTPCache,
	MultiLevelCache,
	CacheFactory,
	CacheWarmer,
	CacheInvalidation,
} from "./caching";

// Factory alias for consistent naming
export { CacheFactory as CachingFactory } from "./caching";
