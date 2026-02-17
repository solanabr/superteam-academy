// Level Configuration
export interface Level {
	level: number;
	name: string;
	xpRequired: number;
	rewards: LevelReward[];
	challenges: LevelChallenge[];
	description: string;
	icon: string;
	color: string;
}

// Level Reward Types
export enum RewardType {
	XP_BONUS = "xp_bonus",
	STREAK_FREEZE = "streak_freeze",
	ACHIEVEMENT_BADGE = "achievement_badge",
	TITLE = "title",
	AVATAR_FRAME = "avatar_frame",
	SPECIAL_ACCESS = "special_access",
	DISCOUNT = "discount",
}

// Level Challenge Types
export enum ChallengeType {
	LESSONS_COMPLETED = "lessons_completed",
	CHALLENGES_SOLVED = "challenges_solved",
	STREAK_MAINTAINED = "streak_maintained",
	COURSES_FINISHED = "courses_finished",
	REFERRALS_MADE = "referrals_made",
	SOCIAL_SHARES = "social_shares",
	TIME_SPENT = "time_spent",
}

// Level Reward
export interface LevelReward {
	type: RewardType;
	value: number | string;
	description: string;
	isAutomatic: boolean; // true if granted automatically, false if user must claim
}

// Level Challenge
export interface LevelChallenge {
	type: ChallengeType;
	target: number;
	description: string;
	xpBonus: number;
	timeLimit?: number; // days to complete
}

// User Level Progress
export interface UserLevel {
	userId: string;
	currentLevel: number;
	totalXP: number;
	xpToNextLevel: number;
	levelProgress: number; // percentage (0-100)
	completedChallenges: string[]; // challenge IDs
	claimedRewards: string[]; // reward IDs
	levelReachedAt: Date;
	lastUpdated: Date;
}

// Level Challenge Progress
export interface UserLevelChallenge {
	userId: string;
	challengeId: string;
	challenge: LevelChallenge;
	level: number;
	progress: number;
	target: number;
	isCompleted: boolean;
	completedAt?: Date;
	xpAwarded: number;
	expiresAt?: Date;
}

// Level Reward Claim
export interface LevelRewardClaim {
	userId: string;
	level: number;
	rewardId: string;
	claimedAt: Date;
	rewardType: RewardType;
	rewardValue: number | string;
}

// Default Level Configuration
export const DEFAULT_LEVELS: Level[] = [
	{
		level: 1,
		name: "Novice",
		xpRequired: 0,
		rewards: [
			{
				type: RewardType.TITLE,
				value: "Novice Learner",
				description: "Earn the Novice Learner title",
				isAutomatic: true,
			},
		],
		challenges: [
			{
				type: ChallengeType.LESSONS_COMPLETED,
				target: 1,
				description: "Complete your first lesson",
				xpBonus: 25,
				timeLimit: 7,
			},
		],
		description: "Welcome to your learning journey!",
		icon: "🌱",
		color: "#22c55e",
	},
	{
		level: 2,
		name: "Explorer",
		xpRequired: 100,
		rewards: [
			{
				type: RewardType.XP_BONUS,
				value: 50,
				description: "Bonus XP for leveling up",
				isAutomatic: true,
			},
			{
				type: RewardType.TITLE,
				value: "Explorer",
				description: "Earn the Explorer title",
				isAutomatic: true,
			},
		],
		challenges: [
			{
				type: ChallengeType.LESSONS_COMPLETED,
				target: 5,
				description: "Complete 5 lessons",
				xpBonus: 50,
				timeLimit: 14,
			},
			{
				type: ChallengeType.CHALLENGES_SOLVED,
				target: 1,
				description: "Solve your first coding challenge",
				xpBonus: 75,
				timeLimit: 14,
			},
		],
		description: "Start exploring the world of coding!",
		icon: "🗺️",
		color: "#3b82f6",
	},
	{
		level: 3,
		name: "Apprentice",
		xpRequired: 250,
		rewards: [
			{
				type: RewardType.STREAK_FREEZE,
				value: 1,
				description: "Get 1 streak freeze",
				isAutomatic: true,
			},
			{
				type: RewardType.AVATAR_FRAME,
				value: "bronze",
				description: "Unlock bronze avatar frame",
				isAutomatic: false,
			},
		],
		challenges: [
			{
				type: ChallengeType.STREAK_MAINTAINED,
				target: 3,
				description: "Maintain a 3-day learning streak",
				xpBonus: 100,
				timeLimit: 21,
			},
		],
		description: "You're becoming a true apprentice!",
		icon: "⚒️",
		color: "#f59e0b",
	},
	{
		level: 4,
		name: "Scholar",
		xpRequired: 500,
		rewards: [
			{
				type: RewardType.XP_BONUS,
				value: 100,
				description: "Bonus XP for leveling up",
				isAutomatic: true,
			},
			{
				type: RewardType.TITLE,
				value: "Scholar",
				description: "Earn the Scholar title",
				isAutomatic: true,
			},
		],
		challenges: [
			{
				type: ChallengeType.COURSES_FINISHED,
				target: 1,
				description: "Complete your first course",
				xpBonus: 200,
				timeLimit: 30,
			},
		],
		description: "Knowledge is your greatest weapon!",
		icon: "📖",
		color: "#8b5cf6",
	},
	{
		level: 5,
		name: "Expert",
		xpRequired: 1000,
		rewards: [
			{
				type: RewardType.STREAK_FREEZE,
				value: 2,
				description: "Get 2 streak freezes",
				isAutomatic: true,
			},
			{
				type: RewardType.ACHIEVEMENT_BADGE,
				value: "expert",
				description: "Unlock expert achievement badge",
				isAutomatic: false,
			},
		],
		challenges: [
			{
				type: ChallengeType.CHALLENGES_SOLVED,
				target: 10,
				description: "Solve 10 coding challenges",
				xpBonus: 300,
				timeLimit: 45,
			},
			{
				type: ChallengeType.LESSONS_COMPLETED,
				target: 25,
				description: "Complete 25 lessons",
				xpBonus: 150,
				timeLimit: 45,
			},
		],
		description: "You've mastered the fundamentals!",
		icon: "🎓",
		color: "#ef4444",
	},
	{
		level: 6,
		name: "Master",
		xpRequired: 1750,
		rewards: [
			{
				type: RewardType.XP_BONUS,
				value: 250,
				description: "Bonus XP for leveling up",
				isAutomatic: true,
			},
			{
				type: RewardType.TITLE,
				value: "Master",
				description: "Earn the Master title",
				isAutomatic: true,
			},
			{
				type: RewardType.SPECIAL_ACCESS,
				value: "beta_features",
				description: "Access to beta features",
				isAutomatic: false,
			},
		],
		challenges: [
			{
				type: ChallengeType.STREAK_MAINTAINED,
				target: 7,
				description: "Maintain a 7-day learning streak",
				xpBonus: 400,
				timeLimit: 60,
			},
		],
		description: "True mastery requires dedication!",
		icon: "👑",
		color: "#f97316",
	},
	{
		level: 7,
		name: "Grandmaster",
		xpRequired: 2750,
		rewards: [
			{
				type: RewardType.STREAK_FREEZE,
				value: 3,
				description: "Get 3 streak freezes",
				isAutomatic: true,
			},
			{
				type: RewardType.AVATAR_FRAME,
				value: "gold",
				description: "Unlock gold avatar frame",
				isAutomatic: false,
			},
		],
		challenges: [
			{
				type: ChallengeType.COURSES_FINISHED,
				target: 3,
				description: "Complete 3 courses",
				xpBonus: 500,
				timeLimit: 90,
			},
			{
				type: ChallengeType.REFERRALS_MADE,
				target: 2,
				description: "Refer 2 friends to join",
				xpBonus: 250,
				timeLimit: 90,
			},
		],
		description: "You are among the elite learners!",
		icon: "🏆",
		color: "#eab308",
	},
	{
		level: 8,
		name: "Legend",
		xpRequired: 4000,
		rewards: [
			{
				type: RewardType.XP_BONUS,
				value: 500,
				description: "Bonus XP for leveling up",
				isAutomatic: true,
			},
			{
				type: RewardType.TITLE,
				value: "Legend",
				description: "Earn the Legend title",
				isAutomatic: true,
			},
		],
		challenges: [
			{
				type: ChallengeType.CHALLENGES_SOLVED,
				target: 25,
				description: "Solve 25 coding challenges",
				xpBonus: 600,
				timeLimit: 120,
			},
		],
		description: "Your legend will inspire others!",
		icon: "⭐",
		color: "#a855f7",
	},
	{
		level: 9,
		name: "Myth",
		xpRequired: 5500,
		rewards: [
			{
				type: RewardType.STREAK_FREEZE,
				value: 5,
				description: "Get 5 streak freezes",
				isAutomatic: true,
			},
			{
				type: RewardType.ACHIEVEMENT_BADGE,
				value: "myth",
				description: "Unlock mythical achievement badge",
				isAutomatic: false,
			},
			{
				type: RewardType.SPECIAL_ACCESS,
				value: "early_access",
				description: "Early access to new features",
				isAutomatic: false,
			},
		],
		challenges: [
			{
				type: ChallengeType.STREAK_MAINTAINED,
				target: 14,
				description: "Maintain a 14-day learning streak",
				xpBonus: 800,
				timeLimit: 150,
			},
			{
				type: ChallengeType.LESSONS_COMPLETED,
				target: 50,
				description: "Complete 50 lessons",
				xpBonus: 400,
				timeLimit: 150,
			},
		],
		description: "You've become the stuff of legends!",
		icon: "🗿",
		color: "#06b6d4",
	},
	{
		level: 10,
		name: "Transcendent",
		xpRequired: 7500,
		rewards: [
			{
				type: RewardType.XP_BONUS,
				value: 1000,
				description: "Bonus XP for reaching the pinnacle",
				isAutomatic: true,
			},
			{
				type: RewardType.TITLE,
				value: "Transcendent",
				description: "Earn the Transcendent title",
				isAutomatic: true,
			},
			{
				type: RewardType.AVATAR_FRAME,
				value: "legendary",
				description: "Unlock legendary avatar frame",
				isAutomatic: false,
			},
			{
				type: RewardType.SPECIAL_ACCESS,
				value: "all_features",
				description: "Access to all platform features",
				isAutomatic: false,
			},
		],
		challenges: [
			{
				type: ChallengeType.COURSES_FINISHED,
				target: 5,
				description: "Complete 5 courses",
				xpBonus: 1000,
				timeLimit: 180,
			},
			{
				type: ChallengeType.CHALLENGES_SOLVED,
				target: 50,
				description: "Solve 50 coding challenges",
				xpBonus: 750,
				timeLimit: 180,
			},
			{
				type: ChallengeType.SOCIAL_SHARES,
				target: 10,
				description: "Share your progress 10 times",
				xpBonus: 200,
				timeLimit: 180,
			},
		],
		description: "You have transcended the boundaries of learning!",
		icon: "✨",
		color: "#ec4899",
	},
];

// Level Progression Engine
export class LevelProgressionEngine {
	private levels: Map<number, Level> = new Map();
	private userLevels: Map<string, UserLevel> = new Map();
	private userChallenges: Map<string, Map<string, UserLevelChallenge>> = new Map();
	private claimedRewards: Map<string, Set<string>> = new Map();

	constructor(levels: Level[] = DEFAULT_LEVELS) {
		// Initialize level configuration
		levels.forEach((level) => {
			this.levels.set(level.level, level);
		});
	}

	// Initialize user level progress
	initializeUser(userId: string, totalXP = 0): UserLevel {
		if (this.userLevels.has(userId)) {
			return this.userLevels.get(userId)!;
		}

		const levelProgress = this.calculateLevelProgress(totalXP);
		const userLevel: UserLevel = {
			userId,
			currentLevel: levelProgress.level,
			totalXP,
			xpToNextLevel: levelProgress.xpToNextLevel,
			levelProgress: levelProgress.progress,
			completedChallenges: [],
			claimedRewards: [],
			levelReachedAt: new Date(),
			lastUpdated: new Date(),
		};

		this.userLevels.set(userId, userLevel);

		// Initialize level challenges for current level
		this.initializeLevelChallenges(userId, levelProgress.level);

		return userLevel;
	}

	// Update user XP and recalculate level
	updateUserXP(
		userId: string,
		newTotalXP: number
	): {
		levelChanged: boolean;
		oldLevel: number;
		newLevel: number;
		rewards: LevelReward[];
		challenges: LevelChallenge[];
	} {
		const userLevel = this.initializeUser(userId, newTotalXP);
		const oldLevel = userLevel.currentLevel;

		const levelProgress = this.calculateLevelProgress(newTotalXP);
		const levelChanged = levelProgress.level > oldLevel;

		// Update user level
		userLevel.currentLevel = levelProgress.level;
		userLevel.totalXP = newTotalXP;
		userLevel.xpToNextLevel = levelProgress.xpToNextLevel;
		userLevel.levelProgress = levelProgress.progress;
		userLevel.lastUpdated = new Date();

		if (levelChanged) {
			userLevel.levelReachedAt = new Date();
			// Initialize challenges for new level
			this.initializeLevelChallenges(userId, levelProgress.level);
		}

		// Get rewards and challenges for the current level
		const currentLevelData = this.levels.get(levelProgress.level);
		const rewards = currentLevelData?.rewards || [];
		const challenges = currentLevelData?.challenges || [];

		return {
			levelChanged,
			oldLevel,
			newLevel: levelProgress.level,
			rewards,
			challenges,
		};
	}

	// Get user level progress
	getUserProgress(userId: string): UserLevel | null {
		return this.userLevels.get(userId) || null;
	}

	// Get level data
	getLevel(level: number): Level | null {
		return this.levels.get(level) || null;
	}

	// Get all levels
	getAllLevels(): Level[] {
		return Array.from(this.levels.values()).sort((a, b) => a.level - b.level);
	}

	// Get level challenges for user
	getUserLevelChallenges(userId: string, level?: number): UserLevelChallenge[] {
		const userChallenges = this.userChallenges.get(userId);
		if (!userChallenges) return [];

		const challenges = Array.from(userChallenges.values());
		if (level !== undefined) {
			return challenges.filter((c) => c.level === level);
		}
		return challenges;
	}

	// Update challenge progress
	updateChallengeProgress(
		userId: string,
		challengeId: string,
		newProgress: number
	): {
		challengeCompleted: boolean;
		xpAwarded: number;
		wasAlreadyCompleted: boolean;
	} {
		const userChallenges = this.userChallenges.get(userId);
		if (!userChallenges)
			return { challengeCompleted: false, xpAwarded: 0, wasAlreadyCompleted: false };

		const challenge = userChallenges.get(challengeId);
		if (!challenge)
			return { challengeCompleted: false, xpAwarded: 0, wasAlreadyCompleted: false };

		const wasAlreadyCompleted = challenge.isCompleted;
		if (wasAlreadyCompleted)
			return { challengeCompleted: false, xpAwarded: 0, wasAlreadyCompleted: true };

		challenge.progress = Math.min(newProgress, challenge.target);
		challenge.isCompleted = challenge.progress >= challenge.target;

		if (challenge.isCompleted && !wasAlreadyCompleted) {
			challenge.completedAt = new Date();
			// xpAwarded already set

			// Add to user's completed challenges
			const userLevel = this.userLevels.get(userId);
			if (userLevel && !userLevel.completedChallenges.includes(challengeId)) {
				userLevel.completedChallenges.push(challengeId);
				userLevel.lastUpdated = new Date();
			}
		}

		return {
			challengeCompleted: challenge.isCompleted,
			xpAwarded: challenge.xpAwarded,
			wasAlreadyCompleted,
		};
	}

	// Claim level reward
	claimReward(
		userId: string,
		level: number,
		rewardId: string
	): {
		success: boolean;
		reward?: LevelReward;
		message: string;
	} {
		const userLevel = this.userLevels.get(userId);
		if (!userLevel) {
			return { success: false, message: "User level not found" };
		}

		if (userLevel.currentLevel < level) {
			return { success: false, message: "Level not reached yet" };
		}

		const levelData = this.levels.get(level);
		if (!levelData) {
			return { success: false, message: "Level data not found" };
		}

		const reward = levelData.rewards.find((r) => `${level}-${r.type}-${r.value}` === rewardId);
		if (!reward) {
			return { success: false, message: "Reward not found" };
		}

		if (reward.isAutomatic) {
			return { success: false, message: "Reward is automatically granted" };
		}

		// Check if already claimed
		const claimedRewards = this.claimedRewards.get(userId) || new Set();
		if (claimedRewards.has(rewardId)) {
			return { success: false, message: "Reward already claimed" };
		}

		// Mark as claimed
		claimedRewards.add(rewardId);
		this.claimedRewards.set(userId, claimedRewards);

		// Add to user's claimed rewards
		if (!userLevel.claimedRewards.includes(rewardId)) {
			userLevel.claimedRewards.push(rewardId);
			userLevel.lastUpdated = new Date();
		}

		return {
			success: true,
			reward,
			message: "Reward claimed successfully",
		};
	}

	// Get available rewards for user
	getAvailableRewards(userId: string): LevelReward[] {
		const userLevel = this.userLevels.get(userId);
		if (!userLevel) return [];

		const claimedRewards = this.claimedRewards.get(userId) || new Set();
		const rewards: LevelReward[] = [];

		// Get rewards from current level
		const currentLevelData = this.levels.get(userLevel.currentLevel);
		if (currentLevelData) {
			currentLevelData.rewards.forEach((reward) => {
				const rewardId = `${userLevel.currentLevel}-${reward.type}-${reward.value}`;
				if (!reward.isAutomatic && !claimedRewards.has(rewardId)) {
					rewards.push(reward);
				}
			});
		}

		return rewards;
	}

	// Calculate level progress from XP
	private calculateLevelProgress(totalXP: number): {
		level: number;
		xpToNextLevel: number;
		progress: number;
	} {
		let currentLevel = 1;

		// Find current level
		for (const level of this.levels.values()) {
			if (totalXP >= level.xpRequired) {
				currentLevel = level.level;
			} else {
				break;
			}
		}

		// Calculate progress to next level
		const currentLevelData = this.levels.get(currentLevel);
		const nextLevelData = this.levels.get(currentLevel + 1);

		let progress = 100; // Max level reached
		let xpToNext = 0;

		if (nextLevelData) {
			const currentLevelXP = currentLevelData?.xpRequired || 0;
			const nextLevelXP = nextLevelData.xpRequired;
			const xpInThisLevel = totalXP - currentLevelXP;
			const xpNeededForNext = nextLevelXP - currentLevelXP;

			progress = xpNeededForNext > 0 ? (xpInThisLevel / xpNeededForNext) * 100 : 100;
			xpToNext = Math.max(0, nextLevelXP - totalXP);
		}

		return {
			level: currentLevel,
			xpToNextLevel: xpToNext,
			progress: Math.min(progress, 100),
		};
	}

	// Initialize level challenges for user
	private initializeLevelChallenges(userId: string, level: number): void {
		const levelData = this.levels.get(level);
		if (!levelData) return;

		const userChallenges = this.userChallenges.get(userId) || new Map();

		levelData.challenges.forEach((challenge) => {
			const challengeId = `${level}-${challenge.type}-${challenge.target}`;
			if (!userChallenges.has(challengeId)) {
				const userChallenge: UserLevelChallenge = {
					userId,
					challengeId,
					challenge,
					level,
					progress: 0,
					target: challenge.target,
					isCompleted: false,
					xpAwarded: challenge.xpBonus,
					...(challenge.timeLimit !== undefined && {
						expiresAt: new Date(Date.now() + challenge.timeLimit * 24 * 60 * 60 * 1000),
					}),
				};
				userChallenges.set(challengeId, userChallenge);
			}
		});

		this.userChallenges.set(userId, userChallenges);
	}

	// Get level statistics
	getLevelStats(): {
		totalLevels: number;
		totalUsers: number;
		averageLevel: number;
		levelDistribution: Record<number, number>;
		mostPopularLevel: number;
		completionRates: Record<number, number>;
	} {
		const totalUsers = this.userLevels.size;
		const levelCounts: Record<number, number> = {};
		let totalLevelSum = 0;

		this.userLevels.forEach((userLevel) => {
			levelCounts[userLevel.currentLevel] = (levelCounts[userLevel.currentLevel] || 0) + 1;
			totalLevelSum += userLevel.currentLevel;
		});

		const averageLevel = totalUsers > 0 ? totalLevelSum / totalUsers : 0;
		const mostPopularLevel = Object.entries(levelCounts).reduce(
			(max, [level, count]) =>
				count > max.count ? { level: parseInt(level, 10), count } : max,
			{ level: 1, count: 0 }
		).level;

		const completionRates: Record<number, number> = {};
		this.levels.forEach((level) => {
			const usersAtLevel = levelCounts[level.level] || 0;
			const usersCompletedLevel = Array.from(this.userLevels.values()).filter(
				(ul) => ul.currentLevel > level.level
			).length;
			completionRates[level.level] =
				usersAtLevel > 0 ? (usersCompletedLevel / usersAtLevel) * 100 : 0;
		});

		return {
			totalLevels: this.levels.size,
			totalUsers,
			averageLevel,
			levelDistribution: levelCounts,
			mostPopularLevel,
			completionRates,
		};
	}

	// Add new level
	addLevel(level: Level): void {
		this.levels.set(level.level, level);
	}

	// Update existing level
	updateLevel(levelNumber: number, updates: Partial<Level>): void {
		const existing = this.levels.get(levelNumber);
		if (existing) {
			this.levels.set(levelNumber, { ...existing, ...updates });
		}
	}

	// Get level by XP
	getLevelByXP(totalXP: number): Level | null {
		const progress = this.calculateLevelProgress(totalXP);
		return this.levels.get(progress.level) || null;
	}
}

// Level Analytics Types
export interface LevelAnalytics {
	globalStats: {
		totalUsers: number;
		averageLevel: number;
		totalLevels: number;
		levelDistribution: Record<number, number>;
		completionRates: Record<number, number>;
	};
	userStats: Array<{
		userId: string;
		currentLevel: number;
		timeToLevel: number[];
		challengesCompleted: number;
		rewardsClaimed: number;
		levelEfficiency: number;
	}>;
	challengeStats: {
		totalChallenges: number;
		completionRate: number;
		averageTimeToComplete: number;
		mostPopularChallenge: string;
	};
	rewardStats: {
		totalRewards: number;
		claimRate: number;
		mostPopularReward: RewardType;
	};
}
