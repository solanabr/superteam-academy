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

// XP Calculation
export { XPCalculationEngine, DEFAULT_XP_CONFIG } from "./xp-calculation";
export type { XPConfig, XPEvent, XPStats, XPAnalytics } from "./xp-calculation";
export { XPEventType } from "./xp-calculation";

/** Spec formula: Level = floor(sqrt(totalXP / 100)) */
export function calculateLevelFromXP(totalXP: number): number {
	return Math.max(0, Math.floor(Math.sqrt(totalXP / 100)));
}
