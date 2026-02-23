import type { ServiceResponse } from "../types";
import {
	CustomIndexerService,
	type IndexerEvent,
	type IndexerEventHandler,
} from "./custom-indexer";
import { HeliusDASClient, CredentialParser } from "../leaderboard/helius-das-integration";

// Hybrid Architecture Types
export interface HybridConfig {
	// Custom indexer config
	indexer: {
		rpcUrl: string;
		programId: string;
		batchSize: number;
		cacheSize: number;
		persistenceEnabled: boolean;
	};
	// Helius DAS config
	helius: {
		apiKey: string;
		baseUrl?: string;
	};
	// Hybrid strategy config
	strategy: {
		primaryDataSource: "indexer" | "helius" | "hybrid";
		syncInterval: number; // minutes
		consistencyCheckInterval: number; // minutes
		fallbackEnabled: boolean;
	};
	// Collection addresses for credential parsing
	collectionAddresses: Record<string, string>;
}

export interface DataConsistencyReport {
	totalRecords: number;
	matchingRecords: number;
	indexerOnlyRecords: number;
	heliusOnlyRecords: number;
	conflicts: Array<{
		recordId: string;
		indexerData: unknown;
		heliusData: unknown;
		conflictType: string;
	}>;
	lastSyncAt: Date;
	syncDuration: number;
}

// Hybrid Indexer Service
export class HybridIndexerService {
	private config: HybridConfig;
	private customIndexer: CustomIndexerService;
	private isRunning = false;
	private syncTimer: NodeJS.Timeout | null = null;
	private consistencyTimer: NodeJS.Timeout | null = null;
	private eventHandlers: IndexerEventHandler[] = [];

	constructor(config: HybridConfig) {
		this.config = config;

		// Initialize custom indexer
		this.customIndexer = new CustomIndexerService({
			rpcUrl: config.indexer.rpcUrl,
			programId: config.indexer.programId,
			batchSize: config.indexer.batchSize,
			retryAttempts: 3,
			retryDelay: 1000,
			maxConcurrency: 5,
			cacheSize: config.indexer.cacheSize,
			persistenceEnabled: config.indexer.persistenceEnabled,
		});

		// Initialize Helius components
		const heliusClient = new HeliusDASClient(config.helius.apiKey, config.helius.baseUrl);
		const credentialParser = new CredentialParser(config.collectionAddresses);
		void heliusClient;
		void credentialParser;

		// Forward events from custom indexer
		this.customIndexer.addEventHandler((event) => this.handleIndexerEvent(event));
	}

	async start(): Promise<ServiceResponse<void>> {
		try {
			if (this.isRunning) {
				return { success: false, error: "Hybrid indexer is already running" };
			}

			this.isRunning = true;

			// Start custom indexer
			const indexerStart = await this.customIndexer.start();
			if (!indexerStart.success) {
				return indexerStart;
			}

			// Start sync processes
			this.startSyncProcesses();

			return { success: true };
		} catch (error) {
			this.isRunning = false;
			return {
				success: false,
				error: `Failed to start hybrid indexer: ${error instanceof Error ? error.message : "Unknown error"}`,
			};
		}
	}

	async stop(): Promise<ServiceResponse<void>> {
		try {
			if (!this.isRunning) {
				return { success: false, error: "Hybrid indexer is not running" };
			}

			this.isRunning = false;

			// Stop timers
			if (this.syncTimer) {
				clearInterval(this.syncTimer);
				this.syncTimer = null;
			}
			if (this.consistencyTimer) {
				clearInterval(this.consistencyTimer);
				this.consistencyTimer = null;
			}

			// Stop custom indexer
			await this.customIndexer.stop();

			return { success: true };
		} catch (error) {
			return {
				success: false,
				error: `Failed to stop hybrid indexer: ${error instanceof Error ? error.message : "Unknown error"}`,
			};
		}
	}

	// Data retrieval with hybrid strategy
	async getLeaderboardData(
		category: string,
		timeframe: string,
		limit = 50
	): Promise<ServiceResponse<unknown[]>> {
		try {
			switch (this.config.strategy.primaryDataSource) {
				case "indexer":
					return await this.getDataFromIndexer(category, timeframe, limit);
				case "helius":
					return await this.getDataFromHelius(category, timeframe, limit);
				case "hybrid":
					return await this.getDataFromHybrid(category, timeframe, limit);
				default:
					return await this.getDataFromHybrid(category, timeframe, limit);
			}
		} catch (error) {
			return {
				success: false,
				error: `Failed to get leaderboard data: ${error instanceof Error ? error.message : "Unknown error"}`,
			};
		}
	}

	// Consistency checking
	async checkDataConsistency(): Promise<ServiceResponse<DataConsistencyReport>> {
		try {
			const startTime = Date.now();

			// Get data from both sources
			const indexerData = await this.getDataFromIndexer("all", "all", 1000);
			const heliusData = await this.getDataFromHelius("all", "all", 1000);

			if (!indexerData.success || !heliusData.success) {
				return {
					success: false,
					error: "Failed to retrieve data from one or both sources",
				};
			}

			// Analyze consistency
			const report = this.analyzeConsistency(
				indexerData.data ?? [],
				heliusData.data ?? [],
				Date.now() - startTime
			);

			return { success: true, data: report };
		} catch (error) {
			return {
				success: false,
				error: `Failed to check data consistency: ${error instanceof Error ? error.message : "Unknown error"}`,
			};
		}
	}

	// Manual sync trigger
	async triggerSync(): Promise<ServiceResponse<void>> {
		try {
			await this.performDataSync();
			return { success: true };
		} catch (error) {
			return {
				success: false,
				error: `Failed to trigger sync: ${error instanceof Error ? error.message : "Unknown error"}`,
			};
		}
	}

	// Add event handler
	addEventHandler(handler: IndexerEventHandler): void {
		this.eventHandlers.push(handler);
	}

	// Remove event handler
	removeEventHandler(handler: IndexerEventHandler): void {
		const index = this.eventHandlers.indexOf(handler);
		if (index > -1) {
			this.eventHandlers.splice(index, 1);
		}
	}

	// Get hybrid metrics
	async getHybridMetrics(): Promise<ServiceResponse<unknown>> {
		try {
			const indexerMetrics = await this.customIndexer.getMetrics();
			const consistencyReport = await this.checkDataConsistency();

			return {
				success: true,
				data: {
					indexer: indexerMetrics.success ? indexerMetrics.data : null,
					consistency: consistencyReport.success ? consistencyReport.data : null,
					hybrid: {
						primaryDataSource: this.config.strategy.primaryDataSource,
						syncInterval: this.config.strategy.syncInterval,
						fallbackEnabled: this.config.strategy.fallbackEnabled,
						isRunning: this.isRunning,
					},
				},
			};
		} catch (error) {
			return {
				success: false,
				error: `Failed to get hybrid metrics: ${error instanceof Error ? error.message : "Unknown error"}`,
			};
		}
	}

	// Private methods
	private async getDataFromIndexer(
		_category: string,
		_timeframe: string,
		_limit: number
	): Promise<ServiceResponse<unknown[]>> {
		// This would query the custom indexer
		// For now, return empty array
		return { success: true, data: [] };
	}

	private async getDataFromHelius(
		_category: string,
		_timeframe: string,
		_limit: number
	): Promise<ServiceResponse<unknown[]>> {
		try {
			// Use the aggregator to get data
			// This is a simplified version
			return { success: true, data: [] };
		} catch (error) {
			return {
				success: false,
				error: `Failed to get data from Helius: ${error instanceof Error ? error.message : "Unknown error"}`,
			};
		}
	}

	private async getDataFromHybrid(
		category: string,
		timeframe: string,
		limit: number
	): Promise<ServiceResponse<unknown[]>> {
		try {
			// Try primary source first
			const primaryResult =
				this.config.strategy.primaryDataSource === "indexer"
					? await this.getDataFromIndexer(category, timeframe, limit)
					: await this.getDataFromHelius(category, timeframe, limit);

			if (primaryResult.success && primaryResult.data && primaryResult.data.length > 0) {
				return primaryResult;
			}

			// Fallback to secondary source if enabled
			if (this.config.strategy.fallbackEnabled) {
				const secondaryResult =
					this.config.strategy.primaryDataSource === "indexer"
						? await this.getDataFromHelius(category, timeframe, limit)
						: await this.getDataFromIndexer(category, timeframe, limit);

				if (secondaryResult.success) {
					return secondaryResult;
				}
			}

			return primaryResult; // Return primary result even if failed
		} catch (error) {
			return {
				success: false,
				error: `Failed to get hybrid data: ${error instanceof Error ? error.message : "Unknown error"}`,
			};
		}
	}

	private analyzeConsistency(
		indexerData: unknown[],
		heliusData: unknown[],
		syncDuration: number
	): DataConsistencyReport {
		const indexerMap = new Map(
			indexerData.map((item) => [(item as Record<string, unknown>).id as string, item])
		);
		const heliusMap = new Map(
			heliusData.map((item) => [(item as Record<string, unknown>).id as string, item])
		);

		const allIds = new Set([...indexerMap.keys(), ...heliusMap.keys()]);
		const conflicts: DataConsistencyReport["conflicts"] = [];

		let matchingRecords = 0;
		let indexerOnlyRecords = 0;
		let heliusOnlyRecords = 0;

		for (const id of allIds) {
			const indexerItem = indexerMap.get(id);
			const heliusItem = heliusMap.get(id);

			if (indexerItem && heliusItem) {
				// Both have the item - check for conflicts
				const conflictType = this.detectConflict(indexerItem, heliusItem);
				if (conflictType) {
					conflicts.push({
						recordId: id,
						indexerData: indexerItem,
						heliusData: heliusItem,
						conflictType,
					});
				} else {
					matchingRecords++;
				}
			} else if (indexerItem) {
				indexerOnlyRecords++;
			} else if (heliusItem) {
				heliusOnlyRecords++;
			}
		}

		return {
			totalRecords: allIds.size,
			matchingRecords,
			indexerOnlyRecords,
			heliusOnlyRecords,
			conflicts,
			lastSyncAt: new Date(),
			syncDuration,
		};
	}

	private detectConflict(indexerItem: unknown, heliusItem: unknown): string | null {
		const a = indexerItem as Record<string, unknown>;
		const b = heliusItem as Record<string, unknown>;
		if (a.xp !== b.xp) {
			return "xp_mismatch";
		}
		if (a.level !== b.level) {
			return "level_mismatch";
		}
		if (
			(a.lastActivity as Date | undefined)?.getTime() !==
			(b.lastActivity as Date | undefined)?.getTime()
		) {
			return "activity_mismatch";
		}
		return null;
	}

	private async performDataSync(): Promise<void> {
		// ignored
	}

	private startSyncProcesses(): void {
		// Start periodic sync
		this.syncTimer = setInterval(
			() => {
				this.performDataSync().catch((error) => {
					console.error("Error in periodic sync:", error);
				});
			},
			this.config.strategy.syncInterval * 60 * 1000
		);

		// Start consistency checking
		this.consistencyTimer = setInterval(
			() => {
				this.checkDataConsistency()
					.then((result) => {
						if (result.success && (result.data?.conflicts.length ?? 0) > 0) {
							console.warn(
								`Data consistency issues found: ${result.data?.conflicts.length} conflicts`
							);
						}
					})
					.catch((error) => {
						console.error("Error in consistency check:", error);
					});
			},
			this.config.strategy.consistencyCheckInterval * 60 * 1000
		);
	}

	private async handleIndexerEvent(event: IndexerEvent): Promise<void> {
		// Forward event to hybrid handlers
		await Promise.all(this.eventHandlers.map((handler) => handler(event)));
	}
}

// Hybrid Service Factory
export const HybridServiceFactory = {
	createHybridIndexer(config: HybridConfig): HybridIndexerService {
		return new HybridIndexerService(config);
	},

	createOptimizedHybrid(
		heliusApiKey: string,
		programId: string,
		collectionAddresses: Record<string, string>
	): HybridIndexerService {
		const config: HybridConfig = {
			indexer: {
				rpcUrl: `https://mainnet.helius-rpc.com/?api-key=${heliusApiKey}`,
				programId,
				batchSize: 10,
				cacheSize: 10_000,
				persistenceEnabled: true,
			},
			helius: {
				apiKey: heliusApiKey,
			},
			strategy: {
				primaryDataSource: "hybrid",
				syncInterval: 5, // 5 minutes
				consistencyCheckInterval: 15, // 15 minutes
				fallbackEnabled: true,
			},
			collectionAddresses,
		};

		return new HybridIndexerService(config);
	},
};

// Performance Monitoring
interface PerformanceMetricEntry {
	count: number;
	totalDuration: number;
	avgDuration: number;
}

export class HybridPerformanceMonitor {
	private metrics: Map<string, PerformanceMetricEntry> = new Map();

	recordQuery(operation: string, duration: number, success: boolean): void {
		const key = `${operation}_${success ? "success" : "failure"}`;
		const existing = this.metrics.get(key) ?? { count: 0, totalDuration: 0, avgDuration: 0 };

		existing.count++;
		existing.totalDuration += duration;
		existing.avgDuration = existing.totalDuration / existing.count;

		this.metrics.set(key, existing);
	}

	getMetrics(): Record<string, PerformanceMetricEntry> {
		return Object.fromEntries(this.metrics);
	}

	getAverageResponseTime(operation: string): number {
		const success = this.metrics.get(`${operation}_success`);
		const failure = this.metrics.get(`${operation}_failure`);

		if (!success) return 0;

		const totalRequests = success.count + (failure?.count ?? 0);
		const totalDuration = success.totalDuration + (failure?.totalDuration ?? 0);

		return totalRequests > 0 ? totalDuration / totalRequests : 0;
	}
}
