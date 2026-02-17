import {
	type HeliusDASQuery,
	type HeliusDASResponse,
	type DASAsset,
	LeaderboardCategory,
	Timeframe,
	type LeaderboardEntry,
	type UserRank,
} from "../interfaces/leaderboard";

// Helius DAS Client
export class HeliusDASClient {
	private apiKey: string;
	private baseUrl: string;

	constructor(apiKey: string, baseUrl = "https://mainnet.helius-rpc.com") {
		this.apiKey = apiKey;
		this.baseUrl = baseUrl;
	}

	// Query assets by owner
	async getAssetsByOwner(ownerAddress: string, page = 1, limit = 1000): Promise<DASAsset[]> {
		const query: HeliusDASQuery = {
			jsonrpc: "2.0",
			id: "get-assets-by-owner",
			method: "getAssetsByOwner",
			params: [
				{
					ownerAddress,
					page,
					limit,
					displayOptions: {
						showFungible: false,
						showNativeBalance: false,
						showInscription: false,
						showCollectionMetadata: true,
					},
				},
			],
		};

		const response = await this.makeRequest(query);
		const result = response.result as { items?: DASAsset[] } | undefined;
		return result?.items ?? [];
	}

	// Query assets by collection
	async getAssetsByCollection(
		collectionAddress: string,
		page = 1,
		limit = 1000
	): Promise<DASAsset[]> {
		const query: HeliusDASQuery = {
			jsonrpc: "2.0",
			id: "get-assets-by-collection",
			method: "getAssetsByGroup",
			params: [
				{
					groupKey: "collection",
					groupValue: collectionAddress,
					page,
					limit,
					displayOptions: {
						showFungible: false,
						showNativeBalance: false,
						showInscription: false,
						showCollectionMetadata: false,
					},
				},
			],
		};

		const response = await this.makeRequest(query);
		const result = response.result as { items?: DASAsset[] } | undefined;
		return result?.items ?? [];
	}

	// Get asset details
	async getAsset(assetId: string): Promise<DASAsset | null> {
		const query: HeliusDASQuery = {
			jsonrpc: "2.0",
			id: "get-asset",
			method: "getAsset",
			params: [
				{
					id: assetId,
					displayOptions: {
						showFungible: false,
						showNativeBalance: false,
						showInscription: false,
						showCollectionMetadata: true,
					},
				},
			],
		};

		const response = await this.makeRequest(query);
		return (response.result as DASAsset | undefined) ?? null;
	}

	// Search assets with filters
	async searchAssets(filters: {
		ownerAddress?: string;
		collectionAddress?: string;
		compressed?: boolean;
		page?: number;
		limit?: number;
	}): Promise<DASAsset[]> {
		const query: HeliusDASQuery = {
			jsonrpc: "2.0",
			id: "search-assets",
			method: "searchAssets",
			params: [
				{
					...filters,
					displayOptions: {
						showFungible: false,
						showNativeBalance: false,
						showInscription: false,
						showCollectionMetadata: true,
					},
				},
			],
		};

		const response = await this.makeRequest(query);
		const result = response.result as { items?: DASAsset[] } | undefined;
		return result?.items ?? [];
	}

	private async makeRequest(query: HeliusDASQuery): Promise<HeliusDASResponse> {
		const url = `${this.baseUrl}/?api-key=${this.apiKey}`;

		const response = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(query),
		});

		if (!response.ok) {
			throw new Error(`Helius DAS API error: ${response.status} ${response.statusText}`);
		}

		return response.json();
	}
}

// Credential Parser for DAS Assets
export class CredentialParser {
	private collectionAddresses: Record<string, string>;

	constructor(collectionAddresses: Record<string, string>) {
		this.collectionAddresses = collectionAddresses;
	}

	// Parse credential data from DAS asset
	parseCredential(asset: DASAsset): ParsedCredential | null {
		if (!asset.content?.metadata?.attributes) {
			return null;
		}

		const attributes = asset.content.metadata.attributes;
		const credential: ParsedCredential = {
			assetId: asset.id,
			owner: asset.ownership.owner,
			collection: this.getCollectionFromAsset(asset),
			level: 0,
			coursesCompleted: 0,
			totalXP: 0,
			achievements: 0,
			lastActivity: new Date(),
			metadata: {},
		};

		// Parse attributes
		for (const attr of attributes) {
			switch (attr.trait_type) {
				case "Level":
					credential.level =
						typeof attr.value === "number"
							? attr.value
							: parseInt(String(attr.value), 10) || 0;
					break;
				case "Courses Completed":
					credential.coursesCompleted =
						typeof attr.value === "number"
							? attr.value
							: parseInt(String(attr.value), 10) || 0;
					break;
				case "Total XP":
					credential.totalXP =
						typeof attr.value === "number"
							? attr.value
							: parseInt(String(attr.value), 10) || 0;
					break;
				case "Achievements":
					credential.achievements =
						typeof attr.value === "number"
							? attr.value
							: parseInt(String(attr.value), 10) || 0;
					break;
				case "Last Activity":
					credential.lastActivity = new Date(String(attr.value));
					break;
				default:
					credential.metadata[attr.trait_type] = attr.value;
			}
		}

		return credential;
	}

	// Get collection type from asset
	private getCollectionFromAsset(_asset: DASAsset): string {
		// Check if asset belongs to known collections
		for (const [_type, _address] of Object.entries(this.collectionAddresses)) {
			// This would need to be implemented based on how collections are structured
			// For now, return a default
			return "default";
		}
		return "unknown";
	}

	// Validate credential data
	validateCredential(credential: ParsedCredential): boolean {
		return (
			credential.level >= 0 &&
			credential.coursesCompleted >= 0 &&
			credential.totalXP >= 0 &&
			credential.achievements >= 0 &&
			credential.lastActivity instanceof Date &&
			!Number.isNaN(credential.lastActivity.getTime())
		);
	}
}

export interface ParsedCredential {
	assetId: string;
	owner: string;
	collection: string;
	level: number;
	coursesCompleted: number;
	totalXP: number;
	achievements: number;
	lastActivity: Date;
	metadata: Record<string, unknown>;
}

// Leaderboard Data Aggregator
export class LeaderboardAggregator {
	private cache: Map<string, CachedLeaderboardData> = new Map();

	// Aggregate leaderboard data from DAS
	async aggregateLeaderboardData(
		category: LeaderboardCategory,
		timeframe: Timeframe
	): Promise<LeaderboardEntry[]> {
		const cacheKey = `${category}-${timeframe}`;
		const cached = this.cache.get(cacheKey);

		if (cached && this.isCacheValid(cached)) {
			return cached.data;
		}

		// Get all credentials from DAS
		const allCredentials = await this.fetchAllCredentials();

		// Filter and aggregate based on category and timeframe
		const filteredCredentials = this.filterCredentials(allCredentials, category, timeframe);

		// Convert to leaderboard entries
		const entries = this.convertToLeaderboardEntries(filteredCredentials, category);

		// Sort and rank
		const rankedEntries = this.rankEntries(entries, category);

		// Cache the result
		this.cache.set(cacheKey, {
			data: rankedEntries,
			timestamp: new Date(),
			ttl: 5 * 60 * 1000, // 5 minutes
		});

		return rankedEntries;
	}

	// Get user rank from aggregated data
	async getUserRank(
		userId: string,
		category: LeaderboardCategory,
		timeframe: Timeframe
	): Promise<UserRank | null> {
		const entries = await this.aggregateLeaderboardData(category, timeframe);
		const userEntry = entries.find((entry) => entry.userId === userId);

		if (!userEntry) return null;

		const totalEntries = entries.length;
		const percentile =
			totalEntries > 0 ? ((totalEntries - userEntry.rank) / totalEntries) * 100 : 0;

		return {
			userId,
			rank: userEntry.rank,
			score: this.getScoreFromEntry(userEntry, category),
			percentile,
			category,
			timeframe,
			comparison: {
				rankChange: 0, // Would need historical data
				scoreChange: 0,
			},
		};
	}

	private async fetchAllCredentials(): Promise<ParsedCredential[]> {
		const credentials: ParsedCredential[] = [];

		// This would iterate through all known collection addresses
		// For now, return mock data
		return credentials;
	}

	private filterCredentials(
		credentials: ParsedCredential[],
		category: LeaderboardCategory,
		timeframe: Timeframe
	): ParsedCredential[] {
		const now = new Date();
		const timeframeFilter = this.getTimeframeFilter(timeframe, now);

		return credentials.filter((cred) => {
			// Apply timeframe filter
			if (!timeframeFilter(cred.lastActivity)) return false;

			// Apply category-specific filters
			switch (category) {
				case LeaderboardCategory.GLOBAL_XP:
					return cred.totalXP > 0;
				case LeaderboardCategory.COURSE_COMPLETION:
					return cred.coursesCompleted > 0;
				case LeaderboardCategory.LEVEL_REACHED:
					return cred.level > 0;
				case LeaderboardCategory.ACHIEVEMENT_COUNT:
					return cred.achievements > 0;
				default:
					return true;
			}
		});
	}

	private convertToLeaderboardEntries(
		credentials: ParsedCredential[],
		_category: LeaderboardCategory
	): LeaderboardEntry[] {
		return credentials.map((cred) => ({
			userId: cred.owner,
			username: `User ${cred.owner.slice(0, 8)}`, // Placeholder
			xp: cred.totalXP,
			level: cred.level,
			rank: 0, // Will be set by ranking
			streak: 0, // Would need additional data
			coursesCompleted: cred.coursesCompleted,
			achievements: cred.achievements,
			lastActivity: cred.lastActivity,
		}));
	}

	private rankEntries(
		entries: LeaderboardEntry[],
		category: LeaderboardCategory
	): LeaderboardEntry[] {
		const sortFn = this.getSortFunction(category);

		return entries.sort(sortFn).map((entry, index) => ({
			...entry,
			rank: index + 1,
		}));
	}

	private getSortFunction(category: LeaderboardCategory) {
		switch (category) {
			case LeaderboardCategory.GLOBAL_XP:
				return (a: LeaderboardEntry, b: LeaderboardEntry) => b.xp - a.xp;
			case LeaderboardCategory.COURSE_COMPLETION:
				return (a: LeaderboardEntry, b: LeaderboardEntry) =>
					b.coursesCompleted - a.coursesCompleted;
			case LeaderboardCategory.LEVEL_REACHED:
				return (a: LeaderboardEntry, b: LeaderboardEntry) => b.level - a.level;
			case LeaderboardCategory.ACHIEVEMENT_COUNT:
				return (a: LeaderboardEntry, b: LeaderboardEntry) =>
					b.achievements - a.achievements;
			default:
				return (a: LeaderboardEntry, b: LeaderboardEntry) => b.xp - a.xp;
		}
	}

	private getScoreFromEntry(entry: LeaderboardEntry, category: LeaderboardCategory): number {
		switch (category) {
			case LeaderboardCategory.GLOBAL_XP:
				return entry.xp;
			case LeaderboardCategory.COURSE_COMPLETION:
				return entry.coursesCompleted;
			case LeaderboardCategory.LEVEL_REACHED:
				return entry.level;
			case LeaderboardCategory.ACHIEVEMENT_COUNT:
				return entry.achievements;
			default:
				return entry.xp;
		}
	}

	private getTimeframeFilter(timeframe: Timeframe, now: Date) {
		switch (timeframe) {
			case Timeframe.ALL_TIME:
				return () => true;
			case Timeframe.THIS_MONTH: {
				const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
				return (date: Date) => date >= monthStart;
			}
			case Timeframe.THIS_WEEK: {
				const weekStart = new Date(now);
				weekStart.setDate(now.getDate() - now.getDay());
				weekStart.setHours(0, 0, 0, 0);
				return (date: Date) => date >= weekStart;
			}
			case Timeframe.TODAY: {
				const today = new Date(now);
				today.setHours(0, 0, 0, 0);
				return (date: Date) => date >= today;
			}
			case Timeframe.LAST_30_DAYS: {
				const thirtyDaysAgo = new Date(now);
				thirtyDaysAgo.setDate(now.getDate() - 30);
				return (date: Date) => date >= thirtyDaysAgo;
			}
			case Timeframe.LAST_7_DAYS: {
				const sevenDaysAgo = new Date(now);
				sevenDaysAgo.setDate(now.getDate() - 7);
				return (date: Date) => date >= sevenDaysAgo;
			}
			default:
				return () => true;
		}
	}

	private isCacheValid(cached: CachedLeaderboardData): boolean {
		const now = new Date();
		const age = now.getTime() - cached.timestamp.getTime();
		return age < cached.ttl;
	}
}

interface CachedLeaderboardData {
	data: LeaderboardEntry[];
	timestamp: Date;
	ttl: number;
}
