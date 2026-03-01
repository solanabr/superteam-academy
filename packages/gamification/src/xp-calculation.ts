/** Spec formula: Level = floor(sqrt(totalXP / 100)) */
export function levelFromXP(totalXP: number): number {
	return Math.max(0, Math.floor(Math.sqrt(totalXP / 100)));
}

export enum XPEventType {
	LESSON_COMPLETION = "lesson_completion",
	CHALLENGE_SUCCESS = "challenge_success",
	CHALLENGE_FIRST_ATTEMPT = "challenge_first_attempt",
	STREAK_MAINTAINED = "streak_maintained",
	ACHIEVEMENT_UNLOCKED = "achievement_unlocked",
	LEVEL_UP = "level_up",
	COURSE_COMPLETION = "course_completion",
	REFERRAL_SIGNUP = "referral_signup",
	SOCIAL_SHARE = "social_share",
	DAILY_LOGIN = "daily_login",
	WEEKLY_ACTIVE = "weekly_active",
	MONTHLY_ACTIVE = "monthly_active",
}

/** Base XP amounts per event type (configurable per course) */
export const DEFAULT_XP_AMOUNTS: Record<XPEventType, number> = {
	[XPEventType.LESSON_COMPLETION]: 10,
	[XPEventType.CHALLENGE_SUCCESS]: 50,
	[XPEventType.CHALLENGE_FIRST_ATTEMPT]: 25,
	[XPEventType.STREAK_MAINTAINED]: 5,
	[XPEventType.ACHIEVEMENT_UNLOCKED]: 100,
	[XPEventType.LEVEL_UP]: 200,
	[XPEventType.COURSE_COMPLETION]: 500,
	[XPEventType.REFERRAL_SIGNUP]: 150,
	[XPEventType.SOCIAL_SHARE]: 20,
	[XPEventType.DAILY_LOGIN]: 15,
	[XPEventType.WEEKLY_ACTIVE]: 75,
	[XPEventType.MONTHLY_ACTIVE]: 300,
};
