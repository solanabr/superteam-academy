import {
	LevelProgressionEngine,
	type Level,
	type UserLevel,
	type ChallengeType,
} from "./level-system";
import { LevelAnalyticsEngine } from "./level-analytics";
import {
	LevelNotificationsEngine,
	type NotificationHandler,
	type NotificationType,
} from "./level-notifications";
import { LevelChallengeTracker, ChallengeRecommendationEngine } from "./level-challenges";

// Main Level System Integration
export class LevelSystem {
	private progression: LevelProgressionEngine;
	private analytics: LevelAnalyticsEngine;
	private notifications: LevelNotificationsEngine;
	private challenges: LevelChallengeTracker;
	private recommendations: ChallengeRecommendationEngine;

	constructor(levels?: Level[]) {
		this.progression = new LevelProgressionEngine(levels);
		this.analytics = new LevelAnalyticsEngine(this.progression);
		this.notifications = new LevelNotificationsEngine();
		this.challenges = new LevelChallengeTracker(this.progression, this.notifications);
		this.recommendations = new ChallengeRecommendationEngine(this.challenges);
	}

	// User Management
	initializeUser(userId: string, totalXP = 0): UserLevel {
		return this.progression.initializeUser(userId, totalXP);
	}

	getUserProgress(userId: string): UserLevel | null {
		return this.progression.getUserProgress(userId);
	}

	updateUserXP(
		userId: string,
		newTotalXP: number
	): {
		levelChanged: boolean;
		oldLevel: number;
		newLevel: number;
		rewards: unknown[];
		challenges: unknown[];
	} {
		const result = this.progression.updateUserXP(userId, newTotalXP);

		// Track level change for analytics
		if (result.levelChanged) {
			const userLevel = this.progression.getUserProgress(userId);
			if (userLevel) {
				this.analytics.trackLevelChange(
					userId,
					{
						...userLevel,
						currentLevel: result.oldLevel,
					} as UserLevel,
					userLevel
				);

				// Create level up notification
				const levelData = this.progression.getLevel(result.newLevel);
				if (levelData) {
					this.notifications.createLevelUpNotification(
						userId,
						result.oldLevel,
						result.newLevel,
						levelData
					);

					// Create reward available notifications for manual rewards
					levelData.rewards.forEach((reward) => {
						if (!reward.isAutomatic) {
							this.notifications.createRewardAvailableNotification(
								userId,
								result.newLevel,
								reward
							);
						}
					});
				}
			}
		}

		return result;
	}

	// Challenge Management
	lessonCompleted(userId: string) {
		return this.challenges.lessonCompleted(userId);
	}

	challengeSolved(userId: string) {
		return this.challenges.challengeSolved(userId);
	}

	streakMaintained(userId: string, streakLength: number) {
		return this.challenges.streakMaintained(userId, streakLength);
	}

	courseFinished(userId: string) {
		return this.challenges.courseFinished(userId);
	}

	referralMade(userId: string) {
		return this.challenges.referralMade(userId);
	}

	socialShare(userId: string) {
		return this.challenges.socialShare(userId);
	}

	timeSpent(userId: string, minutesSpent: number) {
		return this.challenges.timeSpent(userId, minutesSpent);
	}

	getActiveChallenges(userId: string) {
		return this.challenges.getActiveChallenges(userId);
	}

	getCompletedChallenges(userId: string) {
		return this.challenges.getCompletedChallenges(userId);
	}

	getRecommendedChallenges(userId: string, limit?: number) {
		return this.recommendations.getRecommendedChallenges(userId, limit);
	}

	getChallengeTips(challengeType: string) {
		return this.recommendations.getChallengeTips(challengeType as ChallengeType);
	}

	// Reward Management
	claimReward(userId: string, level: number, rewardId: string) {
		const result = this.progression.claimReward(userId, level, rewardId);

		if (result.success && result.reward) {
			this.notifications.createRewardClaimedNotification(userId, level, result.reward);
		}

		return result;
	}

	getAvailableRewards(userId: string) {
		return this.progression.getAvailableRewards(userId);
	}

	// Notification Management
	getUserNotifications(
		userId: string,
		options?: {
			unreadOnly?: boolean;
			type?: NotificationType;
			limit?: number;
			offset?: number;
		}
	) {
		return this.notifications.getUserNotifications(userId, options);
	}

	markNotificationAsRead(userId: string, notificationId: string) {
		return this.notifications.markAsRead(userId, notificationId);
	}

	markAllNotificationsAsRead(userId: string) {
		return this.notifications.markAllAsRead(userId);
	}

	deleteNotification(userId: string, notificationId: string) {
		return this.notifications.deleteNotification(userId, notificationId);
	}

	getNotificationStats(userId?: string) {
		return this.notifications.getNotificationStats(userId);
	}

	// Analytics
	getAnalytics() {
		return this.analytics.getAnalytics();
	}

	getUserAnalytics(userId: string) {
		return this.analytics.getUserAnalytics(userId);
	}

	getLevelInsights() {
		return this.analytics.getLevelInsights();
	}

	generateProgressionReport(userId: string) {
		return this.analytics.generateProgressionReport(userId);
	}

	// Level Data Management
	getLevel(level: number) {
		return this.progression.getLevel(level);
	}

	getAllLevels() {
		return this.progression.getAllLevels();
	}

	addLevel(level: Level) {
		this.progression.addLevel(level);
	}

	updateLevel(levelNumber: number, updates: Partial<Level>) {
		this.progression.updateLevel(levelNumber, updates);
	}

	getLevelByXP(totalXP: number) {
		return this.progression.getLevelByXP(totalXP);
	}

	// System Maintenance
	checkExpiringChallenges() {
		return this.challenges.checkExpiringChallenges();
	}

	cleanupExpiredNotifications() {
		return this.notifications.cleanupExpiredNotifications();
	}

	// Data Export/Import
	exportSystemData() {
		return {
			progression: {
				levels: this.progression.getAllLevels(),
				// Note: User data would need to be exported separately for privacy
			},
			analytics: this.analytics.exportAnalyticsData(),
			notifications: this.notifications.exportNotifications(),
			challenges: this.challenges.exportProgressData(),
		};
	}

	// Event Handlers
	onNotification(type: NotificationType, handler: NotificationHandler) {
		this.notifications.on(type, handler);
	}

	// Utility Methods
	getLevelStats() {
		return this.progression.getLevelStats();
	}

	getChallengeStats() {
		return this.challenges.getChallengeStats();
	}
}

// Factory function for creating a configured level system
export function createLevelSystem(config?: {
	customLevels?: Level[];
	enableAnalytics?: boolean;
	enableNotifications?: boolean;
}) {
	const levels = config?.customLevels;
	const system = new LevelSystem(levels);

	// Configure system based on options
	if (config?.enableAnalytics === false) {
		// Could disable analytics tracking if needed
	}

	if (config?.enableNotifications === false) {
		// Could disable notifications if needed
	}

	return system;
}

// Default export
export default LevelSystem;
