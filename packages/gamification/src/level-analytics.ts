import {
	type LevelAnalytics,
	type LevelProgressionEngine,
	type UserLevel,
	type LevelRewardClaim,
	RewardType,
} from "./level-system";

// Level Analytics Engine
export class LevelAnalyticsEngine {
	private engine: LevelProgressionEngine;
	private userLevelHistory: Map<string, UserLevel[]> = new Map();
	private challengeCompletions: Map<string, { completedAt: Date; timeToComplete: number }[]> =
		new Map();
	private rewardClaims: Map<string, LevelRewardClaim[]> = new Map();

	constructor(engine: LevelProgressionEngine) {
		this.engine = engine;
	}

	// Track user level changes
	trackLevelChange(userId: string, oldLevel: UserLevel, _newLevel: UserLevel): void {
		const history = this.userLevelHistory.get(userId) || [];
		history.push({ ...oldLevel, lastUpdated: new Date() });
		this.userLevelHistory.set(userId, history);
	}

	// Track challenge completion
	trackChallengeCompletion(
		_userId: string,
		challengeId: string,
		completedAt: Date,
		timeToComplete: number
	): void {
		const completions = this.challengeCompletions.get(challengeId) || [];
		completions.push({ completedAt, timeToComplete });
		this.challengeCompletions.set(challengeId, completions);
	}

	// Track reward claims
	trackRewardClaim(claim: LevelRewardClaim): void {
		const claims = this.rewardClaims.get(claim.userId) || [];
		claims.push(claim);
		this.rewardClaims.set(claim.userId, claims);
	}

	// Get comprehensive analytics
	getAnalytics(): LevelAnalytics {
		const globalStats = this.engine.getLevelStats();
		const userStats = this.calculateUserStats();
		const challengeStats = this.calculateChallengeStats();
		const rewardStats = this.calculateRewardStats();

		return {
			globalStats,
			userStats,
			challengeStats,
			rewardStats,
		};
	}

	// Get user-specific analytics
	getUserAnalytics(userId: string): LevelAnalytics["userStats"][number] | null {
		const userLevel = this.engine.getUserProgress(userId);
		if (!userLevel) return null;

		const history = this.userLevelHistory.get(userId) || [];
		const timeToLevel: number[] = [];

		// Calculate time to reach each level
		for (let level = 2; level <= userLevel.currentLevel; level++) {
			const levelReached = history.find((h) => h.currentLevel === level);
			if (levelReached) {
				const prevLevel = history.find((h) => h.currentLevel === level - 1);
				if (prevLevel) {
					const days = Math.ceil(
						(levelReached.levelReachedAt.getTime() -
							prevLevel.levelReachedAt.getTime()) /
							(1000 * 60 * 60 * 24)
					);
					timeToLevel.push(days);
				}
			}
		}

		// Calculate level efficiency (XP per day)
		const totalDays =
			history.length > 0
				? Math.ceil(
						(Date.now() - history[0].levelReachedAt.getTime()) / (1000 * 60 * 60 * 24)
					)
				: 1;
		const levelEfficiency = totalDays > 0 ? userLevel.totalXP / totalDays : 0;

		const rewardClaims = this.rewardClaims.get(userId) || [];

		return {
			userId,
			currentLevel: userLevel.currentLevel,
			timeToLevel,
			challengesCompleted: userLevel.completedChallenges.length,
			rewardsClaimed: rewardClaims.length,
			levelEfficiency,
		};
	}

	// Get level progression insights
	getLevelInsights(): {
		fastestLevelUps: Array<{ userId: string; level: number; days: number }>;
		slowestLevelUps: Array<{ userId: string; level: number; days: number }>;
		levelBottlenecks: Array<{ level: number; averageDays: number; completionRate: number }>;
		userEngagement: {
			highlyEngaged: number; // users leveling up quickly
			moderatelyEngaged: number; // users leveling up steadily
			disengaged: number; // users stuck at low levels
		};
	} {
		const fastestLevelUps: Array<{ userId: string; level: number; days: number }> = [];
		const slowestLevelUps: Array<{ userId: string; level: number; days: number }> = [];
		const levelTimes: Map<number, number[]> = new Map();

		// Collect level up times
		this.userLevelHistory.forEach((history, userId) => {
			for (let i = 1; i < history.length; i++) {
				const current = history[i];
				const previous = history[i - 1];

				if (current.currentLevel === previous.currentLevel + 1) {
					const days = Math.ceil(
						(current.levelReachedAt.getTime() - previous.levelReachedAt.getTime()) /
							(1000 * 60 * 60 * 24)
					);

					// Track for level bottlenecks
					const times = levelTimes.get(current.currentLevel) || [];
					times.push(days);
					levelTimes.set(current.currentLevel, times);

					// Track fastest/slowest
					fastestLevelUps.push({ userId, level: current.currentLevel, days });
					slowestLevelUps.push({ userId, level: current.currentLevel, days });
				}
			}
		});

		// Sort and limit
		fastestLevelUps.sort((a, b) => a.days - b.days);
		slowestLevelUps.sort((a, b) => b.days - a.days);

		// Calculate level bottlenecks
		const levelBottlenecks: Array<{
			level: number;
			averageDays: number;
			completionRate: number;
		}> = [];
		const globalStats = this.engine.getLevelStats();

		levelTimes.forEach((times, level) => {
			const averageDays = times.reduce((sum, time) => sum + time, 0) / times.length;
			const completionRate = globalStats.completionRates[level] || 0;
			levelBottlenecks.push({ level, averageDays, completionRate });
		});

		levelBottlenecks.sort((a, b) => b.averageDays - a.averageDays);

		// Calculate user engagement
		const userEngagements = Array.from(this.userLevelHistory.entries()).map(
			([userId, history]) => {
				if (history.length < 2) return { userId, engagement: "unknown" as const };

				const totalDays = Math.ceil(
					(Date.now() - history[0].levelReachedAt.getTime()) / (1000 * 60 * 60 * 24)
				);
				const levelsGained =
					history[history.length - 1].currentLevel - history[0].currentLevel;
				const avgDaysPerLevel = levelsGained > 0 ? totalDays / levelsGained : totalDays;

				if (avgDaysPerLevel <= 7) return { userId, engagement: "highlyEngaged" as const };
				if (avgDaysPerLevel <= 30)
					return { userId, engagement: "moderatelyEngaged" as const };
				return { userId, engagement: "disengaged" as const };
			}
		);

		const highlyEngaged = userEngagements.filter(
			(u) => u.engagement === "highlyEngaged"
		).length;
		const moderatelyEngaged = userEngagements.filter(
			(u) => u.engagement === "moderatelyEngaged"
		).length;
		const disengaged = userEngagements.filter((u) => u.engagement === "disengaged").length;

		return {
			fastestLevelUps: fastestLevelUps.slice(0, 10),
			slowestLevelUps: slowestLevelUps.slice(0, 10),
			levelBottlenecks: levelBottlenecks.slice(0, 10),
			userEngagement: {
				highlyEngaged,
				moderatelyEngaged,
				disengaged,
			},
		};
	}

	// Get challenge completion analytics
	private calculateChallengeStats(): LevelAnalytics["challengeStats"] {
		const allChallenges = Array.from(this.challengeCompletions.values()).flat();
		const totalChallenges = allChallenges.length;
		const completedChallenges = allChallenges.filter((c) => c.timeToComplete > 0).length;
		const completionRate =
			totalChallenges > 0 ? (completedChallenges / totalChallenges) * 100 : 0;

		const validTimes = allChallenges
			.filter((c) => c.timeToComplete > 0)
			.map((c) => c.timeToComplete);
		const averageTimeToComplete =
			validTimes.length > 0
				? validTimes.reduce((sum, time) => sum + time, 0) / validTimes.length
				: 0;

		// Find most popular challenge
		const challengeCounts: Record<string, number> = {};
		this.challengeCompletions.forEach((completions, challengeId) => {
			challengeCounts[challengeId] = completions.length;
		});

		const mostPopularChallenge = Object.entries(challengeCounts).reduce(
			(max, [id, count]) => (count > max.count ? { id, count } : max),
			{ id: "", count: 0 }
		).id;

		return {
			totalChallenges,
			completionRate,
			averageTimeToComplete,
			mostPopularChallenge,
		};
	}

	// Get reward claim analytics
	private calculateRewardStats(): LevelAnalytics["rewardStats"] {
		const allClaims = Array.from(this.rewardClaims.values()).flat();
		const totalRewards = allClaims.length;

		// Calculate claim rate (assuming all available rewards)
		const totalUsers = this.engine.getLevelStats().totalUsers;
		const claimRate = totalUsers > 0 ? (totalRewards / (totalUsers * 2)) * 100 : 0; // Rough estimate

		// Find most popular reward type
		const rewardTypeCounts: Record<string, number> = {};
		allClaims.forEach((claim) => {
			rewardTypeCounts[claim.rewardType] = (rewardTypeCounts[claim.rewardType] || 0) + 1;
		});

		const mostPopularReward = Object.entries(rewardTypeCounts).reduce(
			(max, [type, count]) => (count > max.count ? { type: type as RewardType, count } : max),
			{ type: RewardType.XP_BONUS, count: 0 }
		).type;

		return {
			totalRewards,
			claimRate,
			mostPopularReward,
		};
	}

	// Calculate user stats for all users
	private calculateUserStats(): LevelAnalytics["userStats"] {
		const userStats: LevelAnalytics["userStats"] = [];

		this.userLevelHistory.forEach((_history, userId) => {
			const analytics = this.getUserAnalytics(userId);
			if (analytics) {
				userStats.push(analytics);
			}
		});

		return userStats;
	}

	// Export analytics data for external analysis
	exportAnalyticsData(): {
		userLevelHistory: Record<string, UserLevel[]>;
		challengeCompletions: Record<string, Array<{ completedAt: Date; timeToComplete: number }>>;
		rewardClaims: Record<string, LevelRewardClaim[]>;
		globalStats: unknown;
	} {
		return {
			userLevelHistory: Object.fromEntries(this.userLevelHistory),
			challengeCompletions: Object.fromEntries(this.challengeCompletions),
			rewardClaims: Object.fromEntries(this.rewardClaims),
			globalStats: this.engine.getLevelStats(),
		};
	}

	// Generate level progression report
	generateProgressionReport(userId: string): {
		currentLevel: number;
		nextMilestone: { level: number; xpNeeded: number; daysEstimated: number } | null;
		recentProgress: Array<{ date: Date; level: number; xp: number }>;
		challenges: Array<{ id: string; progress: number; target: number; completed: boolean }>;
		recommendations: string[];
	} | null {
		const userLevel = this.engine.getUserProgress(userId);
		if (!userLevel) return null;

		const history = this.userLevelHistory.get(userId) || [];
		const recentProgress = history.slice(-5).map((h) => ({
			date: h.lastUpdated,
			level: h.currentLevel,
			xp: h.totalXP,
		}));

		const challenges = this.engine
			.getUserLevelChallenges(userId, userLevel.currentLevel)
			.map((c) => ({
				id: c.challengeId,
				progress: c.progress,
				target: c.target,
				completed: c.isCompleted,
			}));

		// Calculate next milestone
		const nextLevel = this.engine.getLevel(userLevel.currentLevel + 1);
		let nextMilestone: { level: number; xpNeeded: number; daysEstimated: number } | null = null;
		if (nextLevel) {
			const daysEstimated = this.estimateDaysToNextLevel(userId, userLevel);
			nextMilestone = {
				level: nextLevel.level,
				xpNeeded: userLevel.xpToNextLevel,
				daysEstimated,
			};
		}

		// Generate recommendations
		const recommendations = this.generateRecommendations(userId, userLevel, challenges);

		return {
			currentLevel: userLevel.currentLevel,
			nextMilestone,
			recentProgress,
			challenges,
			recommendations,
		};
	}

	// Estimate days to next level based on user's history
	private estimateDaysToNextLevel(userId: string, userLevel: UserLevel): number {
		const history = this.userLevelHistory.get(userId);
		if (!history || history.length < 2) {
			// Default estimate based on level
			return Math.max(7, userLevel.currentLevel * 2);
		}

		// Calculate average XP per day from recent history
		const recentHistory = history.slice(-3); // Last 3 level changes
		let totalXP = 0;
		let totalDays = 0;

		for (let i = 1; i < recentHistory.length; i++) {
			const xpGained = recentHistory[i].totalXP - recentHistory[i - 1].totalXP;
			const days = Math.ceil(
				(recentHistory[i].levelReachedAt.getTime() -
					recentHistory[i - 1].levelReachedAt.getTime()) /
					(1000 * 60 * 60 * 24)
			);

			totalXP += xpGained;
			totalDays += days;
		}

		const avgXPPerDay = totalDays > 0 ? totalXP / totalDays : 50; // Default 50 XP/day
		const xpNeeded = userLevel.xpToNextLevel;

		return Math.ceil(xpNeeded / Math.max(avgXPPerDay, 10)); // Minimum 10 XP/day
	}

	// Generate personalized recommendations
	private generateRecommendations(
		userId: string,
		userLevel: UserLevel,
		challenges: Array<{ id: string; progress: number; target: number; completed: boolean }>
	): string[] {
		const recommendations: string[] = [];

		// Check incomplete challenges
		const incompleteChallenges = challenges.filter((c) => !c.completed);
		if (incompleteChallenges.length > 0) {
			const closestToComplete = incompleteChallenges.sort(
				(a, b) => b.progress / b.target - a.progress / a.target
			)[0];

			if (closestToComplete.progress / closestToComplete.target > 0.7) {
				recommendations.push(
					`You're close to completing a challenge! Keep going to earn bonus XP.`
				);
			}
		}

		// Check level progress
		if (userLevel.levelProgress < 30) {
			recommendations.push("Focus on consistent daily learning to level up faster.");
		} else if (userLevel.levelProgress > 80) {
			recommendations.push(
				`You're almost at the next level! A few more lessons will get you there.`
			);
		}

		// Check engagement based on history
		const history = this.userLevelHistory.get(userId) || [];
		if (history.length > 0) {
			const daysSinceLastLevel = Math.ceil(
				(Date.now() - history[history.length - 1].levelReachedAt.getTime()) /
					(1000 * 60 * 60 * 24)
			);

			if (daysSinceLastLevel > 14) {
				recommendations.push(
					`It's been a while since your last level up. Try to maintain daily streaks!`
				);
			}
		}

		// Add general tips
		if (recommendations.length === 0) {
			recommendations.push(
				"Keep up the great work! Try completing daily challenges for bonus XP."
			);
			recommendations.push("Share your progress with friends to unlock referral rewards.");
		}

		return recommendations.slice(0, 3); // Limit to 3 recommendations
	}
}
