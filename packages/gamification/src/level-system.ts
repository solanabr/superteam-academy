import { levelFromXP } from "./xp-calculation";

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

export enum RewardType {
	XP_BONUS = "xp_bonus",
	STREAK_FREEZE = "streak_freeze",
	ACHIEVEMENT_BADGE = "achievement_badge",
	TITLE = "title",
	AVATAR_FRAME = "avatar_frame",
	SPECIAL_ACCESS = "special_access",
	DISCOUNT = "discount",
}

export enum ChallengeType {
	LESSONS_COMPLETED = "lessons_completed",
	CHALLENGES_SOLVED = "challenges_solved",
	STREAK_MAINTAINED = "streak_maintained",
	COURSES_FINISHED = "courses_finished",
	REFERRALS_MADE = "referrals_made",
	SOCIAL_SHARES = "social_shares",
	TIME_SPENT = "time_spent",
}

export interface LevelReward {
	type: RewardType;
	value: number | string;
	description: string;
	isAutomatic: boolean; // true if granted automatically, false if user must claim
}

export interface LevelChallenge {
	type: ChallengeType;
	target: number;
	description: string;
	xpBonus: number;
	timeLimit?: number; // days to complete
}

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

export interface LevelRewardClaim {
	userId: string;
	level: number;
	rewardId: string;
	claimedAt: Date;
	rewardType: RewardType;
	rewardValue: number | string;
}

export const DEFAULT_LEVELS: Level[] = [
	{
		level: 1,
		name: "Novice",
		xpRequired: 100, // 1² × 100
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
		xpRequired: 400, // 2² × 100
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
		xpRequired: 900, // 3² × 100
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
		xpRequired: 1600, // 4² × 100
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
		xpRequired: 2500, // 5² × 100
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
		xpRequired: 3600, // 6² × 100
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
		xpRequired: 4900, // 7² × 100
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
		xpRequired: 6400, // 8² × 100
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
		xpRequired: 8100, // 9² × 100
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
		xpRequired: 10_000, // 10² × 100
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

export class LevelProgressionEngine {
	private levels: Map<number, Level> = new Map();
	private userLevels: Map<string, UserLevel> = new Map();
	private userChallenges: Map<string, Map<string, UserLevelChallenge>> = new Map();
	private claimedRewards: Map<string, Set<string>> = new Map();

	constructor(levels: Level[] = DEFAULT_LEVELS) {
		levels.forEach((level) => {
			this.levels.set(level.level, level);
		});
	}

	initializeUser(userId: string, totalXP = 0): UserLevel {
		if (this.userLevels.has(userId)) {
			return this.userLevels.get(userId) as UserLevel;
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

		this.initializeLevelChallenges(userId, levelProgress.level);

		return userLevel;
	}

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

		userLevel.currentLevel = levelProgress.level;
		userLevel.totalXP = newTotalXP;
		userLevel.xpToNextLevel = levelProgress.xpToNextLevel;
		userLevel.levelProgress = levelProgress.progress;
		userLevel.lastUpdated = new Date();

		if (levelChanged) {
			userLevel.levelReachedAt = new Date();
			this.initializeLevelChallenges(userId, levelProgress.level);
		}

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

	getUserProgress(userId: string): UserLevel | null {
		return this.userLevels.get(userId) || null;
	}

	getLevel(level: number): Level | null {
		return this.levels.get(level) || null;
	}

	getAllLevels(): Level[] {
		return Array.from(this.levels.values()).sort((a, b) => a.level - b.level);
	}

	getUserLevelChallenges(userId: string, level?: number): UserLevelChallenge[] {
		const userChallenges = this.userChallenges.get(userId);
		if (!userChallenges) return [];

		const challenges = Array.from(userChallenges.values());
		if (level !== undefined) {
			return challenges.filter((c) => c.level === level);
		}
		return challenges;
	}

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

		const claimedRewards = this.claimedRewards.get(userId) || new Set();
		if (claimedRewards.has(rewardId)) {
			return { success: false, message: "Reward already claimed" };
		}

		claimedRewards.add(rewardId);
		this.claimedRewards.set(userId, claimedRewards);

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

	getAvailableRewards(userId: string): LevelReward[] {
		const userLevel = this.userLevels.get(userId);
		if (!userLevel) return [];

		const claimedRewards = this.claimedRewards.get(userId) || new Set();
		const rewards: LevelReward[] = [];

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

	private calculateLevelProgress(totalXP: number): {
		level: number;
		xpToNextLevel: number;
		progress: number;
	} {
		const level = levelFromXP(totalXP);
		const currentLevelXP = level * level * 100;
		const nextLevelXP = (level + 1) * (level + 1) * 100;
		const xpToNext = Math.max(0, nextLevelXP - totalXP);
		const xpNeeded = nextLevelXP - currentLevelXP;
		const progress = xpNeeded > 0 ? ((totalXP - currentLevelXP) / xpNeeded) * 100 : 100;

		return {
			level,
			xpToNextLevel: xpToNext,
			progress: Math.min(progress, 100),
		};
	}

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

	addLevel(level: Level): void {
		this.levels.set(level.level, level);
	}

	updateLevel(levelNumber: number, updates: Partial<Level>): void {
		const existing = this.levels.get(levelNumber);
		if (existing) {
			this.levels.set(levelNumber, { ...existing, ...updates });
		}
	}

	getLevelByXP(totalXP: number): Level | null {
		const progress = this.calculateLevelProgress(totalXP);
		return this.levels.get(progress.level) || null;
	}
}

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
