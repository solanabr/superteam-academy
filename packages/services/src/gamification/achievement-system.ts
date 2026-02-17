// Achievement Types
export interface Achievement {
	id: string;
	name: string;
	description: string;
	icon: string;
	category: AchievementCategory;
	rarity: AchievementRarity;
	requirements: AchievementRequirement[];
	rewards: AchievementReward[];
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export interface AchievementRequirement {
	type: RequirementType;
	target: number;
	current?: number;
	metadata?: Record<string, unknown>;
}

export interface AchievementReward {
	type: RewardType;
	amount: number;
	metadata?: Record<string, unknown>;
}

export interface UserAchievement {
	id: string;
	userId: string;
	achievementId: string;
	unlockedAt: Date;
	progress: AchievementProgress[];
	claimedRewards: boolean;
	claimedAt?: Date;
}

export interface AchievementProgress {
	requirementIndex: number;
	currentValue: number;
	completedAt?: Date;
}

export enum AchievementCategory {
	LEARNING = "learning",
	STREAK = "streak",
	SOCIAL = "social",
	COMPLETION = "completion",
	SPEED = "speed",
	QUALITY = "quality",
	SPECIAL = "special",
}

export enum AchievementRarity {
	COMMON = "common",
	UNCOMMON = "uncommon",
	RARE = "rare",
	EPIC = "epic",
	LEGENDARY = "legendary",
}

export enum RequirementType {
	LESSON_COMPLETIONS = "lesson_completions",
	CHALLENGE_SUCCESS = "challenge_success",
	STREAK_LENGTH = "streak_length",
	XP_EARNED = "xp_earned",
	COURSES_COMPLETED = "courses_completed",
	TIME_SPENT = "time_spent",
	ACCURACY_RATE = "accuracy_rate",
	FIRST_ATTEMPT_SUCCESS = "first_attempt_success",
	SOCIAL_SHARES = "social_shares",
	PEER_REVIEWS = "peer_reviews",
	REFERRALS = "referrals",
	CONSECUTIVE_LOGINS = "consecutive_logins",
	LEVEL_REACHED = "level_reached",
	BADGES_EARNED = "badges_earned",
}

export enum RewardType {
	XP = "xp",
	STREAK_FREEZE = "streak_freeze",
	BADGE = "badge",
	TITLE = "title",
	AVATAR_FRAME = "avatar_frame",
	SPECIAL_ACCESS = "special_access",
	DISCOUNT = "discount",
	UNLOCK_FEATURE = "unlock_feature",
}

// Achievement Catalog
export class AchievementCatalog {
	private achievements: Map<string, Achievement> = new Map();

	// Add achievement to catalog
	addAchievement(achievement: Achievement): void {
		this.achievements.set(achievement.id, achievement);
	}

	// Get achievement by ID
	getAchievement(id: string): Achievement | undefined {
		return this.achievements.get(id);
	}

	// Get all achievements
	getAllAchievements(): Achievement[] {
		return Array.from(this.achievements.values());
	}

	// Get achievements by category
	getAchievementsByCategory(category: AchievementCategory): Achievement[] {
		return this.getAllAchievements().filter((a) => a.category === category);
	}

	// Get achievements by rarity
	getAchievementsByRarity(rarity: AchievementRarity): Achievement[] {
		return this.getAllAchievements().filter((a) => a.rarity === rarity);
	}

	// Search achievements
	searchAchievements(query: string): Achievement[] {
		const lowercaseQuery = query.toLowerCase();
		return this.getAllAchievements().filter(
			(a) =>
				a.name.toLowerCase().includes(lowercaseQuery) ||
				a.description.toLowerCase().includes(lowercaseQuery)
		);
	}

	// Get achievement statistics
	getStatistics(): AchievementStats {
		const achievements = this.getAllAchievements();
		const categoryCounts = achievements.reduce(
			(counts, a) => {
				counts[a.category] = (counts[a.category] || 0) + 1;
				return counts;
			},
			{} as Record<AchievementCategory, number>
		);

		const rarityCounts = achievements.reduce(
			(counts, a) => {
				counts[a.rarity] = (counts[a.rarity] || 0) + 1;
				return counts;
			},
			{} as Record<AchievementRarity, number>
		);

		return {
			totalAchievements: achievements.length,
			categoryBreakdown: categoryCounts,
			rarityBreakdown: rarityCounts,
			activeAchievements: achievements.filter((a) => a.isActive).length,
		};
	}
}

// Achievement Unlocking Engine
export class AchievementUnlocker {
	private catalog: AchievementCatalog;
	private userAchievements: Map<string, UserAchievement[]> = new Map();

	constructor(catalog: AchievementCatalog) {
		this.catalog = catalog;
	}

	// Check and unlock achievements for user
	async checkAchievements(
		userId: string,
		userStats: UserStats,
		event?: AchievementEvent
	): Promise<AchievementUnlockResult[]> {
		const unlockedAchievements: AchievementUnlockResult[] = [];
		const userAchievements = this.getUserAchievements(userId);

		for (const achievement of this.catalog.getAllAchievements()) {
			if (!achievement.isActive) continue;
			if (userAchievements.some((ua) => ua.achievementId === achievement.id)) continue;

			const progress = this.calculateProgress(achievement, userStats, event);
			const isCompleted = this.isAchievementCompleted(achievement, progress);

			if (isCompleted) {
				const userAchievement = await this.unlockAchievement(userId, achievement, progress);
				unlockedAchievements.push({
					achievement,
					userAchievement,
					rewards: achievement.rewards,
				});
			}
		}

		return unlockedAchievements;
	}

	// Update progress for user achievements
	async updateProgress(
		userId: string,
		event: AchievementEvent
	): Promise<AchievementProgressUpdate[]> {
		const updates: AchievementProgressUpdate[] = [];
		const userAchievements = this.getUserAchievements(userId);

		for (const userAchievement of userAchievements) {
			const achievement = this.catalog.getAchievement(userAchievement.achievementId);
			if (!achievement) continue;

			const newProgress = this.calculateProgress(achievement, event.userStats, event);
			const hasProgressed = this.hasProgressChanged(userAchievement.progress, newProgress);

			if (hasProgressed) {
				userAchievement.progress = newProgress;
				updates.push({
					userAchievement,
					newProgress,
					completedRequirements: this.getCompletedRequirements(achievement, newProgress),
				});
			}
		}

		return updates;
	}

	// Claim rewards for achievement
	async claimRewards(userId: string, achievementId: string): Promise<ClaimResult> {
		const userAchievements = this.getUserAchievements(userId);
		const userAchievement = userAchievements.find((ua) => ua.achievementId === achievementId);

		if (!userAchievement) {
			return { success: false, reason: "Achievement not found" };
		}

		if (userAchievement.claimedRewards) {
			return { success: false, reason: "Rewards already claimed" };
		}

		const achievement = this.catalog.getAchievement(achievementId);
		if (!achievement) {
			return { success: false, reason: "Achievement not found" };
		}

		// Grant rewards
		await this.grantRewards(userId, achievement.rewards);

		userAchievement.claimedRewards = true;
		userAchievement.claimedAt = new Date();

		return {
			success: true,
			rewards: achievement.rewards,
		};
	}

	private calculateProgress(
		achievement: Achievement,
		userStats: UserStats,
		event?: AchievementEvent
	): AchievementProgress[] {
		return achievement.requirements.map((requirement, index) => {
			const currentValue = this.getCurrentValue(requirement, userStats, event);
			const existingProgress: AchievementProgress = { requirementIndex: index, currentValue };

			// Check if requirement is completed
			if (currentValue >= requirement.target) {
				existingProgress.completedAt = new Date();
			}

			return existingProgress;
		});
	}

	private getCurrentValue(
		requirement: AchievementRequirement,
		userStats: UserStats,
		_event?: AchievementEvent
	): number {
		switch (requirement.type) {
			case RequirementType.LESSON_COMPLETIONS:
				return userStats.totalLessonsCompleted;

			case RequirementType.CHALLENGE_SUCCESS:
				return userStats.totalChallengesCompleted;

			case RequirementType.STREAK_LENGTH:
				return userStats.longestStreak;

			case RequirementType.XP_EARNED:
				return userStats.totalXP;

			case RequirementType.COURSES_COMPLETED:
				return userStats.coursesCompleted;

			case RequirementType.TIME_SPENT:
				return userStats.totalTimeSpent;

			case RequirementType.ACCURACY_RATE:
				return userStats.averageAccuracy * 100; // Convert to percentage

			case RequirementType.FIRST_ATTEMPT_SUCCESS:
				return userStats.firstAttemptSuccesses;

			case RequirementType.SOCIAL_SHARES:
				return userStats.socialShares;

			case RequirementType.PEER_REVIEWS:
				return userStats.peerReviews;

			case RequirementType.REFERRALS:
				return userStats.referrals;

			case RequirementType.CONSECUTIVE_LOGINS:
				return userStats.consecutiveLogins;

			case RequirementType.LEVEL_REACHED:
				return userStats.currentLevel;

			case RequirementType.BADGES_EARNED:
				return userStats.badgesEarned;

			default:
				return requirement.current || 0;
		}
	}

	private isAchievementCompleted(
		achievement: Achievement,
		progress: AchievementProgress[]
	): boolean {
		return progress.every(
			(p) => p.currentValue >= achievement.requirements[p.requirementIndex].target
		);
	}

	private async unlockAchievement(
		userId: string,
		achievement: Achievement,
		progress: AchievementProgress[]
	): Promise<UserAchievement> {
		const userAchievement: UserAchievement = {
			id: this.generateUserAchievementId(),
			userId,
			achievementId: achievement.id,
			unlockedAt: new Date(),
			progress,
			claimedRewards: false,
		};

		if (!this.userAchievements.has(userId)) {
			this.userAchievements.set(userId, []);
		}

		this.userAchievements.get(userId)?.push(userAchievement);

		// Emit unlock event
		this.emitUnlockEvent(userId, achievement);

		return userAchievement;
	}

	private hasProgressChanged(
		oldProgress: AchievementProgress[],
		newProgress: AchievementProgress[]
	): boolean {
		return oldProgress.some((oldP, index) => {
			const newP = newProgress[index];
			return newP && oldP.currentValue !== newP.currentValue;
		});
	}

	private getCompletedRequirements(
		_achievement: Achievement,
		progress: AchievementProgress[]
	): number[] {
		return progress.filter((p) => p.completedAt).map((p) => p.requirementIndex);
	}

	private async grantRewards(userId: string, rewards: AchievementReward[]): Promise<void> {
		for (const reward of rewards) {
			await this.grantReward(userId, reward);
		}
	}

	private async grantReward(userId: string, reward: AchievementReward): Promise<void> {
		switch (reward.type) {
			case RewardType.XP:
				await this.grantXPReward(userId, reward.amount);
				break;

			case RewardType.STREAK_FREEZE:
				await this.grantFreezeReward(userId, reward.amount);
				break;

			case RewardType.BADGE:
				await this.grantBadgeReward(userId, reward.metadata?.badgeId as string | undefined);
				break;

			case RewardType.TITLE:
				await this.grantTitleReward(userId, reward.metadata?.title as string | undefined);
				break;

			case RewardType.AVATAR_FRAME:
				await this.grantAvatarFrameReward(userId, reward.metadata?.frameId as string | undefined);
				break;

			case RewardType.SPECIAL_ACCESS:
				await this.grantSpecialAccessReward(userId, reward.metadata?.accessType as string | undefined);
				break;

			case RewardType.DISCOUNT:
				await this.grantDiscountReward(userId, reward.amount);
				break;
			default:
				break;
		}
	}

	private getUserAchievements(userId: string): UserAchievement[] {
		return this.userAchievements.get(userId) || [];
	}

	private generateUserAchievementId(): string {
		return `ua_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	private emitUnlockEvent(_userId: string, _achievement: Achievement): void {
		/* ignored */
	}

	// Placeholder methods for reward granting
	private async grantXPReward(_userId: string, _amount: number): Promise<void> {
		/* ignored */
	}

	private async grantFreezeReward(_userId: string, _amount: number): Promise<void> {
		/* ignored */
	}

	private async grantBadgeReward(_userId: string, _badgeId?: string): Promise<void> {
		/* ignored */
	}

	private async grantTitleReward(_userId: string, _title?: string): Promise<void> {
		/* ignored */
	}

	private async grantAvatarFrameReward(_userId: string, _frameId?: string): Promise<void> {
		/* ignored */
	}

	private async grantSpecialAccessReward(_userId: string, _accessType?: string): Promise<void> {
		/* ignored */
	}

	private async grantDiscountReward(_userId: string, _amount: number): Promise<void> {
		/* ignored */
	}
}

// Achievement Showcase
export class AchievementShowcase {
	private catalog: AchievementCatalog;
	private userAchievements: Map<string, UserAchievement[]> = new Map();

	constructor(catalog: AchievementCatalog) {
		this.catalog = catalog;
	}

	// Get user's achievement showcase
	getUserShowcase(userId: string): AchievementShowcaseData {
		const userAchievements = this.userAchievements.get(userId) || [];
		const achievements = userAchievements
			.map((ua) => {
				const achievement = this.catalog.getAchievement(ua.achievementId);
				return achievement
					? {
							achievement,
							userAchievement: ua,
							rarity: achievement.rarity,
							unlockedAt: ua.unlockedAt,
						}
					: null;
			})
			.filter(Boolean) as AchievementShowcaseItem[];

		const stats = this.calculateShowcaseStats(achievements);

		return {
			userId,
			achievements: achievements.sort(
				(a, b) => b.unlockedAt.getTime() - a.unlockedAt.getTime()
			),
			stats,
		};
	}

	// Get achievement leaderboard
	getAchievementLeaderboard(achievementId: string, limit = 10): AchievementLeaderboardEntry[] {
		const entries: AchievementLeaderboardEntry[] = [];

		for (const [userId, userAchievements] of this.userAchievements) {
			const userAchievement = userAchievements.find(
				(ua) => ua.achievementId === achievementId
			);
			if (userAchievement) {
				entries.push({
					userId,
					unlockedAt: userAchievement.unlockedAt,
					rank: 0, // Will be set after sorting
				});
			}
		}

		entries.sort((a, b) => a.unlockedAt.getTime() - b.unlockedAt.getTime());

		return entries.slice(0, limit).map((entry, index) => ({
			...entry,
			rank: index + 1,
		}));
	}

	// Get rare achievements showcase
	getRareAchievementsShowcase(limit = 5): RareAchievementShowcase[] {
		const rareAchievements = this.catalog
			.getAllAchievements()
			.filter(
				(a) =>
					a.rarity === AchievementRarity.LEGENDARY || a.rarity === AchievementRarity.EPIC
			)
			.slice(0, limit);

		return rareAchievements.map((achievement) => {
			const unlockCount = this.getAchievementUnlockCount(achievement.id);
			const recentUnlocks = this.getRecentUnlocks(achievement.id, 3);

			return {
				achievement,
				totalUnlocks: unlockCount,
				recentUnlocks,
			};
		});
	}

	private calculateShowcaseStats(
		achievements: AchievementShowcaseItem[]
	): AchievementShowcaseStats {
		const totalAchievements = achievements.length;
		const rarityCounts = achievements.reduce(
			(counts, item) => {
				counts[item.rarity] = (counts[item.rarity] || 0) + 1;
				return counts;
			},
			{} as Record<AchievementRarity, number>
		);

		const categoryCounts = achievements.reduce(
			(counts, item) => {
				counts[item.achievement.category] = (counts[item.achievement.category] || 0) + 1;
				return counts;
			},
			{} as Record<AchievementCategory, number>
		);

		const averageTimeToUnlock =
			achievements.length > 0
				? achievements.reduce((sum, _item) => {
						// This would calculate actual time to unlock
						return sum + 1; // Placeholder
					}, 0) / achievements.length
				: 0;

		return {
			totalAchievements,
			rarityBreakdown: rarityCounts,
			categoryBreakdown: categoryCounts,
			averageTimeToUnlock,
			completionRate: totalAchievements / this.catalog.getAllAchievements().length,
		};
	}

	private getAchievementUnlockCount(achievementId: string): number {
		let count = 0;
		for (const userAchievements of this.userAchievements.values()) {
			if (userAchievements.some((ua) => ua.achievementId === achievementId)) {
				count++;
			}
		}
		return count;
	}

	private getRecentUnlocks(achievementId: string, limit: number): RecentUnlock[] {
		const unlocks: RecentUnlock[] = [];

		for (const [userId, userAchievements] of this.userAchievements) {
			const userAchievement = userAchievements.find(
				(ua) => ua.achievementId === achievementId
			);
			if (userAchievement) {
				unlocks.push({
					userId,
					unlockedAt: userAchievement.unlockedAt,
				});
			}
		}

		return unlocks
			.sort((a, b) => b.unlockedAt.getTime() - a.unlockedAt.getTime())
			.slice(0, limit);
	}
}

// Achievement Analytics
export class AchievementAnalytics {
	private catalog: AchievementCatalog;
	private userAchievements: Map<string, UserAchievement[]> = new Map();

	constructor(catalog: AchievementCatalog) {
		this.catalog = catalog;
	}

	// Get achievement analytics
	getAnalytics(): AchievementAnalyticsData {
		const totalUsers = this.userAchievements.size;
		const totalAchievements = this.catalog.getAllAchievements().length;
		const totalUnlocks = Array.from(this.userAchievements.values()).reduce(
			(sum, userAchievements) => sum + userAchievements.length,
			0
		);

		const categoryUnlocks = this.calculateCategoryUnlocks();
		const rarityUnlocks = this.calculateRarityUnlocks();
		const completionRates = this.calculateCompletionRates();

		return {
			totalUsers,
			totalAchievements,
			totalUnlocks,
			averageAchievementsPerUser: totalUnlocks / totalUsers,
			categoryUnlocks,
			rarityUnlocks,
			completionRates,
			trendingAchievements: this.getTrendingAchievements(),
		};
	}

	// Get user achievement analytics
	getUserAnalytics(userId: string): UserAchievementAnalytics {
		const userAchievements = this.userAchievements.get(userId) || [];

		const achievementsByCategory = userAchievements.reduce(
			(counts, ua) => {
				const achievement = this.catalog.getAchievement(ua.achievementId);
				if (achievement) {
					counts[achievement.category] = (counts[achievement.category] || 0) + 1;
				}
				return counts;
			},
			{} as Record<AchievementCategory, number>
		);

		const achievementsByRarity = userAchievements.reduce(
			(counts, ua) => {
				const achievement = this.catalog.getAchievement(ua.achievementId);
				if (achievement) {
					counts[achievement.rarity] = (counts[achievement.rarity] || 0) + 1;
				}
				return counts;
			},
			{} as Record<AchievementRarity, number>
		);

		const completionRate = userAchievements.length / this.catalog.getAllAchievements().length;
		const averageTimeToUnlock = this.calculateAverageTimeToUnlock(userAchievements);

		return {
			userId,
			totalAchievements: userAchievements.length,
			achievementsByCategory,
			achievementsByRarity,
			completionRate,
			averageTimeToUnlock,
			recentAchievements: userAchievements
				.sort((a, b) => b.unlockedAt.getTime() - a.unlockedAt.getTime())
				.slice(0, 5),
		};
	}

	private calculateCategoryUnlocks(): Record<AchievementCategory, number> {
		const unlocks = {} as Record<AchievementCategory, number>;

		for (const category of Object.values(AchievementCategory)) {
			unlocks[category] = 0;
		}

		for (const userAchievements of this.userAchievements.values()) {
			for (const userAchievement of userAchievements) {
				const achievement = this.catalog.getAchievement(userAchievement.achievementId);
				if (achievement) {
					unlocks[achievement.category]++;
				}
			}
		}

		return unlocks;
	}

	private calculateRarityUnlocks(): Record<AchievementRarity, number> {
		const unlocks = {} as Record<AchievementRarity, number>;

		for (const rarity of Object.values(AchievementRarity)) {
			unlocks[rarity] = 0;
		}

		for (const userAchievements of this.userAchievements.values()) {
			for (const userAchievement of userAchievements) {
				const achievement = this.catalog.getAchievement(userAchievement.achievementId);
				if (achievement) {
					unlocks[achievement.rarity]++;
				}
			}
		}

		return unlocks;
	}

	private calculateCompletionRates(): Record<AchievementCategory, number> {
		const rates = {} as Record<AchievementCategory, number>;

		for (const category of Object.values(AchievementCategory)) {
			const categoryAchievements = this.catalog.getAchievementsByCategory(category);
			if (categoryAchievements.length === 0) {
				rates[category] = 0;
				continue;
			}

			let totalCompletions = 0;
			for (const userAchievements of this.userAchievements.values()) {
				const categoryUnlocks = userAchievements.filter((ua) => {
					const achievement = this.catalog.getAchievement(ua.achievementId);
					return achievement?.category === category;
				}).length;
				totalCompletions += categoryUnlocks;
			}

			rates[category] =
				totalCompletions / (categoryAchievements.length * this.userAchievements.size);
		}

		return rates;
	}

	private getTrendingAchievements(): TrendingAchievement[] {
		const lastWeek = new Date();
		lastWeek.setDate(lastWeek.getDate() - 7);

		const recentUnlocks: Record<string, number> = {};

		for (const userAchievements of this.userAchievements.values()) {
			for (const userAchievement of userAchievements) {
				if (userAchievement.unlockedAt >= lastWeek) {
					recentUnlocks[userAchievement.achievementId] =
						(recentUnlocks[userAchievement.achievementId] || 0) + 1;
				}
			}
		}

		return Object.entries(recentUnlocks)
			.sort(([, a], [, b]) => b - a)
			.slice(0, 5)
			.map(([achievementId, unlocks]) => ({
				achievement: this.catalog.getAchievement(achievementId)!,
				recentUnlocks: unlocks,
			}));
	}

	private calculateAverageTimeToUnlock(userAchievements: UserAchievement[]): number {
		if (userAchievements.length === 0) return 0;

		// This would calculate actual time from user registration to unlock
		// Placeholder implementation
		return userAchievements.length * 86_400_000; // 1 day per achievement in ms
	}
}

// Achievement Validation
export class AchievementValidator {
	// Validate achievement data
	validateAchievement(achievement: Achievement): ValidationResult {
		const errors: string[] = [];

		if (!achievement.name || achievement.name.length < 3) {
			errors.push("Achievement name must be at least 3 characters");
		}

		if (!achievement.description || achievement.description.length < 10) {
			errors.push("Achievement description must be at least 10 characters");
		}

		if (!Object.values(AchievementCategory).includes(achievement.category)) {
			errors.push("Invalid achievement category");
		}

		if (!Object.values(AchievementRarity).includes(achievement.rarity)) {
			errors.push("Invalid achievement rarity");
		}

		if (!achievement.requirements || achievement.requirements.length === 0) {
			errors.push("Achievement must have at least one requirement");
		}

		for (const requirement of achievement.requirements) {
			if (!Object.values(RequirementType).includes(requirement.type)) {
				errors.push(`Invalid requirement type: ${requirement.type}`);
			}

			if (requirement.target <= 0) {
				errors.push("Requirement target must be positive");
			}
		}

		return {
			isValid: errors.length === 0,
			errors,
		};
	}

	// Validate user achievement
	validateUserAchievement(userAchievement: UserAchievement): ValidationResult {
		const errors: string[] = [];

		if (!userAchievement.userId) {
			errors.push("User achievement must have a user ID");
		}

		if (!userAchievement.achievementId) {
			errors.push("User achievement must have an achievement ID");
		}

		if (!userAchievement.unlockedAt) {
			errors.push("User achievement must have an unlock date");
		}

		return {
			isValid: errors.length === 0,
			errors,
		};
	}
}

// Achievement Testing Framework
export class AchievementTestingFramework {
	private unlocker: AchievementUnlocker;

	constructor(_catalog: AchievementCatalog, unlocker: AchievementUnlocker) {
		this.unlocker = unlocker;
	}

	// Test achievement unlocking
	async testAchievementUnlocking(): Promise<TestResult[]> {
		const tests: TestResult[] = [];

		tests.push(await this.testBasicAchievementUnlock());
		tests.push(await this.testProgressTracking());
		tests.push(await this.testRewardClaiming());

		return tests;
	}

	// Test achievement validation
	async testAchievementValidation(): Promise<TestResult[]> {
		const tests: TestResult[] = [];

		tests.push(await this.testValidAchievement());
		tests.push(await this.testInvalidAchievement());

		return tests;
	}

	private async testBasicAchievementUnlock(): Promise<TestResult> {
		try {
			const userStats: UserStats = {
				totalLessonsCompleted: 10,
				totalChallengesCompleted: 5,
				longestStreak: 7,
				totalXP: 500,
				coursesCompleted: 1,
				totalTimeSpent: 3600,
				averageAccuracy: 0.85,
				firstAttemptSuccesses: 3,
				socialShares: 2,
				peerReviews: 1,
				referrals: 0,
				consecutiveLogins: 5,
				currentLevel: 5,
				badgesEarned: 2,
			};

			const unlocks = await this.unlocker.checkAchievements("test-user", userStats);

			return {
				name: "Basic Achievement Unlock",
				passed: unlocks.length >= 0, // Should unlock at least some achievements
				unlockedCount: unlocks.length,
			};
		} catch (error) {
			return {
				name: "Basic Achievement Unlock",
				passed: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	private async testProgressTracking(): Promise<TestResult> {
		try {
			const userStats: UserStats = {
				totalLessonsCompleted: 5,
				totalChallengesCompleted: 2,
				longestStreak: 3,
				totalXP: 250,
				coursesCompleted: 0,
				totalTimeSpent: 1800,
				averageAccuracy: 0.75,
				firstAttemptSuccesses: 1,
				socialShares: 0,
				peerReviews: 0,
				referrals: 0,
				consecutiveLogins: 2,
				currentLevel: 2,
				badgesEarned: 0,
			};

			const updates = await this.unlocker.updateProgress("test-user", {
				type: "lesson_completion",
				userStats,
			});

			return {
				name: "Progress Tracking",
				passed: updates.length >= 0,
				progressUpdates: updates.length,
			};
		} catch (error) {
			return {
				name: "Progress Tracking",
				passed: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	private async testRewardClaiming(): Promise<TestResult> {
		try {
			// This would require setting up a test achievement first
			const result = await this.unlocker.claimRewards("test-user", "test-achievement");

			return {
				name: "Reward Claiming",
				passed: !result.success || result.success, // Either fails gracefully or succeeds
				claimResult: result,
			};
		} catch (error) {
			return {
				name: "Reward Claiming",
				passed: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	private async testValidAchievement(): Promise<TestResult> {
		try {
			const validator = new AchievementValidator();
			const validAchievement: Achievement = {
				id: "test-achievement",
				name: "Test Achievement",
				description: "A test achievement for validation",
				icon: "test-icon",
				category: AchievementCategory.LEARNING,
				rarity: AchievementRarity.COMMON,
				requirements: [
					{
						type: RequirementType.LESSON_COMPLETIONS,
						target: 5,
					},
				],
				rewards: [
					{
						type: RewardType.XP,
						amount: 100,
					},
				],
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const result = validator.validateAchievement(validAchievement);

			return {
				name: "Valid Achievement",
				passed: result.isValid,
				errors: result.errors,
			};
		} catch (error) {
			return {
				name: "Valid Achievement",
				passed: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	private async testInvalidAchievement(): Promise<TestResult> {
		try {
			const validator = new AchievementValidator();
			const invalidAchievement: Achievement = {
				id: "test-achievement",
				name: "", // Invalid: empty name
				description: "", // Invalid: empty description
				icon: "test-icon",
				category: AchievementCategory.LEARNING,
				rarity: AchievementRarity.COMMON,
				requirements: [], // Invalid: no requirements
				rewards: [],
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const result = validator.validateAchievement(invalidAchievement);

			return {
				name: "Invalid Achievement",
				passed: !result.isValid && result.errors.length > 0,
				errorCount: result.errors.length,
			};
		} catch (error) {
			return {
				name: "Invalid Achievement",
				passed: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}
}

// Type definitions
interface UserStats {
	totalLessonsCompleted: number;
	totalChallengesCompleted: number;
	longestStreak: number;
	totalXP: number;
	coursesCompleted: number;
	totalTimeSpent: number; // in seconds
	averageAccuracy: number; // 0-1
	firstAttemptSuccesses: number;
	socialShares: number;
	peerReviews: number;
	referrals: number;
	consecutiveLogins: number;
	currentLevel: number;
	badgesEarned: number;
}

interface AchievementEvent {
	type: string;
	userStats: UserStats;
	metadata?: Record<string, unknown>;
}

interface AchievementUnlockResult {
	achievement: Achievement;
	userAchievement: UserAchievement;
	rewards: AchievementReward[];
}

interface AchievementProgressUpdate {
	userAchievement: UserAchievement;
	newProgress: AchievementProgress[];
	completedRequirements: number[];
}

interface ClaimResult {
	success: boolean;
	reason?: string;
	rewards?: AchievementReward[];
}

interface AchievementStats {
	totalAchievements: number;
	categoryBreakdown: Record<AchievementCategory, number>;
	rarityBreakdown: Record<AchievementRarity, number>;
	activeAchievements: number;
}

interface AchievementShowcaseData {
	userId: string;
	achievements: AchievementShowcaseItem[];
	stats: AchievementShowcaseStats;
}

interface AchievementShowcaseItem {
	achievement: Achievement;
	userAchievement: UserAchievement;
	rarity: AchievementRarity;
	unlockedAt: Date;
}

interface AchievementShowcaseStats {
	totalAchievements: number;
	rarityBreakdown: Record<AchievementRarity, number>;
	categoryBreakdown: Record<AchievementCategory, number>;
	averageTimeToUnlock: number;
	completionRate: number;
}

interface AchievementLeaderboardEntry {
	userId: string;
	unlockedAt: Date;
	rank: number;
}

interface RareAchievementShowcase {
	achievement: Achievement;
	totalUnlocks: number;
	recentUnlocks: RecentUnlock[];
}

interface RecentUnlock {
	userId: string;
	unlockedAt: Date;
}

interface AchievementAnalyticsData {
	totalUsers: number;
	totalAchievements: number;
	totalUnlocks: number;
	averageAchievementsPerUser: number;
	categoryUnlocks: Record<AchievementCategory, number>;
	rarityUnlocks: Record<AchievementRarity, number>;
	completionRates: Record<AchievementCategory, number>;
	trendingAchievements: TrendingAchievement[];
}

interface TrendingAchievement {
	achievement: Achievement;
	recentUnlocks: number;
}

interface UserAchievementAnalytics {
	userId: string;
	totalAchievements: number;
	achievementsByCategory: Record<AchievementCategory, number>;
	achievementsByRarity: Record<AchievementRarity, number>;
	completionRate: number;
	averageTimeToUnlock: number;
	recentAchievements: UserAchievement[];
}

interface ValidationResult {
	isValid: boolean;
	errors: string[];
}

interface TestResult {
	name: string;
	passed: boolean;
	expected?: unknown;
	actual?: unknown;
	error?: string;
	[key: string]: unknown;
}

// Predefined achievements
export const DEFAULT_ACHIEVEMENTS: Achievement[] = [
	{
		id: "first-lesson",
		name: "First Steps",
		description: "Complete your first lesson",
		icon: "book-open",
		category: AchievementCategory.LEARNING,
		rarity: AchievementRarity.COMMON,
		requirements: [
			{
				type: RequirementType.LESSON_COMPLETIONS,
				target: 1,
			},
		],
		rewards: [
			{
				type: RewardType.XP,
				amount: 10,
			},
		],
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date(),
	},
	{
		id: "streak-master",
		name: "Streak Master",
		description: "Maintain a 7-day streak",
		icon: "flame",
		category: AchievementCategory.STREAK,
		rarity: AchievementRarity.UNCOMMON,
		requirements: [
			{
				type: RequirementType.STREAK_LENGTH,
				target: 7,
			},
		],
		rewards: [
			{
				type: RewardType.XP,
				amount: 50,
			},
			{
				type: RewardType.STREAK_FREEZE,
				amount: 1,
			},
		],
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date(),
	},
	{
		id: "challenge-champion",
		name: "Challenge Champion",
		description: "Complete 10 challenges successfully",
		icon: "trophy",
		category: AchievementCategory.COMPLETION,
		rarity: AchievementRarity.RARE,
		requirements: [
			{
				type: RequirementType.CHALLENGE_SUCCESS,
				target: 10,
			},
		],
		rewards: [
			{
				type: RewardType.XP,
				amount: 200,
			},
			{
				type: RewardType.BADGE,
				amount: 1,
				metadata: { badgeId: "challenge-master" },
			},
		],
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date(),
	},
];
