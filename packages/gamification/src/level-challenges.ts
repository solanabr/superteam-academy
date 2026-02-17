import { type LevelChallenge, ChallengeType, type LevelProgressionEngine } from "./level-system";
import type { LevelNotificationsEngine } from "./level-notifications";

// Level Challenge Tracker
export class LevelChallengeTracker {
	private engine: LevelProgressionEngine;
	private notifications: LevelNotificationsEngine;
	private challengeProgress: Map<string, Map<string, number>> = new Map(); // userId -> challengeId -> progress

	constructor(engine: LevelProgressionEngine, notifications: LevelNotificationsEngine) {
		this.engine = engine;
		this.notifications = notifications;
	}

	// Update challenge progress based on user action
	updateChallengeFromAction(
		userId: string,
		actionType: ChallengeType,
		increment = 1
	): Array<{
		challengeId: string;
		wasCompleted: boolean;
		xpAwarded: number;
	}> {
		const userLevel = this.engine.getUserProgress(userId);
		if (!userLevel) return [];

		const userChallenges = this.engine.getUserLevelChallenges(userId, userLevel.currentLevel);
		const relevantChallenges = userChallenges.filter((c) => c.challenge.type === actionType);

		const results: Array<{
			challengeId: string;
			wasCompleted: boolean;
			xpAwarded: number;
		}> = [];

		relevantChallenges.forEach((challenge) => {
			const currentProgress = this.getChallengeProgress(userId, challenge.challengeId);
			const newProgress = Math.min(currentProgress + increment, challenge.target);

			const wasCompleted = challenge.isCompleted;
			const updateResult = this.engine.updateChallengeProgress(
				userId,
				challenge.challengeId,
				newProgress
			);

			if (updateResult.challengeCompleted && !wasCompleted) {
				// Challenge just completed
				this.notifications.createChallengeCompletedNotification(
					userId,
					challenge.challenge,
					userLevel.currentLevel,
					updateResult.xpAwarded
				);

				results.push({
					challengeId: challenge.challengeId,
					wasCompleted: true,
					xpAwarded: updateResult.xpAwarded,
				});
			}

			// Update stored progress
			this.setChallengeProgress(userId, challenge.challengeId, newProgress);
		});

		return results;
	}

	// Specific challenge update methods
	lessonCompleted(userId: string): Array<{
		challengeId: string;
		wasCompleted: boolean;
		xpAwarded: number;
	}> {
		return this.updateChallengeFromAction(userId, ChallengeType.LESSONS_COMPLETED);
	}

	challengeSolved(userId: string): Array<{
		challengeId: string;
		wasCompleted: boolean;
		xpAwarded: number;
	}> {
		return this.updateChallengeFromAction(userId, ChallengeType.CHALLENGES_SOLVED);
	}

	streakMaintained(
		userId: string,
		streakLength: number
	): Array<{
		challengeId: string;
		wasCompleted: boolean;
		xpAwarded: number;
	}> {
		// Check for streak-based challenges
		const userLevel = this.engine.getUserProgress(userId);
		if (!userLevel) return [];

		const userChallenges = this.engine.getUserLevelChallenges(userId, userLevel.currentLevel);
		const streakChallenges = userChallenges.filter(
			(c) => c.challenge.type === ChallengeType.STREAK_MAINTAINED && c.target === streakLength
		);

		const results: Array<{
			challengeId: string;
			wasCompleted: boolean;
			xpAwarded: number;
		}> = [];

		streakChallenges.forEach((challenge) => {
			const wasCompleted = challenge.isCompleted;
			const updateResult = this.engine.updateChallengeProgress(
				userId,
				challenge.challengeId,
				streakLength
			);

			if (updateResult.challengeCompleted && !wasCompleted) {
				this.notifications.createChallengeCompletedNotification(
					userId,
					challenge.challenge,
					userLevel.currentLevel,
					updateResult.xpAwarded
				);

				results.push({
					challengeId: challenge.challengeId,
					wasCompleted: true,
					xpAwarded: updateResult.xpAwarded,
				});
			}
		});

		return results;
	}

	courseFinished(userId: string): Array<{
		challengeId: string;
		wasCompleted: boolean;
		xpAwarded: number;
	}> {
		return this.updateChallengeFromAction(userId, ChallengeType.COURSES_FINISHED);
	}

	referralMade(userId: string): Array<{
		challengeId: string;
		wasCompleted: boolean;
		xpAwarded: number;
	}> {
		return this.updateChallengeFromAction(userId, ChallengeType.REFERRALS_MADE);
	}

	socialShare(userId: string): Array<{
		challengeId: string;
		wasCompleted: boolean;
		xpAwarded: number;
	}> {
		return this.updateChallengeFromAction(userId, ChallengeType.SOCIAL_SHARES);
	}

	timeSpent(
		userId: string,
		minutesSpent: number
	): Array<{
		challengeId: string;
		wasCompleted: boolean;
		xpAwarded: number;
	}> {
		// Convert minutes to hours for challenges that track time
		const hoursSpent = minutesSpent / 60;
		return this.updateChallengeFromAction(userId, ChallengeType.TIME_SPENT, hoursSpent);
	}

	// Check for expiring challenges and send notifications
	checkExpiringChallenges(): number {
		let notificationCount = 0;

		this.engine.getAllLevels().forEach((level) => {
			// This is a simplified check - in practice, you'd iterate through all users
			// For now, we'll just return the count of potential notifications
			level.challenges.forEach((challenge) => {
				if (challenge.timeLimit) {
					// This would need to be implemented with actual user challenge tracking
					notificationCount++;
				}
			});
		});

		return notificationCount;
	}

	// Get challenge progress for user
	getChallengeProgress(userId: string, challengeId: string): number {
		const userProgress = this.challengeProgress.get(userId);
		return userProgress?.get(challengeId) || 0;
	}

	// Set challenge progress for user
	private setChallengeProgress(userId: string, challengeId: string, progress: number): void {
		let userProgress = this.challengeProgress.get(userId);
		if (!userProgress) {
			userProgress = new Map();
			this.challengeProgress.set(userId, userProgress);
		}
		userProgress.set(challengeId, progress);
	}

	// Get user's active challenges
	getActiveChallenges(userId: string): Array<{
		challengeId: string;
		challenge: LevelChallenge;
		progress: number;
		progressPercent: number;
		timeLeft?: number;
	}> {
		const userLevel = this.engine.getUserProgress(userId);
		if (!userLevel) return [];

		const userChallenges = this.engine.getUserLevelChallenges(userId, userLevel.currentLevel);
		const now = new Date();

		return userChallenges
			.filter((c) => !c.isCompleted)
			.map((c) => {
				const progress = this.getChallengeProgress(userId, c.challengeId);
				const progressPercent = c.target > 0 ? (progress / c.target) * 100 : 0;

				let timeLeft: number | undefined;
				if (c.expiresAt) {
					timeLeft = Math.max(
						0,
						Math.ceil((c.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60))
					);
				}

				return {
					challengeId: c.challengeId,
					challenge: c.challenge,
					progress,
					progressPercent,
					...(timeLeft !== undefined && { timeLeft }),
				};
			})
			.sort((a, b) => {
				// Sort by progress percentage (closest to completion first)
				return b.progressPercent - a.progressPercent;
			});
	}

	// Get user's completed challenges
	getCompletedChallenges(userId: string): Array<{
		challengeId: string;
		challenge: LevelChallenge;
		completedAt: Date;
		xpAwarded: number;
	}> {
		const userLevel = this.engine.getUserProgress(userId);
		if (!userLevel) return [];

		const userChallenges = this.engine.getUserLevelChallenges(userId);

		return userChallenges
			.filter((c) => c.isCompleted && c.completedAt)
			.map((c) => ({
				challengeId: c.challengeId,
				challenge: c.challenge,
				completedAt: c.completedAt!,
				xpAwarded: c.xpAwarded,
			}))
			.sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
	}

	// Get challenge statistics
	getChallengeStats(): {
		totalChallenges: number;
		completedChallenges: number;
		completionRate: number;
		averageCompletionTime: number;
		mostPopularChallengeType: ChallengeType;
		challengeTypeStats: Record<
			ChallengeType,
			{
				total: number;
				completed: number;
				completionRate: number;
			}
		>;
	} {
		const allLevels = this.engine.getAllLevels();
		let totalChallenges = 0;
		let completedChallenges = 0;
		const completionTimes: number[] = [];
		const challengeTypeCounts: Record<ChallengeType, { total: number; completed: number }> = {
			[ChallengeType.LESSONS_COMPLETED]: { total: 0, completed: 0 },
			[ChallengeType.CHALLENGES_SOLVED]: { total: 0, completed: 0 },
			[ChallengeType.STREAK_MAINTAINED]: { total: 0, completed: 0 },
			[ChallengeType.COURSES_FINISHED]: { total: 0, completed: 0 },
			[ChallengeType.REFERRALS_MADE]: { total: 0, completed: 0 },
			[ChallengeType.SOCIAL_SHARES]: { total: 0, completed: 0 },
			[ChallengeType.TIME_SPENT]: { total: 0, completed: 0 },
		};

		// This is a simplified calculation - in practice, you'd need to aggregate across all users
		allLevels.forEach((level) => {
			level.challenges.forEach((challenge) => {
				totalChallenges++;
				challengeTypeCounts[challenge.type].total++;

				// Estimate completion rate (this would need real user data)
				const estimatedCompletionRate = this.getEstimatedCompletionRate(challenge.type);
				if (Math.random() < estimatedCompletionRate) {
					// Simplified simulation
					completedChallenges++;
					challengeTypeCounts[challenge.type].completed++;
					completionTimes.push(challenge.timeLimit || 7); // Default 7 days
				}
			});
		});

		const completionRate =
			totalChallenges > 0 ? (completedChallenges / totalChallenges) * 100 : 0;
		const averageCompletionTime =
			completionTimes.length > 0
				? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length
				: 0;

		const mostPopularChallengeType = Object.entries(challengeTypeCounts).reduce(
			(max, [type, stats]) =>
				stats.total > max.stats.total ? { type: type as ChallengeType, stats } : max,
			{ type: ChallengeType.LESSONS_COMPLETED, stats: { total: 0, completed: 0 } }
		).type;

		const challengeTypeStats: Record<
			ChallengeType,
			{
				total: number;
				completed: number;
				completionRate: number;
			}
		> = {} as Record<
			ChallengeType,
			{ total: number; completed: number; completionRate: number }
		>;

		Object.entries(challengeTypeCounts).forEach(([type, stats]) => {
			challengeTypeStats[type as ChallengeType] = {
				total: stats.total,
				completed: stats.completed,
				completionRate: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0,
			};
		});

		return {
			totalChallenges,
			completedChallenges,
			completionRate,
			averageCompletionTime,
			mostPopularChallengeType,
			challengeTypeStats,
		};
	}

	// Get estimated completion rate for challenge types (based on typical user behavior)
	private getEstimatedCompletionRate(challengeType: ChallengeType): number {
		const rates: Record<ChallengeType, number> = {
			[ChallengeType.LESSONS_COMPLETED]: 0.75, // 75% complete lesson challenges
			[ChallengeType.CHALLENGES_SOLVED]: 0.45, // 45% complete coding challenges
			[ChallengeType.STREAK_MAINTAINED]: 0.3, // 30% maintain long streaks
			[ChallengeType.COURSES_FINISHED]: 0.25, // 25% complete full courses
			[ChallengeType.REFERRALS_MADE]: 0.15, // 15% make referrals
			[ChallengeType.SOCIAL_SHARES]: 0.2, // 20% share on social media
			[ChallengeType.TIME_SPENT]: 0.6, // 60% spend significant time
		};

		return rates[challengeType] || 0.5;
	}

	// Reset challenge progress (for testing or admin purposes)
	resetChallengeProgress(userId: string, challengeId: string): boolean {
		const userProgress = this.challengeProgress.get(userId);
		if (userProgress) {
			userProgress.delete(challengeId);
			return true;
		}
		return false;
	}

	// Export challenge progress data
	exportProgressData(): Record<string, Record<string, number>> {
		const exportData: Record<string, Record<string, number>> = {};
		this.challengeProgress.forEach((userProgress, userId) => {
			exportData[userId] = Object.fromEntries(userProgress);
		});
		return exportData;
	}

	// Import challenge progress data
	importProgressData(importData: Record<string, Record<string, number>>): void {
		Object.entries(importData).forEach(([userId, progress]) => {
			const userProgress = new Map(Object.entries(progress));
			this.challengeProgress.set(userId, userProgress);
		});
	}
}

// Challenge Recommendation Engine
export class ChallengeRecommendationEngine {
	private tracker: LevelChallengeTracker;

	constructor(tracker: LevelChallengeTracker) {
		this.tracker = tracker;
	}

	// Get recommended challenges for user
	getRecommendedChallenges(
		userId: string,
		limit = 3
	): Array<{
		challengeId: string;
		challenge: LevelChallenge;
		progress: number;
		progressPercent: number;
		priority: "high" | "medium" | "low";
		reason: string;
	}> {
		const activeChallenges = this.tracker.getActiveChallenges(userId);

		if (activeChallenges.length === 0) return [];

		// Score challenges based on various factors
		const scoredChallenges = activeChallenges.map((challenge) => {
			let score = 0;
			let priority: "high" | "medium" | "low" = "low";
			let reason = "";

			const progressPercent = challenge.progressPercent;
			const timeLeft = challenge.timeLeft;

			// Progress-based scoring
			if (progressPercent >= 80) {
				score += 100;
				priority = "high";
				reason = "Almost complete!";
			} else if (progressPercent >= 50) {
				score += 70;
				priority = "medium";
				reason = "Good progress, keep going!";
			} else if (progressPercent >= 25) {
				score += 40;
				priority = "low";
				reason = "Getting started is the hardest part.";
			}

			// Time pressure scoring
			if (timeLeft !== undefined) {
				if (timeLeft <= 24) {
					score += 80;
					priority = "high";
					reason = "Expires soon - act fast!";
				} else if (timeLeft <= 72) {
					score += 50;
					if (priority !== "high") priority = "medium";
					reason = timeLeft <= 48 ? "Expires soon." : "Time is limited.";
				}
			}

			// Challenge type preferences (easier challenges get slight boost)
			switch (challenge.challenge.type) {
				case ChallengeType.LESSONS_COMPLETED:
					score += 10;
					break;
				case ChallengeType.CHALLENGES_SOLVED:
					score += 5;
					break;
				case ChallengeType.STREAK_MAINTAINED:
					score += 15;
					break;
				case ChallengeType.COURSES_FINISHED:
					score += 8;
					break;
				case ChallengeType.REFERRALS_MADE:
					score += 3;
					break;
				case ChallengeType.SOCIAL_SHARES:
					score += 2;
					break;
				case ChallengeType.TIME_SPENT:
					score += 12;
					break;
				default:
					break;
			}

			// XP bonus consideration
			score += Math.min(challenge.challenge.xpBonus / 10, 20); // Cap at 20 points

			return {
				...challenge,
				score,
				priority,
				reason,
			};
		});

		// Sort by score and return top recommendations
		return scoredChallenges
			.sort((a, b) => b.score - a.score)
			.slice(0, limit)
			.map(({ score, ...challenge }) => challenge);
	}

	// Get challenge completion tips
	getChallengeTips(challengeType: ChallengeType): string[] {
		const tips: Record<ChallengeType, string[]> = {
			[ChallengeType.LESSONS_COMPLETED]: [
				"Complete one lesson per day to build momentum",
				"Focus on understanding concepts rather than rushing",
				"Take notes during lessons for better retention",
				"Review completed lessons regularly",
			],
			[ChallengeType.CHALLENGES_SOLVED]: [
				"Break down complex problems into smaller steps",
				"Look for similar examples in your completed work",
				"Don't be afraid to ask for hints or help",
				"Practice regularly to improve problem-solving skills",
			],
			[ChallengeType.STREAK_MAINTAINED]: [
				"Set a consistent daily learning time",
				"Make learning a habit by doing it at the same time each day",
				"Start with shorter sessions if you're struggling",
				"Track your streak visually to stay motivated",
			],
			[ChallengeType.COURSES_FINISHED]: [
				"Set milestones within the course to stay on track",
				"Apply what you learn immediately",
				"Join study groups or discussion forums",
				"Take breaks between modules to avoid burnout",
			],
			[ChallengeType.REFERRALS_MADE]: [
				"Share your learning journey on social media",
				"Tell friends and colleagues about what you're learning",
				"Offer to help others get started",
				"Create referral links and share them widely",
			],
			[ChallengeType.SOCIAL_SHARES]: [
				"Share your achievements and learnings",
				"Post about challenges you've overcome",
				"Tag the platform when sharing your progress",
				"Inspire others by sharing your journey",
			],
			[ChallengeType.TIME_SPENT]: [
				"Set specific learning goals for each session",
				"Use timers to stay focused during study sessions",
				"Take regular breaks using the Pomodoro technique",
				"Track your time to identify your most productive periods",
			],
		};

		return tips[challengeType] || ["Stay consistent and focused on your learning goals!"];
	}
}
