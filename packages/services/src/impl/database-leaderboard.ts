import type {
	LeaderboardService,
	LeaderboardEntry,
	LeaderboardQuery,
	LeaderboardFilter,
	LeaderboardResult,
	LeaderboardCategory,
	Timeframe,
	UserRank,
	LeaderboardMetadata,
	LeaderboardAnalytics,
} from "../interfaces/leaderboard";
import type { ServiceResponse, PaginatedResponse } from "../types";

interface DatabaseEntry {
	userId: string;
	username: string;
	avatar?: string;
	xp: number;
	level: number;
	streak: number;
	coursesCompleted: number;
	achievements: number;
	lastActivity: Date;
}

export class DatabaseLeaderboardService implements LeaderboardService {
	private db: Map<string, DatabaseEntry> = new Map();

	private toLeaderboardEntry(entry: DatabaseEntry, rank: number): LeaderboardEntry {
		return {
			rank,
			userId: entry.userId,
			username: entry.username,
			...(entry.avatar !== undefined && { avatar: entry.avatar }),
			xp: entry.xp,
			level: entry.level,
			streak: entry.streak,
			coursesCompleted: entry.coursesCompleted,
			achievements: entry.achievements,
			lastActivity: entry.lastActivity,
		};
	}

	private getSortedEntries(): DatabaseEntry[] {
		return Array.from(this.db.values()).sort((a, b) => b.xp - a.xp);
	}

	async getGlobalLeaderboard(
		_filter?: LeaderboardFilter,
		pagination?: { page: number; limit: number }
	): Promise<PaginatedResponse<LeaderboardEntry>> {
		try {
			const entries = this.getSortedEntries();
			const page = pagination?.page ?? 1;
			const limit = pagination?.limit ?? 100;
			const offset = (page - 1) * limit;
			const paged = entries.slice(offset, offset + limit);

			return {
				success: true,
				data: paged.map((e, i) => this.toLeaderboardEntry(e, offset + i + 1)),
				total: entries.length,
				page,
				limit,
			};
		} catch (error) {
			return {
				success: false,
				data: [],
				error: `Failed to fetch leaderboard: ${error instanceof Error ? error.message : "Unknown error"}`,
				total: 0,
				page: 1,
				limit: 100,
			};
		}
	}

	async getUserRank(
		userId: string,
		_filter?: LeaderboardFilter
	): Promise<ServiceResponse<{ rank: number; entry: LeaderboardEntry }>> {
		try {
			const entries = this.getSortedEntries();
			const idx = entries.findIndex((e) => e.userId === userId);
			if (idx === -1) {
				return {
					success: false,
					error: { code: "NOT_FOUND", message: "User not found" },
				};
			}
			const entry = entries[idx];
			if (!entry) {
				return {
					success: false,
					error: { code: "NOT_FOUND", message: "User not found" },
				};
			}
			return {
				success: true,
				data: { rank: idx + 1, entry: this.toLeaderboardEntry(entry, idx + 1) },
			};
		} catch (error) {
			return {
				success: false,
				error: {
					code: "FETCH_ERROR",
					message: `Failed to get rank: ${error instanceof Error ? error.message : "Unknown error"}`,
				},
			};
		}
	}

	async getNearbyRanks(
		userId: string,
		range: number,
		_filter?: LeaderboardFilter
	): Promise<ServiceResponse<LeaderboardEntry[]>> {
		try {
			const entries = this.getSortedEntries();
			const idx = entries.findIndex((e) => e.userId === userId);
			if (idx === -1) {
				return { success: true, data: [] };
			}
			const start = Math.max(0, idx - range);
			const end = Math.min(entries.length, idx + range + 1);
			return {
				success: true,
				data: entries
					.slice(start, end)
					.map((e, i) => this.toLeaderboardEntry(e, start + i + 1)),
			};
		} catch (error) {
			return {
				success: false,
				error: {
					code: "FETCH_ERROR",
					message: `Failed: ${error instanceof Error ? error.message : "Unknown error"}`,
				},
			};
		}
	}

	async getTrackLeaderboard(
		_trackId: number,
		_filter?: LeaderboardFilter,
		pagination?: { page: number; limit: number }
	): Promise<PaginatedResponse<LeaderboardEntry>> {
		return this.getGlobalLeaderboard(_filter, pagination);
	}

	async updateUserStats(
		userId: string,
		stats: Partial<
			Pick<LeaderboardEntry, "xp" | "streak" | "coursesCompleted" | "achievements">
		>
	): Promise<ServiceResponse<void>> {
		try {
			const existing = this.db.get(userId);
			if (existing) {
				this.db.set(userId, { ...existing, ...stats, lastActivity: new Date() });
			} else {
				this.db.set(userId, {
					userId,
					username: `User ${userId.slice(0, 8)}`,
					xp: stats.xp ?? 0,
					level: 1,
					streak: stats.streak ?? 0,
					coursesCompleted: stats.coursesCompleted ?? 0,
					achievements: stats.achievements ?? 0,
					lastActivity: new Date(),
				});
			}
			return { success: true };
		} catch (error) {
			return {
				success: false,
				error: {
					code: "UPDATE_ERROR",
					message: `Failed: ${error instanceof Error ? error.message : "Unknown error"}`,
				},
			};
		}
	}

	async refreshLeaderboard(): Promise<ServiceResponse<void>> {
		return { success: true };
	}

	async queryLeaderboard(query: LeaderboardQuery): Promise<ServiceResponse<LeaderboardResult>> {
		try {
			const entries = this.getSortedEntries();
			const paged = entries.slice(query.offset, query.offset + query.limit);
			return {
				success: true,
				data: {
					entries: paged.map((e, i) => this.toLeaderboardEntry(e, query.offset + i + 1)),
					totalCount: entries.length,
					lastUpdated: new Date(),
					query,
				},
			};
		} catch (error) {
			return {
				success: false,
				error: {
					code: "QUERY_ERROR",
					message: `Failed: ${error instanceof Error ? error.message : "Unknown error"}`,
				},
			};
		}
	}

	async getUserRankEnhanced(
		userId: string,
		category: LeaderboardCategory,
		timeframe: Timeframe
	): Promise<ServiceResponse<UserRank | null>> {
		try {
			const entries = this.getSortedEntries();
			const idx = entries.findIndex((e) => e.userId === userId);
			if (idx === -1) return { success: true, data: null };
			const entry = entries[idx];
			if (!entry) return { success: true, data: null };
			return {
				success: true,
				data: {
					userId,
					rank: idx + 1,
					score: entry.xp,
					percentile: ((entries.length - idx) / entries.length) * 100,
					category,
					timeframe,
					comparison: { rankChange: 0, scoreChange: 0 },
				},
			};
		} catch (error) {
			return {
				success: false,
				error: {
					code: "FETCH_ERROR",
					message: `Failed: ${error instanceof Error ? error.message : "Unknown error"}`,
				},
			};
		}
	}

	async getUserRanks(
		userIds: string[],
		category: LeaderboardCategory,
		timeframe: Timeframe
	): Promise<ServiceResponse<UserRank[]>> {
		try {
			const results: UserRank[] = [];
			for (const userId of userIds) {
				const result = await this.getUserRankEnhanced(userId, category, timeframe);
				if (result.success && result.data) {
					results.push(result.data);
				}
			}
			return { success: true, data: results };
		} catch (error) {
			return {
				success: false,
				error: {
					code: "FETCH_ERROR",
					message: `Failed: ${error instanceof Error ? error.message : "Unknown error"}`,
				},
			};
		}
	}

	async updateCache(
		_category: LeaderboardCategory,
		_timeframe: Timeframe
	): Promise<ServiceResponse<void>> {
		return { success: true };
	}

	async getLeaderboardMetadata(
		category: LeaderboardCategory,
		timeframe: Timeframe
	): Promise<ServiceResponse<LeaderboardMetadata>> {
		return {
			success: true,
			data: {
				category,
				timeframe,
				totalParticipants: this.db.size,
				lastUpdated: new Date(),
				updateFrequency: "5m",
				description: `${category} leaderboard`,
			},
		};
	}

	async getLeaderboardAnalytics(
		category: LeaderboardCategory,
		timeframe: Timeframe
	): Promise<ServiceResponse<LeaderboardAnalytics>> {
		const entries = this.getSortedEntries();
		const scores = entries.map((e) => e.xp);
		const total = scores.reduce((a, b) => a + b, 0);
		return {
			success: true,
			data: {
				category,
				timeframe,
				totalEntries: entries.length,
				averageScore: entries.length > 0 ? total / entries.length : 0,
				medianScore: entries.length > 0 ? (scores[Math.floor(entries.length / 2)] ?? 0) : 0,
				topScore: scores[0] ?? 0,
				scoreDistribution: { ranges: [] },
				participationTrend: [],
				lastUpdated: new Date(),
			},
		};
	}
}
