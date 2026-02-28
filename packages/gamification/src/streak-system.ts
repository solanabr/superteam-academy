import { z } from "zod";

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

export interface StreakConfig {
	activityWindowHours: number; // Hours in which activity counts for streak
	freezeDurationDays: number; // How long a freeze lasts
	maxFreezes: number; // Maximum freezes a user can have
	recoveryWindowDays: number; // Days to recover a broken streak
	requiredActivities: {
		daily: number; // Minimum activities per day for streak
		types: StreakEventType[]; // Which event types count
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
	activityWindowHours: 24, // 24 hours for daily streak
	freezeDurationDays: 7, // Freezes last 7 days
	maxFreezes: 3, // Maximum 3 freezes
	recoveryWindowDays: 3, // 3 days to recover broken streak
	requiredActivities: {
		daily: 1, // At least 1 activity per day
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

export const StreakEventSchema = z.object({
	id: z.string().uuid(),
	userId: z.string(),
	type: z.nativeEnum(StreakEventType),
	timestamp: z.date(),
	metadata: z.record(z.string(), z.unknown()).optional(),
	activityCount: z.number().min(1).default(1),
});

export type StreakEvent = z.infer<typeof StreakEventSchema>;

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

	canMaintainStreak(streakState: StreakState): boolean {
		if (streakState.status === StreakStatus.FROZEN) {
			return streakState.frozenUntil ? new Date() < streakState.frozenUntil : false;
		}

		if (streakState.status === StreakStatus.BROKEN) {
			return streakState.recoveryDeadline
				? new Date() <= streakState.recoveryDeadline
				: false;
		}

		return streakState.status === StreakStatus.ACTIVE;
	}

	getRecoveryOptions(streakState: StreakState): {
		canRecover: boolean;
		timeRemaining: number; // hours
		freezesRequired: number;
		alternativeActions: string[];
	} {
		const now = new Date();
		const canRecover = streakState.recoveryDeadline
			? now <= streakState.recoveryDeadline
			: false;
		const timeRemaining =
			canRecover && streakState.recoveryDeadline
				? Math.max(
						0,
						Math.floor(
							(streakState.recoveryDeadline.getTime() - now.getTime()) /
								(1000 * 60 * 60)
						)
					)
				: 0;

		const daysMissed = streakState.lastActivityDate
			? Math.floor(
					(now.getTime() - streakState.lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)
				)
			: 0;

		const freezesRequired = Math.min(daysMissed, streakState.freezesAvailable);

		const alternativeActions: string[] = [];
		if (streakState.freezesAvailable > 0) {
			alternativeActions.push("use_freeze");
		}
		if (canRecover) {
			alternativeActions.push("complete_activity");
		}
		alternativeActions.push("start_new_streak");

		return {
			canRecover,
			timeRemaining,
			freezesRequired,
			alternativeActions,
		};
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

	getStreakStats(streakState: StreakState): {
		currentStreak: number;
		longestStreak: number;
		status: StreakStatus;
		daysActive: number;
		freezesUsed: number;
		efficiency: number; // percentage of potential days active
		nextMilestone: number;
		daysToNextMilestone: number;
	} {
		const now = new Date();
		const startDate = streakState.streakStartDate || now;
		const totalDays =
			Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
		const daysActive = streakState.longestStreak;
		const efficiency = totalDays > 0 ? (daysActive / totalDays) * 100 : 0;

		const milestones = Object.keys(this.config.rewards)
			.map(Number)
			.sort((a, b) => a - b);
		const nextMilestone =
			milestones.find((m) => m > streakState.currentStreak) || streakState.currentStreak;
		const daysToNextMilestone = nextMilestone - streakState.currentStreak;

		return {
			currentStreak: streakState.currentStreak,
			longestStreak: streakState.longestStreak,
			status: streakState.status,
			daysActive,
			freezesUsed: streakState.totalFreezesUsed,
			efficiency,
			nextMilestone,
			daysToNextMilestone,
		};
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
					notifications.push(`🎉 Streak milestone reached: ${state.currentStreak} days!`);
				}
			} else if (daysDifference === 2 && state.freezesAvailable > 0) {
				state.freezesAvailable -= 1;
				state.totalFreezesUsed += 1;
				state.currentStreak += 1;
				state.longestStreak = Math.max(state.longestStreak, state.currentStreak);
				streakChange = 1;
				notifications.push("🛡️ Streak freeze used automatically!");
			} else {
				state.status = StreakStatus.BROKEN;
				state.recoveryDeadline = new Date(eventDay);
				state.recoveryDeadline.setDate(
					state.recoveryDeadline.getDate() + this.config.recoveryWindowDays
				);
				streakChange = -state.currentStreak;
				notifications.push(
					`💔 Streak broken after ${state.currentStreak} days. You have ${this.config.recoveryWindowDays} days to recover it!`
				);
			}
		} else if (state.status === StreakStatus.BROKEN) {
			if (daysDifference <= this.config.recoveryWindowDays + 1) {
				state.status = StreakStatus.ACTIVE;
				state.recoveryDeadline = null;
				notifications.push("🔥 Streak recovered! Keep it going!");
			} else {
				state.currentStreak = 1;
				state.longestStreak = Math.max(state.longestStreak, 1);
				state.status = StreakStatus.ACTIVE;
				state.streakStartDate = eventDay;
				state.recoveryDeadline = null;
				streakChange = 1;
				notifications.push("🌟 New streak started!");
			}
		} else if (state.status === StreakStatus.FROZEN) {
			if (state.frozenUntil && eventDay >= state.frozenUntil) {
				state.status = StreakStatus.ACTIVE;
				state.frozenUntil = null;
				state.currentStreak += 1;
				state.longestStreak = Math.max(state.longestStreak, state.currentStreak);
				streakChange = 1;
				notifications.push("❄️ Freeze period ended, streak continues!");
			}
		} else {
			state.currentStreak = 1;
			state.longestStreak = Math.max(state.longestStreak, 1);
			state.status = StreakStatus.ACTIVE;
			state.streakStartDate = eventDay;
			streakChange = 1;
			notifications.push("🌟 Streak started!");
		}

		state.lastActivityDate = eventDate;
		return { streakChange, rewards, notifications };
	}

	updateConfig(newConfig: Partial<StreakConfig>): void {
		this.config = { ...this.config, ...newConfig };
	}

	getConfig(): StreakConfig {
		return { ...this.config };
	}
}

export interface StreakStats {
	userId: string;
	currentStreak: number;
	longestStreak: number;
	status: StreakStatus;
	totalDaysActive: number;
	averageStreakLength: number;
	freezesUsed: number;
	recoveryRate: number; // percentage of broken streaks recovered
	mostProductiveDay: string; // day of week
	mostProductiveHour: number;
}

export interface StreakAnalytics {
	userStats: StreakStats;
	globalStats: {
		totalUsers: number;
		averageStreak: number;
		longestStreak: number;
		mostCommonBreakDay: string;
		recoverySuccessRate: number;
		topStreakers: Array<{ userId: string; streak: number; daysActive: number }>;
	};
	distribution: {
		byLength: Record<string, number>; // streak length ranges -> count
		byStatus: Record<StreakStatus, number>;
		byDayOfWeek: Record<string, number>;
	};
}
