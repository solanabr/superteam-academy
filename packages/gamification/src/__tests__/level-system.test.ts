import { describe, it, expect, beforeEach } from "@jest/globals";
import { type LevelSystem, createLevelSystem } from "../src";

describe("Level System Integration", () => {
	let levelSystem: LevelSystem;

	beforeEach(() => {
		levelSystem = createLevelSystem();
	});

	describe("User Initialization and Progression", () => {
		it("should initialize a new user at level 1", () => {
			const userId = "user1";
			const userLevel = levelSystem.initializeUser(userId);

			expect(userLevel.userId).toBe(userId);
			expect(userLevel.currentLevel).toBe(1);
			expect(userLevel.totalXP).toBe(0);
			expect(userLevel.xpToNextLevel).toBe(100);
			expect(userLevel.levelProgress).toBe(0);
		});

		it("should correctly calculate level based on XP", () => {
			const userId = "user2";

			// Level 1: 0-99 XP
			levelSystem.initializeUser(userId, 50);
			let progress = levelSystem.getUserProgress(userId);
			expect(progress?.currentLevel).toBe(1);
			expect(progress?.xpToNextLevel).toBe(50);

			// Level 2: 100-249 XP
			levelSystem.updateUserXP(userId, 150);
			progress = levelSystem.getUserProgress(userId);
			expect(progress?.currentLevel).toBe(2);
			expect(progress?.xpToNextLevel).toBe(100);
		});

		it("should handle level ups correctly", () => {
			const userId = "user3";
			levelSystem.initializeUser(userId, 90); // Just before level 2

			const result = levelSystem.updateUserXP(userId, 110); // Cross into level 2

			expect(result.levelChanged).toBe(true);
			expect(result.oldLevel).toBe(1);
			expect(result.newLevel).toBe(2);
			expect(result.rewards).toHaveLength(2); // XP bonus + title
			expect(result.challenges).toHaveLength(2); // Two challenges for level 2
		});
	});

	describe("Challenge System", () => {
		it("should track lesson completion challenges", () => {
			const userId = "user4";
			levelSystem.initializeUser(userId);

			// Complete 3 lessons
			levelSystem.lessonCompleted(userId);
			levelSystem.lessonCompleted(userId);
			const result = levelSystem.lessonCompleted(userId);

			expect(result).toHaveLength(1);
			expect(result[0].wasCompleted).toBe(true);
			expect(result[0].xpAwarded).toBe(25);
		});

		it("should handle streak maintenance challenges", () => {
			const userId = "user5";
			levelSystem.initializeUser(userId);

			// Reach level 3 first (required for streak challenge)
			levelSystem.updateUserXP(userId, 250);

			const result = levelSystem.streakMaintained(userId, 3);
			expect(result).toHaveLength(1);
			expect(result[0].wasCompleted).toBe(true);
		});

		it("should provide active challenges", () => {
			const userId = "user6";
			levelSystem.initializeUser(userId);

			const activeChallenges = levelSystem.getActiveChallenges(userId);
			expect(activeChallenges.length).toBeGreaterThan(0);

			activeChallenges.forEach((challenge) => {
				expect(challenge.progress).toBe(0);
				expect(challenge.progressPercent).toBe(0);
			});
		});

		it("should provide challenge recommendations", () => {
			const userId = "user7";
			levelSystem.initializeUser(userId);

			const recommendations = levelSystem.getRecommendedChallenges(userId, 2);
			expect(recommendations.length).toBeLessThanOrEqual(2);

			recommendations.forEach((rec) => {
				expect(rec.priority).toBeDefined();
				expect(rec.reason).toBeDefined();
			});
		});
	});

	describe("Reward System", () => {
		it("should grant automatic rewards on level up", () => {
			const userId = "user8";
			levelSystem.initializeUser(userId, 90);

			levelSystem.updateUserXP(userId, 110); // Level up to 2

			const availableRewards = levelSystem.getAvailableRewards(userId);
			// Should have manual rewards available (avatar frame)
			expect(availableRewards.length).toBeGreaterThan(0);
		});

		it("should allow claiming manual rewards", () => {
			const userId = "user9";
			levelSystem.initializeUser(userId, 90);

			levelSystem.updateUserXP(userId, 110); // Level up to 2

			const availableRewards = levelSystem.getAvailableRewards(userId);
			expect(availableRewards.length).toBeGreaterThan(0);

			const reward = availableRewards[0];
			const rewardId = `2-${reward.type}-${reward.value}`;

			const claimResult = levelSystem.claimReward(userId, 2, rewardId);
			expect(claimResult.success).toBe(true);

			// Should not be available anymore
			const availableAfterClaim = levelSystem.getAvailableRewards(userId);
			expect(availableAfterClaim.length).toBe(availableRewards.length - 1);
		});
	});

	describe("Notification System", () => {
		it("should create level up notifications", () => {
			const userId = "user10";
			levelSystem.initializeUser(userId, 90);

			levelSystem.updateUserXP(userId, 110); // Level up

			const notifications = levelSystem.getUserNotifications(userId);
			expect(notifications.length).toBeGreaterThan(0);

			const levelUpNotification = notifications.find((n) => n.type === "level_up");
			expect(levelUpNotification).toBeDefined();
			expect(levelUpNotification?.priority).toBe("high");
		});

		it("should create challenge completion notifications", () => {
			const userId = "user11";
			levelSystem.initializeUser(userId);

			// Complete first lesson challenge
			levelSystem.lessonCompleted(userId);

			const notifications = levelSystem.getUserNotifications(userId);
			const challengeNotification = notifications.find(
				(n) => n.type === "challenge_completed"
			);
			expect(challengeNotification).toBeDefined();
		});

		it("should handle notification management", () => {
			const userId = "user12";
			levelSystem.initializeUser(userId, 90);

			levelSystem.updateUserXP(userId, 110); // Creates notifications

			const notifications = levelSystem.getUserNotifications(userId);
			expect(notifications.length).toBeGreaterThan(0);

			const unreadCount = notifications.filter((n) => !n.read).length;
			expect(unreadCount).toBe(notifications.length);

			// Mark first notification as read
			levelSystem.markNotificationAsRead(userId, notifications[0].id);

			const updatedNotifications = levelSystem.getUserNotifications(userId);
			const newUnreadCount = updatedNotifications.filter((n) => !n.read).length;
			expect(newUnreadCount).toBe(unreadCount - 1);
		});
	});

	describe("Analytics", () => {
		it("should provide user analytics", () => {
			const userId = "user13";
			levelSystem.initializeUser(userId, 200); // Level 2

			const analytics = levelSystem.getUserAnalytics(userId);
			expect(analytics).toBeDefined();
			expect(analytics?.currentLevel).toBe(2);
			expect(analytics?.challengesCompleted).toBeDefined();
			expect(analytics?.levelEfficiency).toBeDefined();
		});

		it("should generate progression reports", () => {
			const userId = "user14";
			levelSystem.initializeUser(userId, 150);

			const report = levelSystem.generateProgressionReport(userId);
			expect(report).toBeDefined();
			expect(report?.currentLevel).toBe(2);
			expect(report?.recommendations).toBeDefined();
			expect(Array.isArray(report?.recommendations)).toBe(true);
		});

		it("should provide level insights", () => {
			// Add some test data
			levelSystem.initializeUser("user15", 1000); // High level user
			levelSystem.initializeUser("user16", 100); // Low level user

			const insights = levelSystem.getLevelInsights();
			expect(insights).toBeDefined();
			expect(insights.userEngagement).toBeDefined();
			expect(typeof insights.userEngagement.disengaged).toBe("number");
		});
	});

	describe("System Configuration", () => {
		it("should work with custom levels", () => {
			const customLevels = [
				{
					level: 1,
					name: "Custom Novice",
					xpRequired: 0,
					rewards: [],
					challenges: [],
					description: "Custom level",
					icon: "🌟",
					color: "#ff0000",
				},
			];

			const customSystem = createLevelSystem({ customLevels });
			const userLevel = customSystem.initializeUser("custom-user");

			expect(userLevel.currentLevel).toBe(1);
			const levelData = customSystem.getLevel(1);
			expect(levelData?.name).toBe("Custom Novice");
		});

		it("should provide level statistics", () => {
			levelSystem.initializeUser("stats-user1", 100);
			levelSystem.initializeUser("stats-user2", 500);
			levelSystem.initializeUser("stats-user3", 1000);

			const stats = levelSystem.getLevelStats();
			expect(stats.totalUsers).toBe(3);
			expect(stats.averageLevel).toBeDefined();
			expect(stats.levelDistribution).toBeDefined();
		});
	});

	describe("Data Export/Import", () => {
		it("should export system data", () => {
			levelSystem.initializeUser("export-user", 200);

			const exportData = levelSystem.exportSystemData();
			expect(exportData).toBeDefined();
			expect(exportData.progression).toBeDefined();
			expect(exportData.analytics).toBeDefined();
			expect(exportData.notifications).toBeDefined();
			expect(exportData.challenges).toBeDefined();
		});
	});

	describe("Edge Cases", () => {
		it("should handle users with very high XP", () => {
			const userId = "high-xp-user";
			const highXP = 10_000; // Beyond max level

			const userLevel = levelSystem.initializeUser(userId, highXP);
			expect(userLevel.currentLevel).toBe(10); // Max level
			expect(userLevel.xpToNextLevel).toBe(0); // No more levels
		});

		it("should handle invalid user IDs gracefully", () => {
			const progress = levelSystem.getUserProgress("nonexistent-user");
			expect(progress).toBeNull();
		});

		it("should handle duplicate user initialization", () => {
			const userId = "duplicate-user";
			const firstInit = levelSystem.initializeUser(userId, 100);
			const secondInit = levelSystem.initializeUser(userId, 200);

			expect(firstInit.totalXP).toBe(100);
			expect(secondInit.totalXP).toBe(200); // Should update existing user
		});

		it("should handle challenge progress correctly", () => {
			const userId = "challenge-user";
			levelSystem.initializeUser(userId);

			// Complete more lessons than needed for challenge
			for (let i = 0; i < 10; i++) {
				levelSystem.lessonCompleted(userId);
			}

			const activeChallenges = levelSystem.getActiveChallenges(userId);
			const lessonChallenge = activeChallenges.find(
				(c) => c.challenge.type === "lessons_completed" && c.challenge.target === 1
			);

			expect(lessonChallenge).toBeUndefined(); // Should be completed and not in active list
		});
	});
});
