import { z } from "zod";

// Achievement Categories
export enum AchievementCategory {
	LEARNING = "learning",
	CODING = "coding",
	COMMUNITY = "community",
	STREAK = "streak",
	PROGRESSION = "progression",
	SPECIAL = "special",
}

// Achievement Rarity
export enum AchievementRarity {
	COMMON = "common",
	UNCOMMON = "uncommon",
	RARE = "rare",
	EPIC = "epic",
	LEGENDARY = "legendary",
}

// Achievement Types
export enum AchievementType {
	PROGRESS = "progress", // Based on progress metrics
	COUNT = "count", // Based on count of actions
	STREAK = "streak", // Based on streak achievements
	TIME = "time", // Time-based achievements
	SOCIAL = "social", // Social/community achievements
	SPECIAL = "special", // Special event achievements
}

// Achievement Definition
export interface Achievement {
	id: string;
	name: string;
	description: string;
	category: AchievementCategory;
	rarity: AchievementRarity;
	type: AchievementType;
	icon: string;
	xpReward: number;
	criteria: AchievementCriteria;
	prerequisites?: string[]; // IDs of required achievements
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
}

// Achievement Criteria
export interface AchievementCriteria {
	metric: string; // e.g., 'lessons_completed', 'challenges_solved', 'streak_days'
	operator: "gte" | "lte" | "eq" | "gt" | "lt"; // comparison operator
	value: number | string | boolean;
	additionalConditions?: Record<string, unknown>; // extra conditions
}

// User Achievement Progress
export interface UserAchievement {
	userId: string;
	achievementId: string;
	progress: number; // current progress value
	target: number; // target value to unlock
	isCompleted: boolean;
	completedAt?: Date;
	claimedAt?: Date;
	metadata?: Record<string, unknown>;
}

// Achievement Unlock Event
export const AchievementUnlockEventSchema = z.object({
	id: z.string().uuid(),
	userId: z.string(),
	achievementId: z.string(),
	unlockedAt: z.date(),
	xpAwarded: z.number(),
	metadata: z.record(z.string(), z.unknown()).optional(),
});

export type AchievementUnlockEvent = z.infer<typeof AchievementUnlockEventSchema>;

// Achievement Catalog
export const ACHIEVEMENT_CATALOG: Achievement[] = [
	// Learning Achievements
	{
		id: "first_lesson",
		name: "First Steps",
		description: "Complete your first lesson",
		category: AchievementCategory.LEARNING,
		rarity: AchievementRarity.COMMON,
		type: AchievementType.COUNT,
		icon: "🎓",
		xpReward: 25,
		criteria: { metric: "lessons_completed", operator: "gte", value: 1 },
		isActive: true,
		createdAt: new Date("2024-01-01"),
		updatedAt: new Date("2024-01-01"),
	},
	{
		id: "lesson_master",
		name: "Lesson Master",
		description: "Complete 100 lessons",
		category: AchievementCategory.LEARNING,
		rarity: AchievementRarity.RARE,
		type: AchievementType.COUNT,
		icon: "📚",
		xpReward: 500,
		criteria: { metric: "lessons_completed", operator: "gte", value: 100 },
		isActive: true,
		createdAt: new Date("2024-01-01"),
		updatedAt: new Date("2024-01-01"),
	},
	{
		id: "course_completion",
		name: "Course Conqueror",
		description: "Complete your first course",
		category: AchievementCategory.LEARNING,
		rarity: AchievementRarity.UNCOMMON,
		type: AchievementType.COUNT,
		icon: "🎖️",
		xpReward: 100,
		criteria: { metric: "courses_completed", operator: "gte", value: 1 },
		isActive: true,
		createdAt: new Date("2024-01-01"),
		updatedAt: new Date("2024-01-01"),
	},

	// Coding Achievements
	{
		id: "first_challenge",
		name: "Code Beginner",
		description: "Solve your first coding challenge",
		category: AchievementCategory.CODING,
		rarity: AchievementRarity.COMMON,
		type: AchievementType.COUNT,
		icon: "💻",
		xpReward: 50,
		criteria: { metric: "challenges_solved", operator: "gte", value: 1 },
		isActive: true,
		createdAt: new Date("2024-01-01"),
		updatedAt: new Date("2024-01-01"),
	},
	{
		id: "challenge_expert",
		name: "Code Expert",
		description: "Solve 50 coding challenges",
		category: AchievementCategory.CODING,
		rarity: AchievementRarity.EPIC,
		type: AchievementType.COUNT,
		icon: "🚀",
		xpReward: 1000,
		criteria: { metric: "challenges_solved", operator: "gte", value: 50 },
		isActive: true,
		createdAt: new Date("2024-01-01"),
		updatedAt: new Date("2024-01-01"),
	},
	{
		id: "first_try_success",
		name: "First Try Hero",
		description: "Solve a challenge on the first attempt",
		category: AchievementCategory.CODING,
		rarity: AchievementRarity.UNCOMMON,
		type: AchievementType.SPECIAL,
		icon: "⚡",
		xpReward: 75,
		criteria: {
			metric: "challenge_first_try",
			operator: "eq",
			value: true,
		},
		isActive: true,
		createdAt: new Date("2024-01-01"),
		updatedAt: new Date("2024-01-01"),
	},

	// Streak Achievements
	{
		id: "week_warrior",
		name: "Week Warrior",
		description: "Maintain a 7-day streak",
		category: AchievementCategory.STREAK,
		rarity: AchievementRarity.UNCOMMON,
		type: AchievementType.STREAK,
		icon: "🔥",
		xpReward: 100,
		criteria: { metric: "max_streak", operator: "gte", value: 7 },
		isActive: true,
		createdAt: new Date("2024-01-01"),
		updatedAt: new Date("2024-01-01"),
	},
	{
		id: "streak_master",
		name: "Streak Master",
		description: "Maintain a 30-day streak",
		category: AchievementCategory.STREAK,
		rarity: AchievementRarity.EPIC,
		type: AchievementType.STREAK,
		icon: "🌟",
		xpReward: 500,
		criteria: { metric: "max_streak", operator: "gte", value: 30 },
		isActive: true,
		createdAt: new Date("2024-01-01"),
		updatedAt: new Date("2024-01-01"),
	},

	// Community Achievements
	{
		id: "social_butterfly",
		name: "Social Butterfly",
		description: "Share your progress on social media",
		category: AchievementCategory.COMMUNITY,
		rarity: AchievementRarity.COMMON,
		type: AchievementType.SOCIAL,
		icon: "🦋",
		xpReward: 25,
		criteria: { metric: "social_shares", operator: "gte", value: 1 },
		isActive: true,
		createdAt: new Date("2024-01-01"),
		updatedAt: new Date("2024-01-01"),
	},
	{
		id: "referral_champion",
		name: "Referral Champion",
		description: "Refer 5 friends to join the platform",
		category: AchievementCategory.COMMUNITY,
		rarity: AchievementRarity.RARE,
		type: AchievementType.SOCIAL,
		icon: "👥",
		xpReward: 300,
		criteria: { metric: "referrals", operator: "gte", value: 5 },
		isActive: true,
		createdAt: new Date("2024-01-01"),
		updatedAt: new Date("2024-01-01"),
	},

	// Progression Achievements
	{
		id: "level_up",
		name: "Level Up",
		description: "Reach level 5",
		category: AchievementCategory.PROGRESSION,
		rarity: AchievementRarity.COMMON,
		type: AchievementType.PROGRESS,
		icon: "⬆️",
		xpReward: 50,
		criteria: { metric: "level", operator: "gte", value: 5 },
		isActive: true,
		createdAt: new Date("2024-01-01"),
		updatedAt: new Date("2024-01-01"),
	},
	{
		id: "xp_millionaire",
		name: "XP Millionaire",
		description: "Earn 10,000 XP",
		category: AchievementCategory.PROGRESSION,
		rarity: AchievementRarity.LEGENDARY,
		type: AchievementType.PROGRESS,
		icon: "💰",
		xpReward: 2000,
		criteria: { metric: "total_xp", operator: "gte", value: 10_000 },
		isActive: true,
		createdAt: new Date("2024-01-01"),
		updatedAt: new Date("2024-01-01"),
	},

	// Special Achievements
	{
		id: "early_adopter",
		name: "Early Adopter",
		description: "Join during the beta period",
		category: AchievementCategory.SPECIAL,
		rarity: AchievementRarity.RARE,
		type: AchievementType.SPECIAL,
		icon: "🚀",
		xpReward: 200,
		criteria: {
			metric: "beta_user",
			operator: "eq",
			value: true,
		},
		isActive: true,
		createdAt: new Date("2024-01-01"),
		updatedAt: new Date("2024-01-01"),
	},
	{
		id: "perfectionist",
		name: "Perfectionist",
		description: "Complete 10 challenges on the first try",
		category: AchievementCategory.SPECIAL,
		rarity: AchievementRarity.EPIC,
		type: AchievementType.SPECIAL,
		icon: "💎",
		xpReward: 750,
		criteria: {
			metric: "first_try_challenges",
			operator: "gte",
			value: 10,
		},
		isActive: true,
		createdAt: new Date("2024-01-01"),
		updatedAt: new Date("2024-01-01"),
	},
];

// Achievement System Engine
export class AchievementSystem {
	private achievements: Map<string, Achievement> = new Map();
	private userProgress: Map<string, Map<string, UserAchievement>> = new Map();

	constructor(achievementCatalog: Achievement[] = ACHIEVEMENT_CATALOG) {
		// Initialize achievement catalog
		achievementCatalog.forEach((achievement) => {
			this.achievements.set(achievement.id, achievement);
		});
	}

	// Initialize user achievement progress
	initializeUser(userId: string): void {
		if (!this.userProgress.has(userId)) {
			const userAchievements = new Map<string, UserAchievement>();
			this.achievements.forEach((achievement) => {
				userAchievements.set(achievement.id, {
					userId,
					achievementId: achievement.id,
					progress: 0,
					target: this.getTargetValue(achievement.criteria),
					isCompleted: false,
				});
			});
			this.userProgress.set(userId, userAchievements);
		}
	}

	// Update user progress for a metric
	updateProgress(
		userId: string,
		metric: string,
		value: number | string | boolean,
		metadata?: Record<string, unknown>
	): {
		unlockedAchievements: Achievement[];
		progressUpdates: Array<{
			achievementId: string;
			newProgress: number;
			wasCompleted: boolean;
		}>;
	} {
		this.initializeUser(userId);
		const userAchievements = this.userProgress.get(userId)!;
		const unlockedAchievements: Achievement[] = [];
		const progressUpdates: Array<{
			achievementId: string;
			newProgress: number;
			wasCompleted: boolean;
		}> = [];

		// Check all achievements that use this metric
		this.achievements.forEach((achievement) => {
			if (!achievement.isActive) return;

			const userAchievement = userAchievements.get(achievement.id);
			if (!userAchievement || userAchievement.isCompleted) return;

			// Check if this achievement uses the updated metric
			if (achievement.criteria.metric === metric) {
				const wasCompleted = userAchievement.isCompleted;
				const newProgress = this.calculateProgress(
					achievement.criteria,
					value,
					userAchievement.progress
				);

				userAchievement.progress = newProgress;
				userAchievement.metadata = { ...userAchievement.metadata, ...metadata };

				// Check if achievement is now completed
				if (this.checkCompletion(achievement.criteria, newProgress)) {
					userAchievement.isCompleted = true;
					userAchievement.completedAt = new Date();
					unlockedAchievements.push(achievement);
				}

				progressUpdates.push({
					achievementId: achievement.id,
					newProgress,
					wasCompleted,
				});
			}
		});

		return { unlockedAchievements, progressUpdates };
	}

	// Get user achievement progress
	getUserAchievements(userId: string): UserAchievement[] {
		this.initializeUser(userId);
		return Array.from(this.userProgress.get(userId)?.values() ?? []);
	}

	// Get completed achievements for user
	getCompletedAchievements(userId: string): Achievement[] {
		const userAchievements = this.getUserAchievements(userId);
		return userAchievements
			.filter((ua) => ua.isCompleted)
			.map((ua) => this.achievements.get(ua.achievementId)!)
			.filter(Boolean);
	}

	// Get achievement progress for user
	getAchievementProgress(userId: string, achievementId: string): UserAchievement | null {
		this.initializeUser(userId);
		return this.userProgress.get(userId)?.get(achievementId) || null;
	}

	// Check if user has prerequisites for achievement
	hasPrerequisites(userId: string, achievement: Achievement): boolean {
		if (!achievement.prerequisites || achievement.prerequisites.length === 0) {
			return true;
		}

		const completedIds = new Set(this.getCompletedAchievements(userId).map((a) => a.id));

		return achievement.prerequisites.every((prereqId) => completedIds.has(prereqId));
	}

	// Get achievements by category
	getAchievementsByCategory(category: AchievementCategory): Achievement[] {
		return Array.from(this.achievements.values()).filter(
			(achievement) => achievement.category === category
		);
	}

	// Get achievements by rarity
	getAchievementsByRarity(rarity: AchievementRarity): Achievement[] {
		return Array.from(this.achievements.values()).filter(
			(achievement) => achievement.rarity === rarity
		);
	}

	// Calculate achievement rarity distribution
	getRarityDistribution(): Record<AchievementRarity, number> {
		const distribution = {
			[AchievementRarity.COMMON]: 0,
			[AchievementRarity.UNCOMMON]: 0,
			[AchievementRarity.RARE]: 0,
			[AchievementRarity.EPIC]: 0,
			[AchievementRarity.LEGENDARY]: 0,
		};

		this.achievements.forEach((achievement) => {
			distribution[achievement.rarity]++;
		});

		return distribution;
	}

	// Get achievement statistics
	getAchievementStats(userId: string): {
		totalAchievements: number;
		completedAchievements: number;
		completionRate: number;
		totalXPEarned: number;
		achievementsByCategory: Record<AchievementCategory, number>;
		achievementsByRarity: Record<AchievementRarity, number>;
		recentUnlocks: Achievement[];
	} {
		const allAchievements = this.getUserAchievements(userId);
		const completedAchievements = this.getCompletedAchievements(userId);

		const achievementsByCategory = {
			[AchievementCategory.LEARNING]: 0,
			[AchievementCategory.CODING]: 0,
			[AchievementCategory.COMMUNITY]: 0,
			[AchievementCategory.STREAK]: 0,
			[AchievementCategory.PROGRESSION]: 0,
			[AchievementCategory.SPECIAL]: 0,
		};

		const achievementsByRarity = {
			[AchievementRarity.COMMON]: 0,
			[AchievementRarity.UNCOMMON]: 0,
			[AchievementRarity.RARE]: 0,
			[AchievementRarity.EPIC]: 0,
			[AchievementRarity.LEGENDARY]: 0,
		};

		completedAchievements.forEach((achievement) => {
			achievementsByCategory[achievement.category]++;
			achievementsByRarity[achievement.rarity]++;
		});

		const totalXPEarned = completedAchievements.reduce(
			(sum, achievement) => sum + achievement.xpReward,
			0
		);

		// Get recent unlocks (last 10)
		const recentUnlocks = allAchievements
			.filter((ua) => ua.isCompleted && ua.completedAt)
			.sort((a, b) => (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0))
			.slice(0, 10)
			.map((ua) => this.achievements.get(ua.achievementId)!)
			.filter(Boolean);

		return {
			totalAchievements: allAchievements.length,
			completedAchievements: completedAchievements.length,
			completionRate:
				allAchievements.length > 0
					? (completedAchievements.length / allAchievements.length) * 100
					: 0,
			totalXPEarned,
			achievementsByCategory,
			achievementsByRarity,
			recentUnlocks,
		};
	}

	private getTargetValue(criteria: AchievementCriteria): number {
		return typeof criteria.value === "number" ? criteria.value : 1;
	}

	private calculateProgress(
		criteria: AchievementCriteria,
		newValue: number | string | boolean,
		currentProgress: number
	): number {
		// For count-based achievements, accumulate progress
		if (typeof newValue === "number" && typeof criteria.value === "number") {
			switch (criteria.operator) {
				case "gte":
				case "gt":
					return Math.max(currentProgress, newValue);
				case "eq":
					return newValue === criteria.value ? criteria.value : currentProgress;
				default:
					return currentProgress;
			}
		}

		// For boolean achievements
		if (typeof newValue === "boolean" && typeof criteria.value === "boolean") {
			return newValue === criteria.value ? 1 : currentProgress;
		}

		return currentProgress;
	}

	private checkCompletion(criteria: AchievementCriteria, progress: number): boolean {
		const target = this.getTargetValue(criteria);

		switch (criteria.operator) {
			case "gte":
				return progress >= target;
			case "gt":
				return progress > target;
			case "lte":
				return progress <= target;
			case "lt":
				return progress < target;
			case "eq":
				return progress === target;
			default:
				return false;
		}
	}

	// Add new achievement to catalog
	addAchievement(achievement: Achievement): void {
		this.achievements.set(achievement.id, achievement);

		// Add to all existing users' progress
		this.userProgress.forEach((userAchievements) => {
			userAchievements.set(achievement.id, {
				userId: "",
				achievementId: achievement.id,
				progress: 0,
				target: this.getTargetValue(achievement.criteria),
				isCompleted: false,
			});
		});
	}

	// Update existing achievement
	updateAchievement(achievementId: string, updates: Partial<Achievement>): void {
		const existing = this.achievements.get(achievementId);
		if (existing) {
			this.achievements.set(achievementId, {
				...existing,
				...updates,
				updatedAt: new Date(),
			});
		}
	}

	// Get all achievements
	getAllAchievements(): Achievement[] {
		return Array.from(this.achievements.values());
	}

	// Get achievement by ID
	getAchievement(achievementId: string): Achievement | null {
		return this.achievements.get(achievementId) || null;
	}
}

// Achievement Analytics Types
export interface AchievementAnalytics {
	globalStats: {
		totalAchievements: number;
		totalUsers: number;
		averageCompletionRate: number;
		mostPopularAchievement: { id: string; name: string; completions: number };
		rarestAchievement: { id: string; name: string; completions: number };
	};
	userStats: {
		userId: string;
		completionRate: number;
		favoriteCategory: AchievementCategory;
		achievementsByRarity: Record<AchievementRarity, number>;
		averageTimeToComplete: number; // days
	};
	categoryBreakdown: Record<
		AchievementCategory,
		{
			total: number;
			completed: number;
			completionRate: number;
		}
	>;
	rarityBreakdown: Record<
		AchievementRarity,
		{
			total: number;
			completed: number;
			completionRate: number;
		}
	>;
}
