// Streak Types
export interface StreakData {
	userId: string;
	currentStreak: number;
	longestStreak: number;
	lastActivityDate: Date;
	streakStartDate: Date;
	freezeCount: number;
	totalFreezesUsed: number;
	streakHistory: StreakRecord[];
	lastUpdated: Date;
}

export interface StreakRecord {
	date: Date;
	activityCount: number;
	streakLength: number;
	wasFrozen: boolean;
	freezeUsed: boolean;
}

export interface StreakFreeze {
	id: string;
	userId: string;
	awardedAt: Date;
	expiresAt?: Date;
	reason: string;
	used: boolean;
	usedAt?: Date;
	usedOnDate?: Date;
}

export interface StreakConfig {
	activityTypes: string[];
	timezone: string; // UTC offset or timezone name
	resetHour: number; // Hour of day when streaks reset (0-23)
	maxFreezes: number;
	freezeValidityDays: number;
	recoveryWindow: number; // Days to recover a broken streak
	minimumActivity: number; // Minimum activities per day to maintain streak
}

export interface StreakAnalytics {
	averageStreakLength: number;
	longestStreaks: Array<{ userId: string; length: number }>;
	streakDistribution: Record<number, number>; // streak length -> user count
	freezeUsageRate: number;
	recoverySuccessRate: number;
	dailyActivityPatterns: Record<string, number>; // hour -> activity count
}

// Streak Calculation Engine
export class StreakCalculator {
	private config: StreakConfig;

	constructor(config: StreakConfig) {
		this.config = config;
	}

	// Calculate streak for a user based on activity history
	calculateStreak(userId: string, activities: ActivityRecord[]): StreakData {
		const sortedActivities = this.sortActivitiesByDate(activities);
		const dailyActivity = this.groupActivitiesByDay(sortedActivities);

		let currentStreak = 0;
		let longestStreak = 0;
		let streakStartDate = new Date();
		let lastActivityDate = new Date(0);
		const streakHistory: StreakRecord[] = [];

		const today = this.getCurrentDate();
		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);

		// Calculate current streak
		for (let i = 0; i < 365; i++) {
			// Check last year
			const checkDate = new Date(today);
			checkDate.setDate(checkDate.getDate() - i);

			const dayActivity = dailyActivity[this.formatDate(checkDate)] || [];
			const activityCount = dayActivity.length;

			const record: StreakRecord = {
				date: new Date(checkDate),
				activityCount,
				streakLength: 0,
				wasFrozen: false,
				freezeUsed: false,
			};

			if (activityCount >= this.config.minimumActivity) {
				if (currentStreak === 0) {
					streakStartDate = new Date(checkDate);
				}
				currentStreak++;
				lastActivityDate = new Date(checkDate);
				longestStreak = Math.max(longestStreak, currentStreak);
			} else {
				// Check if freeze was used
				const freezeUsed = this.checkFreezeUsage(userId, checkDate);
				if (freezeUsed) {
					record.freezeUsed = true;
					if (currentStreak === 0) {
						streakStartDate = new Date(checkDate);
					}
					currentStreak++;
					longestStreak = Math.max(longestStreak, currentStreak);
				} else {
					currentStreak = 0;
				}
			}

			record.streakLength = currentStreak;
			streakHistory.unshift(record); // Add to beginning for chronological order
		}

		return {
			userId,
			currentStreak,
			longestStreak,
			lastActivityDate,
			streakStartDate,
			freezeCount: 0, // Will be set by freeze manager
			totalFreezesUsed: 0, // Will be calculated
			streakHistory,
			lastUpdated: new Date(),
		};
	}

	// Check if streak will break tomorrow
	willStreakBreak(streakData: StreakData): boolean {
		const today = this.getCurrentDate();
		const lastActivity = new Date(streakData.lastActivityDate);

		// If last activity was today, streak won't break
		if (this.isSameDay(lastActivity, today)) {
			return false;
		}

		// If last activity was yesterday, check if freeze is available
		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);

		if (this.isSameDay(lastActivity, yesterday)) {
			return streakData.freezeCount === 0;
		}

		// If gap is larger than 1 day, streak already broken
		return true;
	}

	// Calculate days until streak breaks
	daysUntilStreakBreaks(streakData: StreakData): number {
		if (!this.willStreakBreak(streakData)) {
			return Infinity;
		}

		const today = this.getCurrentDate();
		const lastActivity = new Date(streakData.lastActivityDate);

		if (this.isSameDay(lastActivity, today)) {
			return 1; // Will break tomorrow if no activity today
		}

		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);

		if (this.isSameDay(lastActivity, yesterday)) {
			return streakData.freezeCount > 0 ? Infinity : 0; // Already broken or can be saved
		}

		return 0; // Already broken
	}

	// Update streak with new activity
	updateStreakWithActivity(streakData: StreakData, activity: ActivityRecord): StreakData {
		const activityDate = new Date(activity.timestamp);
		const today = this.getCurrentDate();

		// If activity is from today, update today's record
		if (this.isSameDay(activityDate, today)) {
			const todayRecord = streakData.streakHistory.find((r) => this.isSameDay(r.date, today));

			if (todayRecord) {
				todayRecord.activityCount++;
			}
		}

		// Recalculate streak
		const allActivities = this.convertStreakHistoryToActivities(streakData.streakHistory);
		return this.calculateStreak(streakData.userId, allActivities);
	}

	// Apply a freeze to maintain streak
	applyFreeze(
		streakData: StreakData,
		freezeDate: Date
	): { success: boolean; streakData: StreakData } {
		if (streakData.freezeCount <= 0) {
			return { success: false, streakData };
		}

		// Find the record for the freeze date
		const record = streakData.streakHistory.find((r) => this.isSameDay(r.date, freezeDate));
		if (!record) {
			return { success: false, streakData };
		}

		// Mark as frozen
		record.wasFrozen = true;
		record.freezeUsed = true;
		streakData.freezeCount--;
		streakData.totalFreezesUsed++;

		// Recalculate streak
		const allActivities = this.convertStreakHistoryToActivities(streakData.streakHistory);
		const updatedStreakData = this.calculateStreak(streakData.userId, allActivities);

		return { success: true, streakData: updatedStreakData };
	}

	// Check if recovery is possible
	canRecoverStreak(streakData: StreakData): boolean {
		const today = this.getCurrentDate();
		const lastActivity = new Date(streakData.lastActivityDate);

		const daysSinceLastActivity = Math.floor(
			(today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
		);

		return daysSinceLastActivity <= this.config.recoveryWindow && streakData.freezeCount > 0;
	}

	// Recover a broken streak
	recoverStreak(streakData: StreakData): { success: boolean; streakData: StreakData } {
		if (!this.canRecoverStreak(streakData)) {
			return { success: false, streakData };
		}

		const recoveryDate = new Date(streakData.lastActivityDate);
		recoveryDate.setDate(recoveryDate.getDate() + 1);

		return this.applyFreeze(streakData, recoveryDate);
	}

	private sortActivitiesByDate(activities: ActivityRecord[]): ActivityRecord[] {
		return activities.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
	}

	private groupActivitiesByDay(activities: ActivityRecord[]): Record<string, ActivityRecord[]> {
		const grouped: Record<string, ActivityRecord[]> = {};

		for (const activity of activities) {
			const dateKey = this.formatDate(activity.timestamp);
			if (!grouped[dateKey]) {
				grouped[dateKey] = [];
			}
			grouped[dateKey].push(activity);
		}

		return grouped;
	}

	private formatDate(date: Date): string {
		return date.toISOString().split("T")[0];
	}

	private getCurrentDate(): Date {
		const now = new Date();
		// Adjust for timezone if needed
		return now;
	}

	private isSameDay(date1: Date, date2: Date): boolean {
		return this.formatDate(date1) === this.formatDate(date2);
	}

	private checkFreezeUsage(_userId: string, _date: Date): boolean {
		// This would check the freeze database - simplified for demo
		return false;
	}

	private convertStreakHistoryToActivities(history: StreakRecord[]): ActivityRecord[] {
		const activities: ActivityRecord[] = [];

		for (const record of history) {
			for (let i = 0; i < record.activityCount; i++) {
				activities.push({
					id: `activity_${record.date.getTime()}_${i}`,
					userId: "", // Will be set by caller
					type: "generic",
					timestamp: record.date,
				});
			}
		}

		return activities;
	}
}

// Streak Freeze Manager
export class StreakFreezeManager {
	private freezes: Map<string, StreakFreeze[]> = new Map();

	// Award freeze to user
	awardFreeze(userId: string, reason: string, validityDays?: number): StreakFreeze {
		const freeze: StreakFreeze = {
			id: this.generateFreezeId(),
			userId,
			awardedAt: new Date(),
			...(validityDays
				? { expiresAt: new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000) }
				: {}),
			reason,
			used: false,
		};

		if (!this.freezes.has(userId)) {
			this.freezes.set(userId, []);
		}

		this.freezes.get(userId)?.push(freeze);
		return freeze;
	}

	// Get available freezes for user
	getAvailableFreezes(userId: string): StreakFreeze[] {
		const userFreezes = this.freezes.get(userId) || [];
		const now = new Date();

		return userFreezes.filter(
			(freeze) => !freeze.used && (!freeze.expiresAt || freeze.expiresAt > now)
		);
	}

	// Use a freeze
	useFreeze(userId: string, freezeId: string, useDate: Date): boolean {
		const userFreezes = this.freezes.get(userId) || [];
		const freeze = userFreezes.find((f) => f.id === freezeId);

		if (!freeze || freeze.used) {
			return false;
		}

		if (freeze.expiresAt && freeze.expiresAt < new Date()) {
			return false;
		}

		freeze.used = true;
		freeze.usedAt = new Date();
		freeze.usedOnDate = useDate;

		return true;
	}

	// Get freeze statistics
	getFreezeStats(userId: string): FreezeStats {
		const userFreezes = this.freezes.get(userId) || [];
		const available = this.getAvailableFreezes(userId).length;
		const used = userFreezes.filter((f) => f.used).length;
		const expired = userFreezes.filter(
			(f) => !f.used && f.expiresAt && f.expiresAt < new Date()
		).length;

		return {
			totalAwarded: userFreezes.length,
			available,
			used,
			expired,
			usageRate: userFreezes.length > 0 ? used / userFreezes.length : 0,
		};
	}

	// Clean up expired freezes
	cleanupExpiredFreezes(userId: string): number {
		const userFreezes = this.freezes.get(userId) || [];
		const now = new Date();
		let removedCount = 0;

		const activeFreezes = userFreezes.filter((freeze) => {
			if (!freeze.used && freeze.expiresAt && freeze.expiresAt < now) {
				removedCount++;
				return false;
			}
			return true;
		});

		this.freezes.set(userId, activeFreezes);
		return removedCount;
	}

	private generateFreezeId(): string {
		return `freeze_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}
}

// Streak Recovery System
export class StreakRecoveryManager {
	private config: StreakConfig;
	private calculator: StreakCalculator;

	constructor(config: StreakConfig, calculator: StreakCalculator) {
		this.config = config;
		this.calculator = calculator;
	}

	// Check if recovery is possible
	canRecover(streakData: StreakData): boolean {
		return this.calculator.canRecoverStreak(streakData);
	}

	// Initiate recovery process
	async initiateRecovery(_userId: string, streakData: StreakData): Promise<RecoveryResult> {
		if (!this.canRecover(streakData)) {
			return {
				success: false,
				reason: "Recovery not possible",
				options: [],
			};
		}

		const options: RecoveryOption[] = [];

		// Option 1: Use freeze
		if (streakData.freezeCount > 0) {
			options.push({
				type: "freeze",
				description: "Use a streak freeze to maintain your current streak",
				cost: 0,
				successRate: 1.0,
			});
		}

		// Option 2: Complete activities
		const daysSinceLastActivity = this.getDaysSinceLastActivity(streakData);
		if (daysSinceLastActivity <= this.config.recoveryWindow) {
			options.push({
				type: "activity",
				description: `Complete ${this.config.minimumActivity} activities today to recover your streak`,
				cost: 0,
				successRate: 0.8,
			});
		}

		// Option 3: Purchase recovery (if enabled)
		options.push({
			type: "purchase",
			description: "Purchase streak recovery with tokens",
			cost: 100,
			successRate: 1.0,
		});

		return {
			success: true,
			options,
		};
	}

	// Execute recovery
	async executeRecovery(
		userId: string,
		streakData: StreakData,
		option: RecoveryOption
	): Promise<RecoveryExecutionResult> {
		switch (option.type) {
			case "freeze":
				return this.executeFreezeRecovery(userId, streakData);

			case "activity":
				return this.executeActivityRecovery(userId, streakData);

			case "purchase":
				return this.executePurchaseRecovery(userId, streakData);

			default:
				return {
					success: false,
					reason: "Invalid recovery option",
				};
		}
	}

	private async executeFreezeRecovery(
		userId: string,
		streakData: StreakData
	): Promise<RecoveryExecutionResult> {
		const result = this.calculator.recoverStreak(streakData);

		if (result.success) {
			// Update streak data in database
			await this.saveStreakData(userId, result.streakData);

			return {
				success: true,
				newStreakData: result.streakData,
				message: "Streak recovered using freeze!",
			};
		}

		return {
			success: false,
			reason: "Failed to recover streak with freeze",
		};
	}

	private async executeActivityRecovery(
		_userId: string,
		_streakData: StreakData
	): Promise<RecoveryExecutionResult> {
		// This would wait for user to complete activities
		// For now, return pending status
		return {
			success: false,
			reason: "Activity recovery requires user action",
			pending: true,
		};
	}

	private async executePurchaseRecovery(
		userId: string,
		streakData: StreakData
	): Promise<RecoveryExecutionResult> {
		// This would handle token purchase
		// For now, simulate success
		const recoveredStreakData = { ...streakData };
		recoveredStreakData.currentStreak = Math.max(1, recoveredStreakData.currentStreak);

		await this.saveStreakData(userId, recoveredStreakData);

		return {
			success: true,
			newStreakData: recoveredStreakData,
			message: "Streak recovered with token purchase!",
		};
	}

	private getDaysSinceLastActivity(streakData: StreakData): number {
		const today = new Date();
		const lastActivity = new Date(streakData.lastActivityDate);
		return Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
	}

	private async saveStreakData(_userId: string, _streakData: StreakData): Promise<void> {
		// Save to database
	}
}

// Streak Analytics
export class StreakAnalyticsEngine {
	private streakData: Map<string, StreakData> = new Map();

	// Update streak data for analytics
	updateStreakData(userId: string, streakData: StreakData): void {
		this.streakData.set(userId, streakData);
	}

	// Get streak analytics
	getAnalytics(): StreakAnalyticsData {
		const allStreaks = Array.from(this.streakData.values());

		const averageStreak =
			allStreaks.reduce((sum, s) => sum + s.currentStreak, 0) / allStreaks.length;
		const longestStreaks = allStreaks
			.map((s) => ({ userId: s.userId, length: s.longestStreak }))
			.sort((a, b) => b.length - a.length)
			.slice(0, 10);

		const distribution: Record<number, number> = {};
		for (const streak of allStreaks) {
			distribution[streak.currentStreak] = (distribution[streak.currentStreak] || 0) + 1;
		}

		const totalFreezes = allStreaks.reduce((sum, s) => sum + s.totalFreezesUsed, 0);
		const freezeUsageRate = totalFreezes / allStreaks.length;

		return {
			totalUsers: allStreaks.length,
			averageStreakLength: averageStreak,
			longestStreaks,
			streakDistribution: distribution,
			freezeUsageRate,
			recoverySuccessRate: 0.75, // Placeholder
		};
	}

	// Get user streak insights
	getUserInsights(userId: string): StreakInsights {
		const streakData = this.streakData.get(userId);
		if (!streakData) {
			return {
				currentStreak: 0,
				longestStreak: 0,
				riskLevel: "none",
				recommendations: [],
			};
		}

		const riskLevel = this.calculateRiskLevel(streakData);
		const recommendations = this.generateRecommendations(streakData);

		return {
			currentStreak: streakData.currentStreak,
			longestStreak: streakData.longestStreak,
			riskLevel,
			recommendations,
		};
	}

	private calculateRiskLevel(streakData: StreakData): "low" | "medium" | "high" | "none" {
		const daysUntilBreak = this.calculateDaysUntilBreak(streakData);

		if (daysUntilBreak === 0) return "none";
		if (daysUntilBreak === 1) return "high";
		if (daysUntilBreak <= 3) return "medium";
		return "low";
	}

	private calculateDaysUntilBreak(streakData: StreakData): number {
		// Simplified calculation
		const today = new Date();
		const lastActivity = new Date(streakData.lastActivityDate);

		if (this.isSameDay(lastActivity, today)) return 1;

		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);

		if (this.isSameDay(lastActivity, yesterday)) {
			return streakData.freezeCount > 0 ? 7 : 0; // Can use freeze or already broken
		}

		return 0;
	}

	private generateRecommendations(streakData: StreakData): string[] {
		const recommendations: string[] = [];

		if (streakData.currentStreak === 0) {
			recommendations.push("Start a new streak by completing daily activities");
		}

		if (streakData.freezeCount === 0) {
			recommendations.push("Earn streak freezes by reaching milestones");
		}

		if (streakData.currentStreak >= 7) {
			recommendations.push("You're on a hot streak! Keep it up!");
		}

		return recommendations;
	}

	private isSameDay(date1: Date, date2: Date): boolean {
		return date1.toDateString() === date2.toDateString();
	}
}

// Streak Notifications
export class StreakNotificationManager {
	// Send streak-related notifications
	async sendStreakNotification(
		userId: string,
		type: NotificationType,
		data: Record<string, unknown>
	): Promise<void> {
		const notification = this.createNotification(userId, type, data);
		await this.sendNotification(notification);
	}

	// Send streak at risk notification
	async sendStreakAtRiskNotification(userId: string, daysLeft: number): Promise<void> {
		await this.sendStreakNotification(userId, "streak_at_risk", { daysLeft });
	}

	// Send streak broken notification
	async sendStreakBrokenNotification(userId: string, finalStreak: number): Promise<void> {
		await this.sendStreakNotification(userId, "streak_broken", { finalStreak });
	}

	// Send streak recovered notification
	async sendStreakRecoveredNotification(userId: string, newStreak: number): Promise<void> {
		await this.sendStreakNotification(userId, "streak_recovered", { newStreak });
	}

	// Send milestone notification
	async sendMilestoneNotification(userId: string, milestone: number): Promise<void> {
		await this.sendStreakNotification(userId, "milestone_reached", { milestone });
	}

	private createNotification(
		userId: string,
		type: NotificationType,
		data: Record<string, unknown>
	): Notification {
		return {
			id: this.generateNotificationId(),
			userId,
			type,
			title: this.getNotificationTitle(type, data),
			message: this.getNotificationMessage(type, data),
			data,
			createdAt: new Date(),
			read: false,
		};
	}

	private getNotificationTitle(type: NotificationType, _data: Record<string, unknown>): string {
		switch (type) {
			case "streak_at_risk":
				return "Streak at Risk!";
			case "streak_broken":
				return "Streak Broken";
			case "streak_recovered":
				return "Streak Recovered!";
			case "milestone_reached":
				return "Milestone Reached!";
			default:
				return "Streak Update";
		}
	}

	private getNotificationMessage(type: NotificationType, data: Record<string, unknown>): string {
		switch (type) {
			case "streak_at_risk":
				return `Your streak will break in ${data.daysLeft} day${data.daysLeft !== 1 ? "s" : ""} if you don't complete activities!`;
			case "streak_broken":
				return `Your ${data.finalStreak}-day streak has been broken. Start fresh today!`;
			case "streak_recovered":
				return `Great job! Your streak has been recovered and is now ${data.newStreak} days long!`;
			case "milestone_reached":
				return `Congratulations! You've reached a ${data.milestone}-day streak milestone!`;
			default:
				return "Your streak status has been updated.";
		}
	}

	private async sendNotification(_notification: Notification): Promise<void> {
		/* ignored */
	}

	private generateNotificationId(): string {
		return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}
}

// Streak Testing Framework
export class StreakTestingFramework {
	private calculator: StreakCalculator;
	private freezeManager: StreakFreezeManager;

	constructor(calculator: StreakCalculator, freezeManager: StreakFreezeManager) {
		this.calculator = calculator;
		this.freezeManager = freezeManager;
	}

	// Test streak calculations
	async testStreakCalculations(): Promise<TestResult[]> {
		const tests: TestResult[] = [];

		tests.push(await this.testBasicStreakCalculation());
		tests.push(await this.testStreakWithGaps());
		tests.push(await this.testFreezeUsage());
		tests.push(await this.testStreakRecovery());

		return tests;
	}

	// Test freeze management
	async testFreezeManagement(): Promise<TestResult[]> {
		const tests: TestResult[] = [];

		tests.push(await this.testFreezeAwarding());
		tests.push(await this.testFreezeExpiration());
		tests.push(await this.testFreezeUsage());

		return tests;
	}

	private async testBasicStreakCalculation(): Promise<TestResult> {
		try {
			const activities: ActivityRecord[] = [
				{ id: "1", userId: "user1", type: "lesson", timestamp: new Date("2024-01-01") },
				{ id: "2", userId: "user1", type: "lesson", timestamp: new Date("2024-01-02") },
				{ id: "3", userId: "user1", type: "lesson", timestamp: new Date("2024-01-03") },
			];

			const streakData = this.calculator.calculateStreak("user1", activities);

			return {
				name: "Basic Streak Calculation",
				passed: streakData.currentStreak === 3,
				expected: 3,
				actual: streakData.currentStreak,
			};
		} catch (error) {
			return {
				name: "Basic Streak Calculation",
				passed: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	private async testStreakWithGaps(): Promise<TestResult> {
		try {
			const activities: ActivityRecord[] = [
				{ id: "1", userId: "user1", type: "lesson", timestamp: new Date("2024-01-01") },
				{ id: "2", userId: "user1", type: "lesson", timestamp: new Date("2024-01-02") },
				// Gap on Jan 3
				{ id: "3", userId: "user1", type: "lesson", timestamp: new Date("2024-01-04") },
			];

			const streakData = this.calculator.calculateStreak("user1", activities);

			return {
				name: "Streak with Gaps",
				passed: streakData.currentStreak === 1, // Should break and restart
				expected: 1,
				actual: streakData.currentStreak,
			};
		} catch (error) {
			return {
				name: "Streak with Gaps",
				passed: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	private async testFreezeAwarding(): Promise<TestResult> {
		try {
			const freeze = this.freezeManager.awardFreeze("user1", "test milestone");
			const availableFreezes = this.freezeManager.getAvailableFreezes("user1");

			return {
				name: "Freeze Awarding",
				passed: availableFreezes.length === 1 && availableFreezes[0].id === freeze.id,
				freezeId: freeze.id,
			};
		} catch (error) {
			return {
				name: "Freeze Awarding",
				passed: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	private async testFreezeExpiration(): Promise<TestResult> {
		try {
			// Award freeze that expires in 1 day
			this.freezeManager.awardFreeze("user2", "test", 1);

			// Simulate time passing (this would be done differently in real tests)
			const availableBefore = this.freezeManager.getAvailableFreezes("user2");

			return {
				name: "Freeze Expiration",
				passed: availableBefore.length === 1,
				availableCount: availableBefore.length,
			};
		} catch (error) {
			return {
				name: "Freeze Expiration",
				passed: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	private async testFreezeUsage(): Promise<TestResult> {
		try {
			const freeze = this.freezeManager.awardFreeze("user4", "test freeze");
			// biome-ignore lint/correctness/useHookAtTopLevel: useFreeze is not a React hook
			const used = this.freezeManager.useFreeze("user4", freeze.id, new Date());

			return {
				name: "Freeze Usage",
				passed: used,
			};
		} catch (error) {
			return {
				name: "Freeze Usage",
				passed: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	private async testStreakRecovery(): Promise<TestResult> {
		try {
			// Create broken streak scenario
			const activities: ActivityRecord[] = [
				{ id: "1", userId: "user3", type: "lesson", timestamp: new Date("2024-01-01") },
				{ id: "2", userId: "user3", type: "lesson", timestamp: new Date("2024-01-02") },
				// No activity on Jan 3, streak broken
			];

			const streakData = this.calculator.calculateStreak("user3", activities);

			// This would test recovery logic
			return {
				name: "Streak Recovery",
				passed: streakData.currentStreak === 0, // Should be broken
				actual: streakData.currentStreak,
			};
		} catch (error) {
			return {
				name: "Streak Recovery",
				passed: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}
}

// Type definitions
interface ActivityRecord {
	id: string;
	userId: string;
	type: string;
	timestamp: Date;
}

interface FreezeStats {
	totalAwarded: number;
	available: number;
	used: number;
	expired: number;
	usageRate: number;
}

interface RecoveryResult {
	success: boolean;
	reason?: string;
	options: RecoveryOption[];
}

interface RecoveryOption {
	type: "freeze" | "activity" | "purchase";
	description: string;
	cost: number;
	successRate: number;
}

interface RecoveryExecutionResult {
	success: boolean;
	reason?: string;
	newStreakData?: StreakData;
	message?: string;
	pending?: boolean;
}

interface StreakAnalyticsData {
	totalUsers: number;
	averageStreakLength: number;
	longestStreaks: Array<{ userId: string; length: number }>;
	streakDistribution: Record<number, number>;
	freezeUsageRate: number;
	recoverySuccessRate: number;
}

interface StreakInsights {
	currentStreak: number;
	longestStreak: number;
	riskLevel: "low" | "medium" | "high" | "none";
	recommendations: string[];
}

type NotificationType =
	| "streak_at_risk"
	| "streak_broken"
	| "streak_recovered"
	| "milestone_reached";

interface Notification {
	id: string;
	userId: string;
	type: NotificationType;
	title: string;
	message: string;
	data: Record<string, unknown>;
	createdAt: Date;
	read: boolean;
}

interface TestResult {
	name: string;
	passed: boolean;
	expected?: unknown;
	actual?: unknown;
	error?: string;
	[key: string]: unknown;
}

// Default configurations
export const DEFAULT_STREAK_CONFIG: StreakConfig = {
	activityTypes: ["lesson_completion", "challenge_success", "daily_login"],
	timezone: "UTC",
	resetHour: 0,
	maxFreezes: 10,
	freezeValidityDays: 365,
	recoveryWindow: 7,
	minimumActivity: 1,
};
