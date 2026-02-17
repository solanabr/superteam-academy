import type { ServiceResponse } from "../types";
import type {
    LeaderboardCategory,
    Timeframe,
    LeaderboardAnalytics,
    ScoreDistribution,
} from "./leaderboard";

export type { ServiceResponse, LeaderboardAnalytics, ScoreDistribution };

export interface ParticipationTrend {
	date: string;
	participants: number;
	newParticipants: number;
	activeParticipants: number;
}

export interface LeaderboardInsights {
	category: LeaderboardCategory;
	timeframe: Timeframe;
	insights: string[];
	generatedAt: Date;
}

export interface AnalyticsQuery {
	category: LeaderboardCategory;
	timeframe: Timeframe;
	includeBasicMetrics?: boolean;
	includeScoreDistribution?: boolean;
	includeParticipationTrends?: boolean;
	includeInsights?: boolean;
}

export interface AnalyticsResult {
	category: LeaderboardCategory;
	timeframe: Timeframe;
	metrics: Record<string, unknown>;
	insights: string[];
	generatedAt: Date;
}

export interface LeaderboardAnalyticsService {
	getLeaderboardAnalytics(
		category: LeaderboardCategory,
		timeframe: Timeframe
	): Promise<ServiceResponse<LeaderboardAnalytics>>;
	getScoreDistribution(
		category: LeaderboardCategory,
		timeframe: Timeframe,
		buckets?: number
	): Promise<ServiceResponse<ScoreDistribution>>;
	getParticipationTrends(
		category: LeaderboardCategory,
		timeframe: Timeframe,
		days?: number
	): Promise<ServiceResponse<ParticipationTrend[]>>;
	getLeaderboardInsights(
		category: LeaderboardCategory,
		timeframe: Timeframe
	): Promise<ServiceResponse<LeaderboardInsights>>;
	queryAnalytics(query: AnalyticsQuery): Promise<ServiceResponse<AnalyticsResult>>;
	exportAnalytics(
		category: LeaderboardCategory,
		timeframe: Timeframe,
		format?: "json" | "csv"
	): Promise<ServiceResponse<string>>;
}
