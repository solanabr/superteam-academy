// Level System Exports
export { LevelSystem, createLevelSystem } from "./level-system-integration";

// Core Types and Interfaces
export type {
	Level,
	LevelReward,
	LevelChallenge,
	UserLevel,
	UserLevelChallenge,
	LevelRewardClaim,
	RewardType,
	ChallengeType,
} from "./level-system";

// Analytics
export type { LevelAnalytics } from "./level-system";
export { LevelAnalyticsEngine } from "./level-analytics";

// Notifications
export type {
	LevelNotification,
	NotificationAction,
	NotificationHandler,
} from "./level-notifications";
export {
	LevelNotificationsEngine,
	NotificationType,
	NotificationPriority,
	NOTIFICATION_TEMPLATES,
} from "./level-notifications";

// Challenges
export {
	LevelChallengeTracker,
	ChallengeRecommendationEngine,
} from "./level-challenges";

// Progression Engine
export { LevelProgressionEngine } from "./level-system";

// Default Levels Configuration
export { DEFAULT_LEVELS } from "./level-system";
