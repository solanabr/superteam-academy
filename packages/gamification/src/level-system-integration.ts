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

				const levelData = this.progression.getLevel(result.newLevel);
				if (levelData) {
					this.notifications.createLevelUpNotification(
						userId,
						result.oldLevel,
						result.newLevel,
						levelData
					);

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

	checkExpiringChallenges() {
		return this.challenges.checkExpiringChallenges();
	}

	cleanupExpiredNotifications() {
		return this.notifications.cleanupExpiredNotifications();
	}

	exportSystemData() {
		return {
			progression: {
				levels: this.progression.getAllLevels(),
			},
			analytics: this.analytics.exportAnalyticsData(),
			notifications: this.notifications.exportNotifications(),
			challenges: this.challenges.exportProgressData(),
		};
	}

	onNotification(type: NotificationType, handler: NotificationHandler) {
		this.notifications.on(type, handler);
	}

	getLevelStats() {
		return this.progression.getLevelStats();
	}

	getChallengeStats() {
		return this.challenges.getChallengeStats();
	}
}

export function createLevelSystem(config?: {
	customLevels?: Level[];
	enableAnalytics?: boolean;
	enableNotifications?: boolean;
}) {
	const levels = config?.customLevels;
	const system = new LevelSystem(levels);

	if (config?.enableAnalytics === false) {
		/* noop */
	}

	if (config?.enableNotifications === false) {
		/* noop */
	}

	return system;
}

export default LevelSystem;
