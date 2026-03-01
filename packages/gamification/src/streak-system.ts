export enum StreakStatus {
	ACTIVE = "active",
	BROKEN = "broken",
	FROZEN = "frozen",
	EXPIRED = "expired",
}

export enum StreakEventType {
	LESSON_COMPLETED = "lesson_completed",
	CHALLENGE_COMPLETED = "challenge_completed",
	COURSE_ENROLLED = "course_enrolled",
	DAILY_LOGIN = "daily_login",
	STREAK_FREEZE_USED = "streak_freeze_used",
	STREAK_BROKEN = "streak_broken",
	STREAK_RECOVERED = "streak_recovered",
}

interface StreakConfig {
	activityWindowHours: number;
	freezeDurationDays: number;
	maxFreezes: number;
	recoveryWindowDays: number;
	requiredActivities: {
		daily: number;
		types: StreakEventType[];
	};
	rewards: {
		[key: number]: {
			xpBonus: number;
			freezeAward?: number;
			achievement?: string;
		};
	};
}

export const DEFAULT_STREAK_CONFIG: StreakConfig = {
	activityWindowHours: 24,
	freezeDurationDays: 7,
	maxFreezes: 3,
	recoveryWindowDays: 3,
	requiredActivities: {
		daily: 1,
		types: [
			StreakEventType.LESSON_COMPLETED,
			StreakEventType.CHALLENGE_COMPLETED,
			StreakEventType.DAILY_LOGIN,
		],
	},
	rewards: {
		7: { xpBonus: 50, achievement: "week_warrior" },
		14: { xpBonus: 100, freezeAward: 1, achievement: "fortnight_champion" },
		30: { xpBonus: 250, freezeAward: 1, achievement: "monthly_master" },
		60: { xpBonus: 500, freezeAward: 2, achievement: "two_month_legend" },
		100: { xpBonus: 1000, freezeAward: 3, achievement: "century_streak" },
	},
};

export interface StreakEvent {
	id: string;
	userId: string;
	type: StreakEventType;
	timestamp: Date;
	metadata?: Record<string, unknown>;
	activityCount: number;
}

export interface StreakState {
	userId: string;
	currentStreak: number;
	longestStreak: number;
	status: StreakStatus;
	lastActivityDate: Date | null;
	streakStartDate: Date | null;
	freezesAvailable: number;
	totalFreezesUsed: number;
	recoveryDeadline: Date | null;
	frozenUntil: Date | null;
	lastUpdated: Date;
}

export class StreakCalculationEngine {
	private config: StreakConfig;

	constructor(config: StreakConfig = DEFAULT_STREAK_CONFIG) {
		this.config = config;
	}

	calculateStreak(
		currentState: StreakState,
		event: StreakEvent
	): {
		newState: StreakState;
		streakChange: number;
		rewards: Array<{ type: string; value: unknown }>;
		notifications: string[];
	} {
		const newState = { ...currentState };
		let streakChange = 0;
		const rewards: Array<{ type: string; value: unknown }> = [];
		const notifications: string[] = [];

		const eventDate = new Date(event.timestamp);
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		if (!this.config.requiredActivities.types.includes(event.type)) {
			return { newState, streakChange, rewards, notifications };
		}

		switch (event.type) {
			case StreakEventType.LESSON_COMPLETED:
			case StreakEventType.CHALLENGE_COMPLETED:
			case StreakEventType.DAILY_LOGIN: {
				const result = this.processActivityEvent(newState, eventDate, today);
				streakChange = result.streakChange;
				rewards.push(...result.rewards);
				notifications.push(...result.notifications);
				break;
			}

			case StreakEventType.STREAK_FREEZE_USED:
				break;

			case StreakEventType.STREAK_RECOVERED:
				newState.status = StreakStatus.ACTIVE;
				newState.recoveryDeadline = null;
				break;

			default:
				break;
		}

		newState.lastUpdated = new Date();
		return { newState, streakChange, rewards, notifications };
	}

	useFreeze(streakState: StreakState): {
		success: boolean;
		newState: StreakState;
		message: string;
	} {
		if (streakState.freezesAvailable <= 0) {
			return {
				success: false,
				newState: streakState,
				message: "No freezes available",
			};
		}

		if (
			streakState.status !== StreakStatus.ACTIVE &&
			streakState.status !== StreakStatus.BROKEN
		) {
			return {
				success: false,
				newState: streakState,
				message: "Cannot use freeze in current streak state",
			};
		}

		const newState = { ...streakState };
		newState.freezesAvailable -= 1;
		newState.totalFreezesUsed += 1;
		newState.status = StreakStatus.FROZEN;
		newState.frozenUntil = new Date();
		newState.frozenUntil.setDate(
			newState.frozenUntil.getDate() + this.config.freezeDurationDays
		);
		newState.lastUpdated = new Date();

		return {
			success: true,
			newState,
			message: `Streak frozen for ${this.config.freezeDurationDays} days`,
		};
	}

	awardFreezes(streakState: StreakState, count: number): StreakState {
		const newState = { ...streakState };
		newState.freezesAvailable = Math.min(
			this.config.maxFreezes,
			newState.freezesAvailable + count
		);
		newState.lastUpdated = new Date();
		return newState;
	}

	private processActivityEvent(
		state: StreakState,
		eventDate: Date,
		_today: Date
	): {
		streakChange: number;
		rewards: Array<{ type: string; value: unknown }>;
		notifications: string[];
	} {
		let streakChange = 0;
		const rewards: Array<{ type: string; value: unknown }> = [];
		const notifications: string[] = [];

		const eventDay = new Date(eventDate);
		eventDay.setHours(0, 0, 0, 0);

		const lastActivityDay = state.lastActivityDate ? new Date(state.lastActivityDate) : null;
		if (lastActivityDay) {
			lastActivityDay.setHours(0, 0, 0, 0);
		}

		const isNewDay = !lastActivityDay || eventDay.getTime() !== lastActivityDay.getTime();

		if (!isNewDay) {
			return { streakChange, rewards, notifications };
		}

		const daysDifference = lastActivityDay
			? Math.floor((eventDay.getTime() - lastActivityDay.getTime()) / (1000 * 60 * 60 * 24))
			: 1;

		if (state.status === StreakStatus.ACTIVE) {
			if (daysDifference === 1) {
				state.currentStreak += 1;
				state.longestStreak = Math.max(state.longestStreak, state.currentStreak);
				streakChange = 1;

				const reward = this.config.rewards[state.currentStreak];
				if (reward) {
					rewards.push({ type: "xp_bonus", value: reward.xpBonus });
					if (reward.freezeAward) {
						rewards.push({ type: "freeze_award", value: reward.freezeAward });
					}
					if (reward.achievement) {
						rewards.push({ type: "achievement", value: reward.achievement });
					}
					notifications.push(`Streak milestone reached: ${state.currentStreak} days!`);
				}
			} else if (daysDifference === 2 && state.freezesAvailable > 0) {
				state.freezesAvailable -= 1;
				state.totalFreezesUsed += 1;
				state.currentStreak += 1;
				state.longestStreak = Math.max(state.longestStreak, state.currentStreak);
				streakChange = 1;
				notifications.push("Streak freeze used automatically!");
			} else {
				state.status = StreakStatus.BROKEN;
				state.recoveryDeadline = new Date(eventDay);
				state.recoveryDeadline.setDate(
					state.recoveryDeadline.getDate() + this.config.recoveryWindowDays
				);
				streakChange = -state.currentStreak;
				notifications.push(
					`Streak broken after ${state.currentStreak} days. You have ${this.config.recoveryWindowDays} days to recover it!`
				);
			}
		} else if (state.status === StreakStatus.BROKEN) {
			if (daysDifference <= this.config.recoveryWindowDays + 1) {
				state.status = StreakStatus.ACTIVE;
				state.recoveryDeadline = null;
				notifications.push("Streak recovered! Keep it going!");
			} else {
				state.currentStreak = 1;
				state.longestStreak = Math.max(state.longestStreak, 1);
				state.status = StreakStatus.ACTIVE;
				state.streakStartDate = eventDay;
				state.recoveryDeadline = null;
				streakChange = 1;
				notifications.push("New streak started!");
			}
		} else if (state.status === StreakStatus.FROZEN) {
			if (state.frozenUntil && eventDay >= state.frozenUntil) {
				state.status = StreakStatus.ACTIVE;
				state.frozenUntil = null;
				state.currentStreak += 1;
				state.longestStreak = Math.max(state.longestStreak, state.currentStreak);
				streakChange = 1;
				notifications.push("Freeze period ended, streak continues!");
			}
		} else {
			state.currentStreak = 1;
			state.longestStreak = Math.max(state.longestStreak, 1);
			state.status = StreakStatus.ACTIVE;
			state.streakStartDate = eventDay;
			streakChange = 1;
			notifications.push("Streak started!");
		}

		state.lastActivityDate = eventDate;
		return { streakChange, rewards, notifications };
	}
}
