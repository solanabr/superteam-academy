import {
    type Level,
    type LevelReward,
    type LevelChallenge,
    RewardType,
    ChallengeType,
} from "./level-system";

// Notification Types
export enum NotificationType {
	LEVEL_UP = "level_up",
	CHALLENGE_COMPLETED = "challenge_completed",
	REWARD_AVAILABLE = "reward_available",
	REWARD_CLAIMED = "reward_claimed",
	CHALLENGE_EXPIRING = "challenge_expiring",
	MILESTONE_REACHED = "milestone_reached",
	STREAK_MILESTONE = "streak_milestone",
}

// Notification Priority
export enum NotificationPriority {
	LOW = "low",
	MEDIUM = "medium",
	HIGH = "high",
	URGENT = "urgent",
}

// Level Notification
export interface LevelNotification {
	id: string;
	userId: string;
	type: NotificationType;
	priority: NotificationPriority;
	title: string;
	message: string;
	data: Record<string, unknown>;
	read: boolean;
	createdAt: Date;
	expiresAt?: Date;
	actions?: NotificationAction[];
}

// Notification Action
export interface NotificationAction {
	label: string;
	action: string;
	data?: Record<string, unknown>;
}

// Level Notifications Engine
export class LevelNotificationsEngine {
	private notifications: Map<string, LevelNotification[]> = new Map();
	private notificationHandlers: Map<NotificationType, NotificationHandler[]> = new Map();

	// Register notification handler
	on(type: NotificationType, handler: NotificationHandler): void {
		const handlers = this.notificationHandlers.get(type) || [];
		handlers.push(handler);
		this.notificationHandlers.set(type, handlers);
	}

	// Create level up notification
	createLevelUpNotification(
		userId: string,
		oldLevel: number,
		newLevel: number,
		levelData: Level
	): LevelNotification {
		const notification: LevelNotification = {
			id: `level-up-${userId}-${newLevel}-${Date.now()}`,
			userId,
			type: NotificationType.LEVEL_UP,
			priority: NotificationPriority.HIGH,
			title: `🎉 Level Up! Welcome to ${levelData.name}`,
			message: `Congratulations! You've reached Level ${newLevel}: ${levelData.name}. ${levelData.description}`,
			data: {
				oldLevel,
				newLevel,
				levelData,
				rewards: levelData.rewards,
				challenges: levelData.challenges,
			},
			read: false,
			createdAt: new Date(),
			actions: [
				{
					label: "View Rewards",
					action: "view_rewards",
					data: { level: newLevel },
				},
				{
					label: "Start Challenges",
					action: "view_challenges",
					data: { level: newLevel },
				},
			],
		};

		this.addNotification(notification);
		this.triggerHandlers(notification);

		return notification;
	}

	// Create challenge completed notification
	createChallengeCompletedNotification(
		userId: string,
		challenge: LevelChallenge,
		level: number,
		xpAwarded: number
	): LevelNotification {
		const challengeTypeLabels: Record<ChallengeType, string> = {
			[ChallengeType.LESSONS_COMPLETED]: "lessons completed",
			[ChallengeType.CHALLENGES_SOLVED]: "challenges solved",
			[ChallengeType.STREAK_MAINTAINED]: "day streak maintained",
			[ChallengeType.COURSES_FINISHED]: "courses finished",
			[ChallengeType.REFERRALS_MADE]: "referrals made",
			[ChallengeType.SOCIAL_SHARES]: "social shares",
			[ChallengeType.TIME_SPENT]: "hours spent learning",
		};

		const notification: LevelNotification = {
			id: `challenge-completed-${userId}-${level}-${challenge.type}-${Date.now()}`,
			userId,
			type: NotificationType.CHALLENGE_COMPLETED,
			priority: NotificationPriority.MEDIUM,
			title: "🏆 Challenge Completed!",
			message: `Great job! You completed the "${challenge.description}" challenge and earned ${xpAwarded} bonus XP!`,
			data: {
				challenge,
				level,
				xpAwarded,
				challengeType: challengeTypeLabels[challenge.type],
			},
			read: false,
			createdAt: new Date(),
			actions: [
				{
					label: "View Progress",
					action: "view_progress",
					data: { level },
				},
			],
		};

		this.addNotification(notification);
		this.triggerHandlers(notification);

		return notification;
	}

	// Create reward available notification
	createRewardAvailableNotification(
		userId: string,
		level: number,
		reward: LevelReward
	): LevelNotification {
		const rewardTypeLabels: Record<RewardType, string> = {
			[RewardType.XP_BONUS]: "XP Bonus",
			[RewardType.STREAK_FREEZE]: "Streak Freeze",
			[RewardType.ACHIEVEMENT_BADGE]: "Achievement Badge",
			[RewardType.TITLE]: "Title",
			[RewardType.AVATAR_FRAME]: "Avatar Frame",
			[RewardType.SPECIAL_ACCESS]: "Special Access",
			[RewardType.DISCOUNT]: "Discount",
		};

		const notification: LevelNotification = {
			id: `reward-available-${userId}-${level}-${reward.type}-${Date.now()}`,
			userId,
			type: NotificationType.REWARD_AVAILABLE,
			priority: NotificationPriority.MEDIUM,
			title: "🎁 New Reward Available!",
			message: `${rewardTypeLabels[reward.type]}: ${reward.description}`,
			data: {
				level,
				reward,
				rewardType: rewardTypeLabels[reward.type],
			},
			read: false,
			createdAt: new Date(),
			expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
			actions: [
				{
					label: "Claim Reward",
					action: "claim_reward",
					data: { level, rewardId: `${level}-${reward.type}-${reward.value}` },
				},
			],
		};

		this.addNotification(notification);
		this.triggerHandlers(notification);

		return notification;
	}

	// Create reward claimed notification
	createRewardClaimedNotification(
		userId: string,
		level: number,
		reward: LevelReward
	): LevelNotification {
		const notification: LevelNotification = {
			id: `reward-claimed-${userId}-${level}-${reward.type}-${Date.now()}`,
			userId,
			type: NotificationType.REWARD_CLAIMED,
			priority: NotificationPriority.LOW,
			title: "✅ Reward Claimed!",
			message: `You successfully claimed: ${reward.description}`,
			data: {
				level,
				reward,
			},
			read: false,
			createdAt: new Date(),
		};

		this.addNotification(notification);
		this.triggerHandlers(notification);

		return notification;
	}

	// Create challenge expiring notification
	createChallengeExpiringNotification(
		userId: string,
		challengeId: string,
		challenge: LevelChallenge,
		hoursLeft: number
	): LevelNotification {
		const notification: LevelNotification = {
			id: `challenge-expiring-${userId}-${challengeId}-${Date.now()}`,
			userId,
			type: NotificationType.CHALLENGE_EXPIRING,
			priority: hoursLeft <= 24 ? NotificationPriority.URGENT : NotificationPriority.HIGH,
			title: "⏰ Challenge Expiring Soon!",
			message: `Your "${challenge.description}" challenge expires in ${hoursLeft} hours. Don't miss out on ${challenge.xpBonus} bonus XP!`,
			data: {
				challengeId,
				challenge,
				hoursLeft,
			},
			read: false,
			createdAt: new Date(),
			expiresAt: new Date(Date.now() + hoursLeft * 60 * 60 * 1000),
			actions: [
				{
					label: "Complete Now",
					action: "complete_challenge",
					data: { challengeId },
				},
			],
		};

		this.addNotification(notification);
		this.triggerHandlers(notification);

		return notification;
	}

	// Create milestone reached notification
	createMilestoneNotification(
		userId: string,
		milestone: string,
		description: string,
		xpBonus?: number
	): LevelNotification {
		const notification: LevelNotification = {
			id: `milestone-${userId}-${milestone}-${Date.now()}`,
			userId,
			type: NotificationType.MILESTONE_REACHED,
			priority: NotificationPriority.HIGH,
			title: "🏅 Milestone Achieved!",
			message: `${description}${xpBonus ? ` (+${xpBonus} XP)` : ""}`,
			data: {
				milestone,
				description,
				xpBonus,
			},
			read: false,
			createdAt: new Date(),
		};

		this.addNotification(notification);
		this.triggerHandlers(notification);

		return notification;
	}

	// Create streak milestone notification
	createStreakMilestoneNotification(
		userId: string,
		streakLength: number,
		levelBonus?: number
	): LevelNotification {
		const notification: LevelNotification = {
			id: `streak-milestone-${userId}-${streakLength}-${Date.now()}`,
			userId,
			type: NotificationType.STREAK_MILESTONE,
			priority: NotificationPriority.MEDIUM,
			title: "🔥 Streak Milestone!",
			message: `Amazing! You've maintained a ${streakLength}-day learning streak!${levelBonus ? ` (+${levelBonus} XP)` : ""}`,
			data: {
				streakLength,
				levelBonus,
			},
			read: false,
			createdAt: new Date(),
		};

		this.addNotification(notification);
		this.triggerHandlers(notification);

		return notification;
	}

	// Get user notifications
	getUserNotifications(
		userId: string,
		options: {
			unreadOnly?: boolean;
			type?: NotificationType;
			limit?: number;
			offset?: number;
		} = {}
	): LevelNotification[] {
		const userNotifications = this.notifications.get(userId) || [];

		let filtered = userNotifications;

		if (options.unreadOnly) {
			filtered = filtered.filter((n) => !n.read);
		}

		if (options.type) {
			filtered = filtered.filter((n) => n.type === options.type);
		}

		// Sort by creation date (newest first)
		filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

		// Apply pagination
		const offset = options.offset || 0;
		const limit = options.limit ?? filtered.length;
		filtered = filtered.slice(offset, offset + limit);

		return filtered;
	}

	// Mark notification as read
	markAsRead(userId: string, notificationId: string): boolean {
		const userNotifications = this.notifications.get(userId);
		if (!userNotifications) return false;

		const notification = userNotifications.find((n) => n.id === notificationId);
		if (!notification) return false;

		notification.read = true;
		return true;
	}

	// Mark all notifications as read
	markAllAsRead(userId: string): number {
		const userNotifications = this.notifications.get(userId);
		if (!userNotifications) return 0;

		let count = 0;
		userNotifications.forEach((notification) => {
			if (!notification.read) {
				notification.read = true;
				count++;
			}
		});

		return count;
	}

	// Delete notification
	deleteNotification(userId: string, notificationId: string): boolean {
		const userNotifications = this.notifications.get(userId);
		if (!userNotifications) return false;

		const index = userNotifications.findIndex((n) => n.id === notificationId);
		if (index === -1) return false;

		userNotifications.splice(index, 1);
		return true;
	}

	// Clean up expired notifications
	cleanupExpiredNotifications(): number {
		let totalCleaned = 0;

		this.notifications.forEach((userNotifications, userId) => {
			const beforeCount = userNotifications.length;
			const activeNotifications = userNotifications.filter((notification) => {
				return !notification.expiresAt || notification.expiresAt > new Date();
			});

			if (activeNotifications.length !== beforeCount) {
				this.notifications.set(userId, activeNotifications);
				totalCleaned += beforeCount - activeNotifications.length;
			}
		});

		return totalCleaned;
	}

	// Get notification statistics
	getNotificationStats(userId?: string): {
		total: number;
		unread: number;
		byType: Record<NotificationType, number>;
		byPriority: Record<NotificationPriority, number>;
	} {
		let notifications: LevelNotification[] = [];

		if (userId) {
			notifications = this.notifications.get(userId) || [];
		} else {
			// All notifications
			this.notifications.forEach((userNotifications) => {
				notifications.push(...userNotifications);
			});
		}

		const total = notifications.length;
		const unread = notifications.filter((n) => !n.read).length;

		const byType: Record<NotificationType, number> = {
			[NotificationType.LEVEL_UP]: 0,
			[NotificationType.CHALLENGE_COMPLETED]: 0,
			[NotificationType.REWARD_AVAILABLE]: 0,
			[NotificationType.REWARD_CLAIMED]: 0,
			[NotificationType.CHALLENGE_EXPIRING]: 0,
			[NotificationType.MILESTONE_REACHED]: 0,
			[NotificationType.STREAK_MILESTONE]: 0,
		};

		const byPriority: Record<NotificationPriority, number> = {
			[NotificationPriority.LOW]: 0,
			[NotificationPriority.MEDIUM]: 0,
			[NotificationPriority.HIGH]: 0,
			[NotificationPriority.URGENT]: 0,
		};

		notifications.forEach((notification) => {
			byType[notification.type]++;
			byPriority[notification.priority]++;
		});

		return {
			total,
			unread,
			byType,
			byPriority,
		};
	}

	// Export notifications for backup/debugging
	exportNotifications(userId?: string): Record<string, LevelNotification[]> {
		if (userId) {
			return { [userId]: this.notifications.get(userId) || [] };
		}

		const exportData: Record<string, LevelNotification[]> = {};
		this.notifications.forEach((notifications, userId) => {
			exportData[userId] = notifications;
		});

		return exportData;
	}

	// Import notifications
	importNotifications(importData: Record<string, LevelNotification[]>): void {
		Object.entries(importData).forEach(([userId, notifications]) => {
			this.notifications.set(userId, notifications);
		});
	}

	// Private methods
	private addNotification(notification: LevelNotification): void {
		const userNotifications = this.notifications.get(notification.userId) || [];
		userNotifications.push(notification);
		this.notifications.set(notification.userId, userNotifications);
	}

	private triggerHandlers(notification: LevelNotification): void {
		const handlers = this.notificationHandlers.get(notification.type) || [];
		handlers.forEach((handler) => {
			try {
				handler(notification);
			} catch (error) {
				console.error(`Error in notification handler for ${notification.type}:`, error);
			}
		});
	}
}

// Notification Handler Type
export type NotificationHandler = (notification: LevelNotification) => void;

// Notification Templates
export const NOTIFICATION_TEMPLATES = {
	[NotificationType.LEVEL_UP]: {
		title: "🎉 Level Up!",
		message: "Congratulations! You've reached a new level!",
	},
	[NotificationType.CHALLENGE_COMPLETED]: {
		title: "🏆 Challenge Completed!",
		message: "Great job! You completed a level challenge!",
	},
	[NotificationType.REWARD_AVAILABLE]: {
		title: "🎁 Reward Available!",
		message: "A new reward is available for you to claim!",
	},
	[NotificationType.REWARD_CLAIMED]: {
		title: "✅ Reward Claimed!",
		message: "You successfully claimed a reward!",
	},
	[NotificationType.CHALLENGE_EXPIRING]: {
		title: "⏰ Challenge Expiring!",
		message: "A challenge is about to expire!",
	},
	[NotificationType.MILESTONE_REACHED]: {
		title: "🏅 Milestone Achieved!",
		message: "You reached an important milestone!",
	},
	[NotificationType.STREAK_MILESTONE]: {
		title: "🔥 Streak Milestone!",
		message: "Amazing streak achievement!",
	},
};
