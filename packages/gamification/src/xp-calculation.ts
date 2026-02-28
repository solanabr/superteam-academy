import { z } from "zod";

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

export const XPEventSchema = z.object({
	id: z.string().uuid(),
	userId: z.string(),
	type: z.nativeEnum(XPEventType),
	amount: z.number().positive(),
	metadata: z.record(z.string(), z.unknown()).optional(),
	timestamp: z.date(),
	source: z.string(),
	multiplier: z.number().min(1).default(1),
	capped: z.boolean().default(false),
});

export type XPEvent = z.infer<typeof XPEventSchema>;

export interface XPConfig {
	baseAmounts: Record<XPEventType, number>;
	multipliers: {
		streak: {
			[key: number]: number; // streak length -> multiplier
		};
		timeBonus: {
			[key: string]: number; // time range -> multiplier
		};
		difficulty: {
			easy: number;
			medium: number;
			hard: number;
			expert: number;
		};
	};
	caps: {
		daily: number;
		weekly: number;
		monthly: number;
		lifetime: number;
	};
}

export const DEFAULT_XP_CONFIG: XPConfig = {
	baseAmounts: {
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
	},
	multipliers: {
		streak: {
			7: 1.1, // 10% bonus at 7-day streak
			14: 1.25, // 25% bonus at 14-day streak
			30: 1.5, // 50% bonus at 30-day streak
			60: 2.0, // 100% bonus at 60-day streak
			100: 3.0, // 200% bonus at 100-day streak
		},
		timeBonus: {
			early_morning: 1.2, // 6-9 AM
			evening: 1.1, // 6-10 PM
			weekend: 1.15, // Saturday/Sunday
		},
		difficulty: {
			easy: 1.0,
			medium: 1.2,
			hard: 1.5,
			expert: 2.0,
		},
	},
	caps: {
		daily: 1000,
		weekly: 5000,
		monthly: 15_000,
		lifetime: 1_000_000,
	},
};

export class XPCalculationEngine {
	private config: XPConfig;

	constructor(config: XPConfig = DEFAULT_XP_CONFIG) {
		this.config = config;
	}

	calculateXP(event: Omit<XPEvent, "amount">): number {
		let baseAmount = this.config.baseAmounts[event.type];

		const streakLength = event.metadata?.streakLength;
		if (typeof streakLength === "number") {
			const streakMultiplier = this.getStreakMultiplier(streakLength);
			baseAmount *= streakMultiplier;
		}

		const timeOfDay = event.metadata?.timeOfDay;
		if (typeof timeOfDay === "string") {
			const timeMultiplier = this.getTimeMultiplier(timeOfDay);
			baseAmount *= timeMultiplier;
		}

		const difficulty = event.metadata?.difficulty;
		if (typeof difficulty === "string" && difficulty in this.config.multipliers.difficulty) {
			const difficultyMultiplier =
				this.config.multipliers.difficulty[
					difficulty as keyof typeof this.config.multipliers.difficulty
				] || 1;
			baseAmount *= difficultyMultiplier;
		}

		baseAmount *= event.multiplier;

		return Math.min(baseAmount, this.getCapForEvent(event));
	}

	calculateLevel(totalXP: number): {
		level: number;
		currentXP: number;
		nextLevelXP: number;
		progress: number;
	} {
		const level = levelFromXP(totalXP);
		const currentLevelXP = level * level * 100;
		const nextLevelXP = (level + 1) * (level + 1) * 100;
		const progress =
			nextLevelXP > currentLevelXP
				? (totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP)
				: 1;

		return {
			level,
			currentXP: totalXP,
			nextLevelXP,
			progress: Math.min(progress, 1),
		};
	}

	validateXP(
		event: XPEvent,
		dailyXP: number,
		weeklyXP: number,
		monthlyXP: number
	): {
		valid: boolean;
		cappedAmount: number;
		reason?: string;
	} {
		const maxForEvent = this.getCapForEvent(event);

		if (event.amount > maxForEvent) {
			return {
				valid: false,
				cappedAmount: maxForEvent,
				reason: `XP exceeds maximum for ${event.type} event`,
			};
		}

		if (dailyXP + event.amount > this.config.caps.daily) {
			const available = Math.max(0, this.config.caps.daily - dailyXP);
			return {
				valid: false,
				cappedAmount: available,
				reason: "Daily XP cap exceeded",
			};
		}

		if (weeklyXP + event.amount > this.config.caps.weekly) {
			const available = Math.max(0, this.config.caps.weekly - weeklyXP);
			return {
				valid: false,
				cappedAmount: available,
				reason: "Weekly XP cap exceeded",
			};
		}

		if (monthlyXP + event.amount > this.config.caps.monthly) {
			const available = Math.max(0, this.config.caps.monthly - monthlyXP);
			return {
				valid: false,
				cappedAmount: available,
				reason: "Monthly XP cap exceeded",
			};
		}

		return {
			valid: true,
			cappedAmount: event.amount,
		};
	}

	private getStreakMultiplier(streakLength: number): number {
		let multiplier = 1;
		for (const [threshold, mult] of Object.entries(this.config.multipliers.streak)) {
			if (streakLength >= parseInt(threshold, 10)) {
				multiplier = mult;
			}
		}
		return multiplier;
	}

	private getTimeMultiplier(timeOfDay: string): number {
		return this.config.multipliers.timeBonus[timeOfDay] || 1;
	}

	private getCapForEvent(event: Omit<XPEvent, "amount">): number {
		switch (event.type) {
			case XPEventType.LEVEL_UP:
				return 1000; // Level up events have higher cap
			case XPEventType.COURSE_COMPLETION:
				return 2000; // Course completion has higher cap
			default:
				return 500; // Default cap for most events
		}
	}

	updateConfig(newConfig: Partial<XPConfig>): void {
		this.config = { ...this.config, ...newConfig };
	}

	getConfig(): XPConfig {
		return { ...this.config };
	}
}

export interface XPStats {
	totalXP: number;
	level: number;
	dailyXP: number;
	weeklyXP: number;
	monthlyXP: number;
	averageDailyXP: number;
	topEvents: Array<{ type: XPEventType; count: number; totalXP: number }>;
	recentEvents: XPEvent[];
}

export interface XPAnalytics {
	userStats: XPStats;
	globalStats: {
		totalUsers: number;
		averageXP: number;
		topLevels: Array<{ userId: string; level: number; xp: number }>;
		mostActive: Array<{ userId: string; dailyXP: number }>;
	};
	eventBreakdown: Record<XPEventType, { count: number; totalXP: number; averageXP: number }>;
}
