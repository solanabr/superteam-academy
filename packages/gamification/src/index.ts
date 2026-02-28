export { LevelSystem, createLevelSystem } from "./level-system-integration";

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

export type { LevelAnalytics } from "./level-system";
export { LevelAnalyticsEngine } from "./level-analytics";

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

export {
	LevelChallengeTracker,
	ChallengeRecommendationEngine,
} from "./level-challenges";

export { LevelProgressionEngine } from "./level-system";

export { DEFAULT_LEVELS } from "./level-system";

import { levelFromXP as _levelFromXP } from "./xp-calculation";

export { XPCalculationEngine, DEFAULT_XP_CONFIG, levelFromXP } from "./xp-calculation";
export type { XPConfig, XPEvent, XPStats, XPAnalytics } from "./xp-calculation";
export { XPEventType } from "./xp-calculation";

/** @deprecated Use `levelFromXP` instead */
export function calculateLevelFromXP(totalXP: number): number {
	return _levelFromXP(totalXP);
}
