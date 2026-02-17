import {
    type LeaderboardService,
    type LeaderboardEntry,
    type LeaderboardFilter,
    type LeaderboardFilters,
    type LeaderboardQuery,
    type LeaderboardResult,
    type UserRank,
    LeaderboardCategory,
    Timeframe,
    type LeaderboardMetadata,
    type LeaderboardAnalytics,
    type ScoreDistribution,
} from "../interfaces/leaderboard";
import type { ServiceResponse, PaginatedResponse } from "../types";
import { HeliusDASClient, CredentialParser, LeaderboardAggregator } from "../leaderboard/helius-das-integration";

// Enhanced Leaderboard Service with Helius DAS Integration
export class HeliusLeaderboardService implements LeaderboardService {
	private dasClient: HeliusDASClient;
	private credentialParser: CredentialParser;
	private aggregator: LeaderboardAggregator;
	private cache: Map<string, CachedResult> = new Map();

	constructor(heliusApiKey: string, collectionAddresses: Record<string, string> = {}) {
		this.dasClient = new HeliusDASClient(heliusApiKey);
		this.credentialParser = new CredentialParser(collectionAddresses);
		this.aggregator = new LeaderboardAggregator(this.dasClient, this.credentialParser);
	}

	// Legacy methods for backward compatibility
	async getGlobalLeaderboard(
		filter?: LeaderboardFilter,
		pagination?: { page: number; limit: number }
	): Promise<PaginatedResponse<LeaderboardEntry>> {
		try {
			const query = this.convertLegacyFilterToQuery(filter, pagination);
			const result = await this.queryLeaderboard(query);

			if (!result.success) {
				return {
					success: false,
					data: [],
					total: 0,
					page: pagination?.page || 1,
					limit: pagination?.limit || 50,
				};
			}

			return {
				success: true,
				data: result.data!.entries,
				total: result.data!.totalCount,
				page: pagination?.page || 1,
				limit: pagination?.limit || 50,
			};
		} catch (error) {
			console.error("Error getting global leaderboard:", error);
			return {
				success: false,
				data: [],
				total: 0,
				page: pagination?.page || 1,
				limit: pagination?.limit || 50,
			};
		}
	}

	async getUserRank(
		userId: string,
		filter?: LeaderboardFilter
	): Promise<ServiceResponse<{ rank: number; entry: LeaderboardEntry }>> {
		try {
			const category = this.convertLegacyCategory(filter?.category || "xp");
			const timeframe = this.convertLegacyTimeframe(filter?.timeframe || "all-time");

			const rankResult = await this.getUserRankEnhanced(userId, category, timeframe);

			if (!rankResult.success || !rankResult.data) {
				return {
					success: false,
					error: "User not found in leaderboard",
				};
			}

			// Get the full entry from leaderboard
			const leaderboardQuery = await this.queryLeaderboard({
				category,
				timeframe,
				limit: 1,
				offset: rankResult.data!.rank - 1,
			});

			const entry =
				leaderboardQuery.success && leaderboardQuery.data!.entries.length > 0
					? leaderboardQuery.data!.entries[0]
					: null;

			if (!entry) {
				return {
					success: false,
					error: "User entry not found",
				};
			}

			return {
				success: true,
				data: {
					rank: rankResult.data!.rank,
					entry,
				},
			};
		} catch (error) {
			console.error("Error getting user rank:", error);
			return {
				success: false,
				error: "Failed to get user rank",
			};
		}
	}

	async getNearbyRanks(
		userId: string,
		range: number,
		filter?: LeaderboardFilter
	): Promise<ServiceResponse<LeaderboardEntry[]>> {
		try {
			const category = this.convertLegacyCategory(filter?.category || "xp");
			const timeframe = this.convertLegacyTimeframe(filter?.timeframe || "all-time");

			const userRankResult = await this.getUserRankEnhanced(userId, category, timeframe);

			if (!userRankResult.success || !userRankResult.data) {
				return {
					success: false,
					error: "User not found in leaderboard",
				};
			}

			const userRank = userRankResult.data!.rank;
			const startRank = Math.max(1, userRank - range);
			const endRank = userRank + range;

			const query: LeaderboardQuery = {
				category,
				timeframe,
				limit: endRank - startRank + 1,
				offset: startRank - 1,
			};

			const result = await this.queryLeaderboard(query);

			return {
				success: result.success,
				data: result.success ? result.data!.entries : [],
				...(!result.success && result.error !== undefined ? { error: result.error } : {}),
			};
		} catch (error) {
			console.error("Error getting nearby ranks:", error);
			return {
				success: false,
				error: "Failed to get nearby ranks",
			};
		}
	}

	async getTrackLeaderboard(
		trackId: number,
		filter?: LeaderboardFilter,
		pagination?: { page: number; limit: number }
	): Promise<PaginatedResponse<LeaderboardEntry>> {
		try {
			const query: LeaderboardQuery = {
				category: LeaderboardCategory.GLOBAL_XP,
				timeframe: this.convertLegacyTimeframe(filter?.timeframe || "all-time"),
				limit: pagination?.limit || 50,
				offset: ((pagination?.page || 1) - 1) * (pagination?.limit || 50),
				filters: {
					trackId: trackId.toString(),
				},
			};

			const result = await this.queryLeaderboard(query);

			if (!result.success) {
				return {
					success: false,
					data: [],
					total: 0,
					page: pagination?.page || 1,
					limit: pagination?.limit || 50,
				};
			}

			return {
				success: true,
				data: result.data!.entries,
				total: result.data!.totalCount,
				page: pagination?.page || 1,
				limit: pagination?.limit || 50,
			};
		} catch (error) {
			console.error("Error getting track leaderboard:", error);
			return {
				success: false,
				data: [],
				total: 0,
				page: pagination?.page || 1,
				limit: pagination?.limit || 50,
			};
		}
	}

	async updateUserStats(
		userId: string,
		_stats: Partial<
			Pick<LeaderboardEntry, "xp" | "streak" | "coursesCompleted" | "achievements">
		>
	): Promise<ServiceResponse<void>> {
		try {
			// Invalidate cache for affected categories
			this.invalidateUserCache(userId);

			// Trigger cache updates for relevant categories
			await Promise.all([
				this.updateCache(LeaderboardCategory.GLOBAL_XP, Timeframe.ALL_TIME),
				this.updateCache(LeaderboardCategory.COURSE_COMPLETION, Timeframe.ALL_TIME),
				this.updateCache(LeaderboardCategory.ACHIEVEMENT_COUNT, Timeframe.ALL_TIME),
			]);

			return { success: true };
		} catch (error) {
			console.error("Error updating user stats:", error);
			return {
				success: false,
				error: "Failed to update user stats",
			};
		}
	}

	async refreshLeaderboard(): Promise<ServiceResponse<void>> {
		try {
			// Clear all cache
			this.cache.clear();

			// Trigger updates for all major categories
			const categories = Object.values(LeaderboardCategory);
			const timeframes = Object.values(Timeframe);

			const updatePromises: Promise<ServiceResponse<void>>[] = [];
			for (const category of categories) {
				for (const timeframe of timeframes) {
					updatePromises.push(this.updateCache(category, timeframe));
				}
			}

			await Promise.all(updatePromises);

			return { success: true };
		} catch (error) {
			console.error("Error refreshing leaderboard:", error);
			return {
				success: false,
				error: "Failed to refresh leaderboard",
			};
		}
	}

	// Enhanced methods with Helius DAS integration
	async queryLeaderboard(query: LeaderboardQuery): Promise<ServiceResponse<LeaderboardResult>> {
		try {
			const cacheKey = this.getCacheKey(query);
			const cached = this.cache.get(cacheKey);

			if (cached && this.isCacheValid(cached)) {
				return {
					success: true,
					data: cached.data,
				};
			}

			const entries = await this.aggregator.aggregateLeaderboardData(
				query.category,
				query.timeframe
			);

			// Apply filters
			let filteredEntries = entries;
			if (query.filters) {
				filteredEntries = this.applyFilters(entries, query.filters);
			}

			// Apply pagination
			const paginatedEntries = filteredEntries.slice(
				query.offset,
				query.offset + query.limit
			);

			const result: LeaderboardResult = {
				entries: paginatedEntries,
				totalCount: filteredEntries.length,
				lastUpdated: new Date(),
				query,
			};

			// Cache the result
			this.cache.set(cacheKey, {
				data: result,
				timestamp: new Date(),
				ttl: 5 * 60 * 1000, // 5 minutes
			});

			return {
				success: true,
				data: result,
			};
		} catch (error) {
			console.error("Error querying leaderboard:", error);
			return {
				success: false,
				error: "Failed to query leaderboard",
			};
		}
	}

	async getUserRankEnhanced(
		userId: string,
		category: LeaderboardCategory,
		timeframe: Timeframe
	): Promise<ServiceResponse<UserRank | null>> {
		try {
			const rank = await this.aggregator.getUserRank(userId, category, timeframe);

			return {
				success: true,
				data: rank,
			};
		} catch (error) {
			console.error("Error getting user rank:", error);
			return {
				success: false,
				error: "Failed to get user rank",
			};
		}
	}

	async getUserRanks(
		userIds: string[],
		category: LeaderboardCategory,
		timeframe: Timeframe
	): Promise<ServiceResponse<UserRank[]>> {
		try {
			const ranks = await Promise.all(
				userIds.map((userId) => this.aggregator.getUserRank(userId, category, timeframe))
			);

			return {
				success: true,
				data: ranks.filter((rank): rank is UserRank => rank !== null),
			};
		} catch (error) {
			console.error("Error getting user ranks:", error);
			return {
				success: false,
				error: "Failed to get user ranks",
			};
		}
	}

	async updateCache(
		category: LeaderboardCategory,
		timeframe: Timeframe
	): Promise<ServiceResponse<void>> {
		try {
			// Force refresh by clearing cache and re-aggregating
			const cacheKey = `${category}-${timeframe}`;
			this.cache.delete(cacheKey);

			await this.aggregator.aggregateLeaderboardData(category, timeframe);

			return { success: true };
		} catch (error) {
			console.error("Error updating cache:", error);
			return {
				success: false,
				error: "Failed to update cache",
			};
		}
	}

	async getLeaderboardMetadata(
		category: LeaderboardCategory,
		timeframe: Timeframe
	): Promise<ServiceResponse<LeaderboardMetadata>> {
		try {
			const entries = await this.aggregator.aggregateLeaderboardData(category, timeframe);

			const metadata: LeaderboardMetadata = {
				category,
				timeframe,
				totalParticipants: entries.length,
				lastUpdated: new Date(),
				updateFrequency: "5 minutes",
				description: this.getCategoryDescription(category),
			};

			return {
				success: true,
				data: metadata,
			};
		} catch (error) {
			console.error("Error getting leaderboard metadata:", error);
			return {
				success: false,
				error: "Failed to get leaderboard metadata",
			};
		}
	}

	async getLeaderboardAnalytics(
		category: LeaderboardCategory,
		timeframe: Timeframe
	): Promise<ServiceResponse<LeaderboardAnalytics>> {
		try {
			const entries = await this.aggregator.aggregateLeaderboardData(category, timeframe);

			const scores = entries.map((entry) => this.getScoreFromEntry(entry, category));
			const analytics = this.calculateAnalytics(scores, category, timeframe);

			return {
				success: true,
				data: analytics,
			};
		} catch (error) {
			console.error("Error getting leaderboard analytics:", error);
			return {
				success: false,
				error: "Failed to get leaderboard analytics",
			};
		}
	}

	// Helper methods
	private convertLegacyFilterToQuery(
		filter?: LeaderboardFilter,
		pagination?: { page: number; limit: number }
	): LeaderboardQuery {
		const filters: LeaderboardFilters = {};
		const trackIdStr = filter?.trackId?.toString();
		if (trackIdStr !== undefined) {
			filters.trackId = trackIdStr;
		}
		if (filter?.country !== undefined) {
			filters.country = filter.country;
		}
		return {
			category: this.convertLegacyCategory(filter?.category || "xp"),
			timeframe: this.convertLegacyTimeframe(filter?.timeframe || "all-time"),
			limit: pagination?.limit || 50,
			offset: ((pagination?.page || 1) - 1) * (pagination?.limit || 50),
			filters,
		};
	}

	private convertLegacyCategory(category: string): LeaderboardCategory {
		switch (category) {
			case "xp":
				return LeaderboardCategory.GLOBAL_XP;
			case "streak":
				return LeaderboardCategory.STREAK_LENGTH;
			case "courses":
				return LeaderboardCategory.COURSE_COMPLETION;
			case "achievements":
				return LeaderboardCategory.ACHIEVEMENT_COUNT;
			default:
				return LeaderboardCategory.GLOBAL_XP;
		}
	}

	private convertLegacyTimeframe(timeframe: string): Timeframe {
		switch (timeframe) {
			case "daily":
				return Timeframe.TODAY;
			case "weekly":
				return Timeframe.THIS_WEEK;
			case "monthly":
				return Timeframe.THIS_MONTH;
			case "all-time":
				return Timeframe.ALL_TIME;
			default:
				return Timeframe.ALL_TIME;
		}
	}

	private applyFilters(entries: LeaderboardEntry[], filters: LeaderboardFilters): LeaderboardEntry[] {
		return entries.filter((entry) => {
			if (filters.trackId && entry.userId !== filters.trackId) return false;
			if (filters.country && entry.avatar !== filters.country) return false; // Placeholder
			if (filters.level && entry.level < filters.level) return false;
			return true;
		});
	}

	private getScoreFromEntry(entry: LeaderboardEntry, category: LeaderboardCategory): number {
		switch (category) {
			case LeaderboardCategory.GLOBAL_XP:
				return entry.xp;
			case LeaderboardCategory.COURSE_COMPLETION:
				return entry.coursesCompleted;
			case LeaderboardCategory.STREAK_LENGTH:
				return entry.streak;
			case LeaderboardCategory.ACHIEVEMENT_COUNT:
				return entry.achievements;
			case LeaderboardCategory.LEVEL_REACHED:
				return entry.level;
			default:
				return entry.xp;
		}
	}

	private calculateAnalytics(
		scores: number[],
		category: LeaderboardCategory,
		timeframe: Timeframe
	): LeaderboardAnalytics {
		if (scores.length === 0) {
			return {
				category,
				timeframe,
				totalEntries: 0,
				averageScore: 0,
				medianScore: 0,
				topScore: 0,
				scoreDistribution: { ranges: [] },
				participationTrend: [],
				lastUpdated: new Date(),
			};
		}

		const sortedScores = [...scores].sort((a, b) => a - b);
		const medianScore = sortedScores[Math.floor(sortedScores.length / 2)];
		const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
		const topScore = Math.max(...scores);

		const scoreDistribution = this.calculateScoreDistribution(scores);

		return {
			category,
			timeframe,
			totalEntries: scores.length,
			averageScore,
			medianScore,
			topScore,
			scoreDistribution,
			participationTrend: [], // Would need historical data
			lastUpdated: new Date(),
		};
	}

	private calculateScoreDistribution(scores: number[]): ScoreDistribution {
		if (scores.length === 0) return { ranges: [] };

		const min = Math.min(...scores);
		const max = Math.max(...scores);
		const range = max - min || 1;
		const bucketSize = range / 10;

		const ranges: ScoreDistribution["ranges"] = [];
		for (let i = 0; i < 10; i++) {
			const rangeMin = min + i * bucketSize;
			const rangeMax = min + (i + 1) * bucketSize;
			const count = scores.filter((score) => score >= rangeMin && score < rangeMax).length;
			const percentage = (count / scores.length) * 100;

			ranges.push({
				min: Math.floor(rangeMin),
				max: Math.floor(rangeMax),
				count,
				percentage,
			});
		}

		return { ranges };
	}

	private getCategoryDescription(category: LeaderboardCategory): string {
		switch (category) {
			case LeaderboardCategory.GLOBAL_XP:
				return "Top learners by total XP earned";
			case LeaderboardCategory.COURSE_COMPLETION:
				return "Most courses completed";
			case LeaderboardCategory.STREAK_LENGTH:
				return "Longest learning streaks";
			case LeaderboardCategory.ACHIEVEMENT_COUNT:
				return "Most achievements unlocked";
			case LeaderboardCategory.LEVEL_REACHED:
				return "Highest levels reached";
			default:
				return "Leaderboard ranking";
		}
	}

	private getCacheKey(query: LeaderboardQuery): string {
		return `${query.category}-${query.timeframe}-${query.limit}-${query.offset}-${JSON.stringify(query.filters)}`;
	}

	private isCacheValid(cached: CachedResult): boolean {
		const now = new Date();
		const age = now.getTime() - cached.timestamp.getTime();
		return age < cached.ttl;
	}

	private invalidateUserCache(userId: string): void {
		// Invalidate cache entries that might contain this user
		for (const [key, cached] of this.cache) {
			if (cached.data.entries.some((entry) => entry.userId === userId)) {
				this.cache.delete(key);
			}
		}
	}
}

interface CachedResult {
	data: LeaderboardResult;
	timestamp: Date;
	ttl: number;
}
