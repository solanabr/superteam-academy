import type {
	LeaderboardAnalyticsService,
	LeaderboardAnalytics,
	ScoreDistribution,
	ParticipationTrend,
	LeaderboardInsights,
	AnalyticsQuery,
	AnalyticsResult,
} from "../interfaces/leaderboard-analytics";
import { LeaderboardCategory, Timeframe } from "../interfaces/leaderboard";
import type { LeaderboardEntry } from "../interfaces/leaderboard";
import type { ServiceResponse } from "../types";
import type { HeliusLeaderboardService } from "./helius-leaderboard";

// Leaderboard Analytics Service Implementation
export class HeliusLeaderboardAnalyticsService implements LeaderboardAnalyticsService {
	private leaderboardService: HeliusLeaderboardService;
	private analyticsCache: Map<string, CachedAnalytics> = new Map();

	constructor(leaderboardService: HeliusLeaderboardService) {
		this.leaderboardService = leaderboardService;
	}

	async getLeaderboardAnalytics(
		category: LeaderboardCategory,
		timeframe: Timeframe
	): Promise<ServiceResponse<LeaderboardAnalytics>> {
		try {
			const cacheKey = `analytics-${category}-${timeframe}`;
			const cached = this.analyticsCache.get(cacheKey);

			if (cached && this.isCacheValid(cached)) {
				return {
					success: true,
					data: cached.data,
				};
			}

			const analytics = await this.leaderboardService.getLeaderboardAnalytics(
				category,
				timeframe
			);

			if (!analytics.success || !analytics.data) {
				return analytics;
			}

			// Cache the result
			this.analyticsCache.set(cacheKey, {
				data: analytics.data,
				timestamp: new Date(),
				ttl: 10 * 60 * 1000, // 10 minutes
			});

			return analytics;
		} catch (error) {
			const msg = error instanceof Error ? error.message : "Unknown error";
			console.error("Error getting leaderboard analytics:", msg);
			return {
				success: false,
				error: "Failed to get leaderboard analytics",
			};
		}
	}

	async getScoreDistribution(
		category: LeaderboardCategory,
		timeframe: Timeframe,
		buckets = 10
	): Promise<ServiceResponse<ScoreDistribution>> {
		try {
			const analytics = await this.getLeaderboardAnalytics(category, timeframe);

			if (!analytics.success) {
				return {
					success: false,
					...(analytics.error !== undefined ? { error: analytics.error } : {}),
				};
			}

			// Recalculate with custom bucket count if different
			if (buckets !== 10) {
				const entries = await this.leaderboardService.queryLeaderboard({
					category,
					timeframe,
					limit: 1000,
					offset: 0,
				});

				if (!entries.success) {
					return {
						success: false,
						error: "Failed to get entries for distribution",
					};
				}

				const scores = entries.data?.entries.map((entry: LeaderboardEntry) =>
					this.getScoreFromEntry(entry, category)
				);

				const distribution = this.calculateScoreDistribution(scores, buckets);
				return {
					success: true,
					data: distribution,
				};
			}

			return {
				success: true,
				data: analytics.data?.scoreDistribution,
			};
		} catch (error) {
			const msg = error instanceof Error ? error.message : "Unknown error";
			console.error("Error getting score distribution:", msg);
			return {
				success: false,
				error: "Failed to get score distribution",
			};
		}
	}

	async getParticipationTrends(
		category: LeaderboardCategory,
		timeframe: Timeframe,
		days = 30
	): Promise<ServiceResponse<ParticipationTrend[]>> {
		try {
			// This would typically query historical data
			// For now, return mock data based on current participation
			const currentAnalytics = await this.getLeaderboardAnalytics(category, timeframe);

			if (!currentAnalytics.success) {
				return {
					success: false,
					...(currentAnalytics.error !== undefined
						? { error: currentAnalytics.error }
						: {}),
				};
			}

			const trends: ParticipationTrend[] = [];
			const baseDate = new Date();

			for (let i = days - 1; i >= 0; i--) {
				const date = new Date(baseDate);
				date.setDate(date.getDate() - i);

				// Simulate trend data (in real implementation, this would come from historical data)
				const participation = Math.floor(
					currentAnalytics.data?.totalEntries * (0.8 + Math.random() * 0.4)
				);

				trends.push({
					date: date.toISOString().split("T")[0],
					participants: participation,
					newParticipants: Math.floor(participation * 0.1),
					activeParticipants: Math.floor(participation * 0.7),
				});
			}

			return {
				success: true,
				data: trends,
			};
		} catch (error) {
			const msg = error instanceof Error ? error.message : "Unknown error";
			console.error("Error getting participation trends:", msg);
			return {
				success: false,
				error: "Failed to get participation trends",
			};
		}
	}

	async getLeaderboardInsights(
		category: LeaderboardCategory,
		timeframe: Timeframe
	): Promise<ServiceResponse<LeaderboardInsights>> {
		try {
			const analytics = await this.getLeaderboardAnalytics(category, timeframe);

			if (!analytics.success || !analytics.data) {
				return {
					success: false,
					...(analytics.error !== undefined ? { error: analytics.error } : {}),
				};
			}

			const insights = this.generateInsights(analytics.data, category, timeframe);

			return {
				success: true,
				data: insights,
			};
		} catch (error) {
			const msg = error instanceof Error ? error.message : "Unknown error";
			console.error("Error getting leaderboard insights:", msg);
			return {
				success: false,
				error: "Failed to get leaderboard insights",
			};
		}
	}

	async queryAnalytics(query: AnalyticsQuery): Promise<ServiceResponse<AnalyticsResult>> {
		try {
			const results: AnalyticsResult = {
				category: query.category,
				timeframe: query.timeframe,
				metrics: {},
				insights: [],
				generatedAt: new Date(),
			};

			// Get basic analytics
			if (query.includeBasicMetrics) {
				const analytics = await this.getLeaderboardAnalytics(
					query.category,
					query.timeframe
				);
				if (analytics.success) {
					results.metrics = {
						totalParticipants: analytics.data?.totalEntries,
						averageScore: analytics.data?.averageScore,
						medianScore: analytics.data?.medianScore,
						topScore: analytics.data?.topScore,
					};
				}
			}

			// Get score distribution
			if (query.includeScoreDistribution) {
				const distribution = await this.getScoreDistribution(
					query.category,
					query.timeframe
				);
				if (distribution.success) {
					results.metrics.scoreDistribution = distribution.data;
				}
			}

			// Get participation trends
			if (query.includeParticipationTrends) {
				const trends = await this.getParticipationTrends(query.category, query.timeframe);
				if (trends.success) {
					results.metrics.participationTrends = trends.data;
				}
			}

			// Get insights
			if (query.includeInsights) {
				const insights = await this.getLeaderboardInsights(query.category, query.timeframe);
				if (insights.success) {
					results.insights = insights.data?.insights;
				}
			}

			return {
				success: true,
				data: results,
			};
		} catch (error) {
			const msg = error instanceof Error ? error.message : "Unknown error";
			console.error("Error querying analytics:", msg);
			return {
				success: false,
				error: "Failed to query analytics",
			};
		}
	}

	async exportAnalytics(
		category: LeaderboardCategory,
		timeframe: Timeframe,
		format: "json" | "csv" = "json"
	): Promise<ServiceResponse<string>> {
		try {
			const analytics = await this.queryAnalytics({
				category,
				timeframe,
				includeBasicMetrics: true,
				includeScoreDistribution: true,
				includeParticipationTrends: true,
				includeInsights: true,
			});

			if (!analytics.success) {
				return {
					success: false,
					...(analytics.error !== undefined ? { error: analytics.error } : {}),
				};
			}

			if (format === "csv" && analytics.data) {
				const csv = this.convertAnalyticsToCSV(analytics.data);
				return {
					success: true,
					data: csv,
				};
			}

			return {
				success: true,
				data: JSON.stringify(analytics.data, null, 2),
			};
		} catch (error) {
			const msg = error instanceof Error ? error.message : "Unknown error";
			console.error("Error exporting analytics:", msg);
			return {
				success: false,
				error: "Failed to export analytics",
			};
		}
	}

	// Helper methods
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

	private calculateScoreDistribution(scores: number[], buckets: number): ScoreDistribution {
		if (scores.length === 0) return { ranges: [] };

		const min = Math.min(...scores);
		const max = Math.max(...scores);
		const range = max - min || 1;
		const bucketSize = range / buckets;

		const ranges: { min: number; max: number; count: number; percentage: number }[] = [];
		for (let i = 0; i < buckets; i++) {
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

	private generateInsights(
		analytics: LeaderboardAnalytics,
		category: LeaderboardCategory,
		timeframe: Timeframe
	): LeaderboardInsights {
		const insights: string[] = [];

		// Participation insights
		if (analytics.totalEntries > 0) {
			insights.push(`Total of ${analytics.totalEntries} participants in this leaderboard`);

			if (analytics.totalEntries > 100) {
				insights.push("High participation level indicates strong community engagement");
			} else if (analytics.totalEntries < 20) {
				insights.push("Low participation suggests opportunity for increased engagement");
			}
		}

		// Score insights
		if (analytics.averageScore > 0) {
			insights.push(`Average score: ${Math.round(analytics.averageScore)}`);

			const scoreVariance = analytics.topScore - analytics.averageScore;
			if (scoreVariance > analytics.averageScore * 0.5) {
				insights.push(
					"Large gap between top and average scores indicates competitive environment"
				);
			} else {
				insights.push("Scores are relatively evenly distributed");
			}
		}

		// Category-specific insights
		switch (category) {
			case LeaderboardCategory.GLOBAL_XP:
				insights.push("XP-based ranking shows overall learning progress");
				break;
			case LeaderboardCategory.STREAK_LENGTH:
				insights.push("Streak-based ranking highlights consistent learners");
				break;
			case LeaderboardCategory.COURSE_COMPLETION:
				insights.push("Course completion ranking shows breadth of learning");
				break;
			case LeaderboardCategory.ACHIEVEMENT_COUNT:
				insights.push("Achievement-based ranking shows goal-oriented learners");
				break;
			default:
				break;
		}

		// Timeframe insights
		switch (timeframe) {
			case Timeframe.TODAY:
				insights.push("Daily rankings show current active learners");
				break;
			case Timeframe.THIS_WEEK:
				insights.push("Weekly rankings capture recent engagement");
				break;
			case Timeframe.THIS_MONTH:
				insights.push("Monthly rankings show sustained participation");
				break;
			case Timeframe.ALL_TIME:
				insights.push("All-time rankings show long-term commitment");
				break;
			default:
				break;
		}

		return {
			category,
			timeframe,
			insights,
			generatedAt: new Date(),
		};
	}

	private convertAnalyticsToCSV(data: AnalyticsResult): string {
		const lines: string[] = [];

		// Header
		lines.push("Metric,Value");

		// Basic metrics
		lines.push(`Category,${data.category}`);
		lines.push(`Timeframe,${data.timeframe}`);
		lines.push(`Total Participants,${(data.metrics.totalParticipants as number) ?? 0}`);
		lines.push(`Average Score,${(data.metrics.averageScore as number) ?? 0}`);
		lines.push(`Median Score,${(data.metrics.medianScore as number) ?? 0}`);
		lines.push(`Top Score,${(data.metrics.topScore as number) ?? 0}`);

		// Score distribution
		const scoreDistribution = data.metrics.scoreDistribution as ScoreDistribution | undefined;
		if (scoreDistribution) {
			lines.push("");
			lines.push("Score Distribution");
			lines.push("Range Min,Range Max,Count,Percentage");
			scoreDistribution.ranges.forEach(
				(range: { min: number; max: number; count: number; percentage: number }) => {
					lines.push(
						`${range.min},${range.max},${range.count},${range.percentage.toFixed(2)}`
					);
				}
			);
		}

		// Participation trends
		const participationTrends = data.metrics.participationTrends as
			| ParticipationTrend[]
			| undefined;
		if (participationTrends) {
			lines.push("");
			lines.push("Participation Trends");
			lines.push("Date,Participants,New Participants,Active Participants");
			participationTrends.forEach((trend: ParticipationTrend) => {
				lines.push(
					`${trend.date},${trend.participants},${trend.newParticipants},${trend.activeParticipants}`
				);
			});
		}

		// Insights
		if (data.insights && data.insights.length > 0) {
			lines.push("");
			lines.push("Insights");
			data.insights.forEach((insight) => {
				lines.push(`"${insight}"`);
			});
		}

		return lines.join("\n");
	}

	private isCacheValid(cached: CachedAnalytics): boolean {
		const now = new Date();
		const age = now.getTime() - cached.timestamp.getTime();
		return age < cached.ttl;
	}
}

interface CachedAnalytics {
	data: LeaderboardAnalytics;
	timestamp: Date;
	ttl: number;
}
