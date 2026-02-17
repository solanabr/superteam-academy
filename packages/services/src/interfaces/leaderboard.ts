import type { ServiceResponse, PaginatedResponse } from "../types";

export interface LeaderboardEntry {
	userId: string;
	username: string;
	avatar?: string;
	xp: number;
	level: number;
	rank: number;
	streak: number;
	coursesCompleted: number;
	achievements: number;
	lastActivity: Date;
}

export interface LeaderboardFilter {
	timeframe?: "daily" | "weekly" | "monthly" | "all-time";
	category?: "xp" | "streak" | "courses" | "achievements";
	trackId?: number;
	country?: string;
}

export interface LeaderboardQuery {
	category: LeaderboardCategory;
	timeframe: Timeframe;
	limit: number;
	offset: number;
	filters?: LeaderboardFilters;
}

export interface LeaderboardFilters {
	courseId?: string;
	trackId?: string;
	country?: string;
	level?: number;
}

export interface LeaderboardResult {
	entries: LeaderboardEntry[];
	totalCount: number;
	lastUpdated: Date;
	query: LeaderboardQuery;
}

export interface UserRank {
	userId: string;
	rank: number;
	score: number;
	percentile: number;
	category: LeaderboardCategory;
	timeframe: Timeframe;
	comparison: RankComparison;
}

export interface RankComparison {
	previousRank?: number;
	rankChange: number;
	previousScore?: number;
	scoreChange: number;
}

export enum LeaderboardCategory {
	GLOBAL_XP = "global_xp",
	COURSE_COMPLETION = "course_completion",
	STREAK_LENGTH = "streak_length",
	ACHIEVEMENT_COUNT = "achievement_count",
	LEVEL_REACHED = "level_reached",
	SOCIAL_ENGAGEMENT = "social_engagement",
	LEARNING_SPEED = "learning_speed",
	CHALLENGE_SUCCESS = "challenge_success",
}

export enum Timeframe {
	ALL_TIME = "all_time",
	THIS_MONTH = "this_month",
	THIS_WEEK = "this_week",
	TODAY = "today",
	LAST_30_DAYS = "last_30_days",
	LAST_7_DAYS = "last_7_days",
}

// Helius DAS Integration Types
export interface HeliusDASQuery {
	jsonrpc: "2.0";
	id: string;
	method: string;
	params: unknown[];
}

export interface HeliusDASResponse {
	jsonrpc: "2.0";
	id: string;
	result?: unknown;
	error?: {
		code: number;
		message: string;
	};
}

export interface DASAsset {
	id: string;
	content: {
		metadata: {
			name: string;
			description: string;
			attributes?: Array<{
				trait_type: string;
				value: string | number;
			}>;
		};
	};
	ownership: {
		owner: string;
	};
	compression: {
		compressed: boolean;
		tree?: string;
		leaf_id?: number;
	};
}

export interface LeaderboardService {
	// Legacy methods for backward compatibility
	getGlobalLeaderboard(
		filter?: LeaderboardFilter,
		pagination?: { page: number; limit: number }
	): Promise<PaginatedResponse<LeaderboardEntry>>;
	getUserRank(
		userId: string,
		filter?: LeaderboardFilter
	): Promise<ServiceResponse<{ rank: number; entry: LeaderboardEntry }>>;
	getNearbyRanks(
		userId: string,
		range: number,
		filter?: LeaderboardFilter
	): Promise<ServiceResponse<LeaderboardEntry[]>>;
	getTrackLeaderboard(
		trackId: number,
		filter?: LeaderboardFilter,
		pagination?: { page: number; limit: number }
	): Promise<PaginatedResponse<LeaderboardEntry>>;
	updateUserStats(
		userId: string,
		stats: Partial<
			Pick<LeaderboardEntry, "xp" | "streak" | "coursesCompleted" | "achievements">
		>
	): Promise<ServiceResponse<void>>;
	refreshLeaderboard(): Promise<ServiceResponse<void>>;

	// New Helius DAS enhanced methods
	queryLeaderboard(query: LeaderboardQuery): Promise<ServiceResponse<LeaderboardResult>>;
	getUserRankEnhanced(
		userId: string,
		category: LeaderboardCategory,
		timeframe: Timeframe
	): Promise<ServiceResponse<UserRank | null>>;
	getUserRanks(
		userIds: string[],
		category: LeaderboardCategory,
		timeframe: Timeframe
	): Promise<ServiceResponse<UserRank[]>>;
	updateCache(
		category: LeaderboardCategory,
		timeframe: Timeframe
	): Promise<ServiceResponse<void>>;
	getLeaderboardMetadata(
		category: LeaderboardCategory,
		timeframe: Timeframe
	): Promise<ServiceResponse<LeaderboardMetadata>>;
	getLeaderboardAnalytics(
		category: LeaderboardCategory,
		timeframe: Timeframe
	): Promise<ServiceResponse<LeaderboardAnalytics>>;
}

export interface LeaderboardMetadata {
	category: LeaderboardCategory;
	timeframe: Timeframe;
	totalParticipants: number;
	lastUpdated: Date;
	updateFrequency: string;
	description: string;
}

export interface LeaderboardAnalytics {
	category: LeaderboardCategory;
	timeframe: Timeframe;
	totalEntries: number;
	averageScore: number;
	medianScore: number;
	topScore: number;
	scoreDistribution: ScoreDistribution;
	participationTrend: ParticipationTrend[];
	lastUpdated: Date;
}

export interface ScoreDistribution {
	ranges: Array<{
		min: number;
		max: number;
		count: number;
		percentage: number;
	}>;
}

export interface ParticipationTrend {
	date: string;
	participants: number;
	averageScore: number;
}
