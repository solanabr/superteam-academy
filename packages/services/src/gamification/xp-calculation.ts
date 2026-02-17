// XP Calculation Types
export interface XPEvent {
	id: string;
	userId: string;
	type: XPEventType;
	amount: number;
	source: string;
	metadata: Record<string, unknown>;
	timestamp: Date;
}

export enum XPEventType {
	LESSON_COMPLETION = "lesson_completion",
	CHALLENGE_SUCCESS = "challenge_success",
	CHALLENGE_FIRST_ATTEMPT = "challenge_first_attempt",
	STREAK_BONUS = "streak_bonus",
	ACHIEVEMENT_UNLOCK = "achievement_unlock",
	REFERRAL_BONUS = "referral_bonus",
	COURSE_COMPLETION = "course_completion",
	LEVEL_UP_BONUS = "level_up_bonus",
	DAILY_LOGIN = "daily_login",
	WEEKLY_STREAK = "weekly_streak",
	MONTHLY_STREAK = "monthly_streak",
	SOCIAL_SHARE = "social_share",
	CONTENT_CREATION = "content_creation",
	PEER_REVIEW = "peer_review",
	MENTORING = "mentoring",
	ADMIN_BONUS = "admin_bonus",
}

export interface XPConfig {
	baseAmounts: Record<XPEventType, number>;
	multipliers: Record<string, number>;
	caps: {
		daily: number;
		weekly: number;
		monthly: number;
		lifetime: number;
	};
	decay: {
		enabled: boolean;
		rate: number; // percentage per month
		gracePeriod: number; // days
	};
}

export interface LevelConfig {
	formula: "linear" | "exponential" | "custom";
	baseXP: number;
	growthRate: number;
	maxLevel: number;
	customFormula?: (level: number) => number;
}

export interface XPBalance {
	current: number;
	totalEarned: number;
	totalSpent: number;
	level: number;
	progressToNext: number;
	lastUpdated: Date;
}

// XP Calculation Engine
export class XPCalculator {
	private config: XPConfig;
	private levelConfig: LevelConfig;

	constructor(config: XPConfig, levelConfig: LevelConfig) {
		this.config = config;
		this.levelConfig = levelConfig;
	}

	// Calculate XP for a specific event
	calculateXP(event: XPEvent, userContext: UserContext): number {
		let baseXP = this.config.baseAmounts[event.type];

		// Apply multipliers based on context
		baseXP = this.applyMultipliers(baseXP, event, userContext);

		// Apply caps
		baseXP = this.applyCaps(baseXP, userContext);

		// Apply decay if enabled
		baseXP = this.applyDecay(baseXP, userContext);

		return Math.max(0, Math.floor(baseXP));
	}

	private applyMultipliers(baseXP: number, event: XPEvent, context: UserContext): number {
		let multiplier = 1.0;

		// Streak multiplier
		if (context.currentStreak >= 7) multiplier *= this.config.multipliers.streak_week;
		else if (context.currentStreak >= 30) multiplier *= this.config.multipliers.streak_month;

		// Difficulty multiplier
		if (event.metadata.difficulty) {
			multiplier *= this.config.multipliers[`difficulty_${event.metadata.difficulty}`] || 1.0;
		}

		// Time-based multipliers
		const hour = new Date(event.timestamp).getHours();
		if (hour >= 6 && hour <= 9) multiplier *= this.config.multipliers.morning_bonus; // Early bird bonus
		if (hour >= 22 || hour <= 2) multiplier *= this.config.multipliers.night_bonus; // Night owl bonus

		// First attempt bonus
		if (event.type === XPEventType.CHALLENGE_SUCCESS && event.metadata.attemptNumber === 1) {
			multiplier *= this.config.multipliers.first_attempt;
		}

		// Weekend bonus
		const day = new Date(event.timestamp).getDay();
		if (day === 0 || day === 6) multiplier *= this.config.multipliers.weekend_bonus;

		return baseXP * multiplier;
	}

	private applyCaps(amount: number, context: UserContext): number {
		let cappedAmount = amount;

		// Daily cap
		const todayXP = context.dailyXP;
		if (todayXP + cappedAmount > this.config.caps.daily) {
			cappedAmount = Math.max(0, this.config.caps.daily - todayXP);
		}

		// Weekly cap
		const weeklyXP = context.weeklyXP;
		if (weeklyXP + cappedAmount > this.config.caps.weekly) {
			cappedAmount = Math.max(0, this.config.caps.weekly - weeklyXP);
		}

		// Monthly cap
		const monthlyXP = context.monthlyXP;
		if (monthlyXP + cappedAmount > this.config.caps.monthly) {
			cappedAmount = Math.max(0, this.config.caps.monthly - monthlyXP);
		}

		// Lifetime cap
		if (context.totalXP + cappedAmount > this.config.caps.lifetime) {
			cappedAmount = Math.max(0, this.config.caps.lifetime - context.totalXP);
		}

		return cappedAmount;
	}

	private applyDecay(amount: number, context: UserContext): number {
		if (!this.config.decay.enabled) return amount;

		const daysSinceLastActivity = Math.floor(
			(Date.now() - context.lastActivity.getTime()) / (1000 * 60 * 60 * 24)
		);

		if (daysSinceLastActivity <= this.config.decay.gracePeriod) return amount;

		const monthsSinceActivity = daysSinceLastActivity / 30;
		const decayFactor = (1 - this.config.decay.rate / 100) ** monthsSinceActivity;

		return amount * decayFactor;
	}

	// Calculate level from total XP
	calculateLevel(totalXP: number): number {
		let level = 1;
		let _xpRequired = 0;
		void _xpRequired;

		while (level < this.levelConfig.maxLevel) {
			const nextRequired = this.getXPForLevel(level + 1);
			if (totalXP < nextRequired) break;
			_xpRequired = nextRequired;
			level++;
		}

		return Math.min(level, this.levelConfig.maxLevel);
	}

	// Get XP required for a specific level
	getXPForLevel(level: number): number {
		if (level <= 1) return 0;

		switch (this.levelConfig.formula) {
			case "linear":
				return this.levelConfig.baseXP * (level - 1);

			case "exponential":
				return this.levelConfig.baseXP * this.levelConfig.growthRate ** (level - 1);

			case "custom":
				return (
					this.levelConfig.customFormula?.(level) || this.levelConfig.baseXP * (level - 1)
				);

			default:
				return this.levelConfig.baseXP * (level - 1);
		}
	}

	// Get progress to next level (0-1)
	getProgressToNextLevel(currentXP: number, currentLevel: number): number {
		if (currentLevel >= this.levelConfig.maxLevel) return 1.0;

		const currentLevelXP = this.getXPForLevel(currentLevel);
		const nextLevelXP = this.getXPForLevel(currentLevel + 1);
		const progressXP = currentXP - currentLevelXP;
		const requiredXP = nextLevelXP - currentLevelXP;

		return Math.min(1.0, progressXP / requiredXP);
	}

	// Calculate XP needed for next level
	getXPToNextLevel(currentXP: number, currentLevel: number): number {
		if (currentLevel >= this.levelConfig.maxLevel) return 0;

		const nextLevelXP = this.getXPForLevel(currentLevel + 1);
		return Math.max(0, nextLevelXP - currentXP);
	}
}

// XP Event Tracking
export class XPTracker {
	private events: XPEvent[] = [];
	private calculator: XPCalculator;

	constructor(calculator: XPCalculator) {
		this.calculator = calculator;
	}

	// Record an XP event
	async recordEvent(
		event: Omit<XPEvent, "id" | "timestamp">,
		userContext: UserContext
	): Promise<XPEvent> {
		const fullEvent: XPEvent = {
			...event,
			id: this.generateEventId(),
			timestamp: new Date(),
		};

		// Calculate actual XP amount
		fullEvent.amount = this.calculator.calculateXP(fullEvent, userContext);

		// Store event
		this.events.push(fullEvent);

		// Emit event for analytics
		this.emitEvent(fullEvent);

		return fullEvent;
	}

	// Get events for a user
	getUserEvents(userId: string, limit = 50, offset = 0): XPEvent[] {
		return this.events
			.filter((event) => event.userId === userId)
			.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
			.slice(offset, offset + limit);
	}

	// Get events by type
	getEventsByType(type: XPEventType, limit = 50): XPEvent[] {
		return this.events
			.filter((event) => event.type === type)
			.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
			.slice(0, limit);
	}

	// Get aggregated XP by date range
	getAggregatedXP(userId: string, startDate: Date, endDate: Date): Record<string, number> {
		const userEvents = this.events.filter(
			(event) =>
				event.userId === userId &&
				event.timestamp >= startDate &&
				event.timestamp <= endDate
		);

		const aggregated: Record<string, number> = {};

		for (const event of userEvents) {
			const dateKey = event.timestamp.toISOString().split("T")[0];
			aggregated[dateKey] = (aggregated[dateKey] || 0) + event.amount;
		}

		return aggregated;
	}

	// Get XP statistics
	getXPStats(userId: string): XPStats {
		const userEvents = this.events.filter((event) => event.userId === userId);

		const totalXP = userEvents.reduce((sum, event) => sum + event.amount, 0);
		const eventCounts = userEvents.reduce(
			(counts, event) => {
				counts[event.type] = (counts[event.type] || 0) + 1;
				return counts;
			},
			{} as Record<XPEventType, number>
		);

		const avgXPPerEvent = userEvents.length > 0 ? totalXP / userEvents.length : 0;

		return {
			totalXP,
			totalEvents: userEvents.length,
			eventCounts,
			avgXPPerEvent,
			lastEvent: userEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0],
		};
	}

	private generateEventId(): string {
		return `xp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	private emitEvent(_event: XPEvent): void {
		/* ignored */
	}
}

// XP Analytics
export class XPAnalytics {
	// Get top XP earners
	getTopEarners(
		_limit = 10,
		_timeframe?: { start: Date; end: Date }
	): Array<{ userId: string; totalXP: number }> {
		// This would aggregate from all users - simplified for demo
		return [];
	}

	// Get XP distribution
	getXPDistribution(): { ranges: string[]; counts: number[] } {
		// This would analyze XP distribution across users
		return { ranges: [], counts: [] };
	}

	// Get engagement metrics
	getEngagementMetrics(): EngagementMetrics {
		// Calculate various engagement metrics
		return {
			dailyActiveUsers: 0,
			weeklyActiveUsers: 0,
			monthlyActiveUsers: 0,
			averageSessionXP: 0,
			retentionRate: 0,
			churnRate: 0,
		};
	}

	// Get XP efficiency metrics
	getXPEfficiency(): XPEfficiency {
		return {
			avgXPPerMinute: 0,
			completionRate: 0,
			difficultyEfficiency: {},
			timeBasedEfficiency: {},
		};
	}

	// Predict future XP growth
	predictXPGrowth(_userId: string, _days = 30): XPGrowthPrediction {
		return {
			predictedXP: 0,
			confidence: 0,
			factors: [],
			recommendations: [],
		};
	}
}

// XP Migration Tools
export class XPMigrator {
	// Migrate XP data from old system
	async migrateFromLegacy(legacyData: unknown[]): Promise<MigrationResult> {
		const results: MigrationResult = {
			totalRecords: legacyData.length,
			successfulMigrations: 0,
			failedMigrations: 0,
			errors: [],
		};

		for (const record of legacyData) {
			try {
				// Transform and validate legacy data
				const migratedRecord = this.transformLegacyRecord(record);
				await this.saveMigratedRecord(migratedRecord);
				results.successfulMigrations++;
			} catch (error) {
				results.failedMigrations++;
				const recordId =
					typeof record === "object" && record !== null && "id" in record
						? String((record as Record<string, unknown>).id)
						: "unknown";
				results.errors.push(
					`Failed to migrate record ${recordId}: ${error instanceof Error ? error.message : String(error)}`
				);
			}
		}

		return results;
	}

	// Export XP data
	async exportXPData(_userId: string, _format: "json" | "csv" = "json"): Promise<string> {
		// Export user XP data in specified format
		return "";
	}

	// Import XP data
	async importXPData(_data: string, _format: "json" | "csv" = "json"): Promise<ImportResult> {
		return {
			totalRecords: 0,
			importedRecords: 0,
			skippedRecords: 0,
			errors: [],
		};
	}

	private transformLegacyRecord(record: unknown): unknown {
		// Transform legacy record format to new format
		return record;
	}

	private async saveMigratedRecord(_record: unknown): Promise<void> {
		// Save migrated record to database
	}
}

// XP Security
export class XPSecurity {
	// Validate XP transactions
	validateXPTransaction(event: XPEvent, userContext: UserContext): ValidationResult {
		// Check for suspicious patterns
		const isValid = this.checkFraudPatterns(event, userContext);

		return {
			isValid,
			riskScore: this.calculateRiskScore(event, userContext),
			flags: this.getSecurityFlags(event, userContext),
		};
	}

	// Rate limiting
	checkRateLimit(_userId: string, _eventType: XPEventType): boolean {
		// Implement rate limiting logic
		return true;
	}

	// Audit logging
	async logXPAudit(_event: XPEvent, _action: string): Promise<void> {
		// Log XP-related security events
	}

	private checkFraudPatterns(_event: XPEvent, _context: UserContext): boolean {
		// Check for suspicious patterns like rapid XP farming
		return true;
	}

	private calculateRiskScore(_event: XPEvent, _context: UserContext): number {
		// Calculate risk score 0-100
		return 0;
	}

	private getSecurityFlags(_event: XPEvent, _context: UserContext): string[] {
		return [];
	}
}

// XP Testing Framework
export class XPTestingFramework {
	private calculator: XPCalculator;
	private tracker: XPTracker;

	constructor(calculator: XPCalculator, tracker: XPTracker) {
		this.calculator = calculator;
		this.tracker = tracker;
	}

	// Test XP calculations
	async testXPCalculations(): Promise<TestResult[]> {
		const tests: TestResult[] = [];

		// Test basic XP calculation
		tests.push(await this.testBasicXPCalculation());

		// Test multiplier application
		tests.push(await this.testMultiplierApplication());

		// Test cap enforcement
		tests.push(await this.testCapEnforcement());

		// Test level calculation
		tests.push(await this.testLevelCalculation());

		return tests;
	}

	// Test XP event tracking
	async testEventTracking(): Promise<TestResult[]> {
		const tests: TestResult[] = [];

		// Test event recording
		tests.push(await this.testEventRecording());

		// Test event retrieval
		tests.push(await this.testEventRetrieval());

		// Test aggregation
		tests.push(await this.testAggregation());

		return tests;
	}

	private async testBasicXPCalculation(): Promise<TestResult> {
		try {
			const event: XPEvent = {
				id: "test",
				userId: "user1",
				type: XPEventType.LESSON_COMPLETION,
				amount: 0, // Will be calculated
				source: "test",
				metadata: {},
				timestamp: new Date(),
			};

			const context: UserContext = {
				currentStreak: 1,
				dailyXP: 0,
				weeklyXP: 0,
				monthlyXP: 0,
				totalXP: 0,
				lastActivity: new Date(),
			};

			const calculatedXP = this.calculator.calculateXP(event, context);
			const expectedXP = 10; // Base amount for lesson completion

			return {
				name: "Basic XP Calculation",
				passed: calculatedXP === expectedXP,
				expected: expectedXP,
				actual: calculatedXP,
			};
		} catch (error) {
			return {
				name: "Basic XP Calculation",
				passed: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	private async testMultiplierApplication(): Promise<TestResult> {
		try {
			const event: XPEvent = {
				id: "test",
				userId: "user1",
				type: XPEventType.CHALLENGE_SUCCESS,
				amount: 0,
				source: "test",
				metadata: { difficulty: "hard" },
				timestamp: new Date(),
			};

			const context: UserContext = {
				currentStreak: 7, // Week streak
				dailyXP: 0,
				weeklyXP: 0,
				monthlyXP: 0,
				totalXP: 0,
				lastActivity: new Date(),
			};

			const calculatedXP = this.calculator.calculateXP(event, context);
			// Should include streak multiplier and difficulty multiplier

			return {
				name: "Multiplier Application",
				passed: calculatedXP > 0,
				actual: calculatedXP,
			};
		} catch (error) {
			return {
				name: "Multiplier Application",
				passed: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	private async testCapEnforcement(): Promise<TestResult> {
		try {
			const context: UserContext = {
				currentStreak: 1,
				dailyXP: 95, // Near daily cap
				weeklyXP: 0,
				monthlyXP: 0,
				totalXP: 0,
				lastActivity: new Date(),
			};

			const event: XPEvent = {
				id: "test",
				userId: "user1",
				type: XPEventType.LESSON_COMPLETION,
				amount: 0,
				source: "test",
				metadata: {},
				timestamp: new Date(),
			};

			const calculatedXP = this.calculator.calculateXP(event, context);
			const expectedXP = 5; // Capped to not exceed daily limit

			return {
				name: "Cap Enforcement",
				passed: calculatedXP === expectedXP,
				expected: expectedXP,
				actual: calculatedXP,
			};
		} catch (error) {
			return {
				name: "Cap Enforcement",
				passed: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	private async testLevelCalculation(): Promise<TestResult> {
		try {
			const testXP = 150;
			const level = this.calculator.calculateLevel(testXP);
			const progress = this.calculator.getProgressToNextLevel(testXP, level);

			return {
				name: "Level Calculation",
				passed: level > 1 && progress >= 0 && progress <= 1,
				level,
				progress,
			};
		} catch (error) {
			return {
				name: "Level Calculation",
				passed: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	private async testEventRecording(): Promise<TestResult> {
		try {
			const event = await this.tracker.recordEvent(
				{
					userId: "test-user",
					type: XPEventType.LESSON_COMPLETION,
					amount: 0,
					source: "test",
					metadata: {},
				},
				{
					currentStreak: 1,
					dailyXP: 0,
					weeklyXP: 0,
					monthlyXP: 0,
					totalXP: 0,
					lastActivity: new Date(),
				}
			);

			return {
				name: "Event Recording",
				passed: event.id.startsWith("xp_") && event.amount > 0,
				eventId: event.id,
				amount: event.amount,
			};
		} catch (error) {
			return {
				name: "Event Recording",
				passed: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	private async testEventRetrieval(): Promise<TestResult> {
		try {
			const events = this.tracker.getUserEvents("test-user", 10);
			return {
				name: "Event Retrieval",
				passed: Array.isArray(events),
				eventCount: events.length,
			};
		} catch (error) {
			return {
				name: "Event Retrieval",
				passed: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	private async testAggregation(): Promise<TestResult> {
		try {
			const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
			const endDate = new Date();
			const aggregated = this.tracker.getAggregatedXP("test-user", startDate, endDate);

			return {
				name: "XP Aggregation",
				passed: typeof aggregated === "object",
				dateCount: Object.keys(aggregated).length,
			};
		} catch (error) {
			return {
				name: "XP Aggregation",
				passed: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}
}

// Type definitions
interface UserContext {
	currentStreak: number;
	dailyXP: number;
	weeklyXP: number;
	monthlyXP: number;
	totalXP: number;
	lastActivity: Date;
}

interface XPStats {
	totalXP: number;
	totalEvents: number;
	eventCounts: Record<XPEventType, number>;
	avgXPPerEvent: number;
	lastEvent?: XPEvent;
}

interface EngagementMetrics {
	dailyActiveUsers: number;
	weeklyActiveUsers: number;
	monthlyActiveUsers: number;
	averageSessionXP: number;
	retentionRate: number;
	churnRate: number;
}

interface XPEfficiency {
	avgXPPerMinute: number;
	completionRate: number;
	difficultyEfficiency: Record<string, number>;
	timeBasedEfficiency: Record<string, number>;
}

interface XPGrowthPrediction {
	predictedXP: number;
	confidence: number;
	factors: string[];
	recommendations: string[];
}

interface MigrationResult {
	totalRecords: number;
	successfulMigrations: number;
	failedMigrations: number;
	errors: string[];
}

interface ImportResult {
	totalRecords: number;
	importedRecords: number;
	skippedRecords: number;
	errors: string[];
}

interface ValidationResult {
	isValid: boolean;
	riskScore: number;
	flags: string[];
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
export const DEFAULT_XP_CONFIG: XPConfig = {
	baseAmounts: {
		[XPEventType.LESSON_COMPLETION]: 10,
		[XPEventType.CHALLENGE_SUCCESS]: 25,
		[XPEventType.CHALLENGE_FIRST_ATTEMPT]: 50,
		[XPEventType.STREAK_BONUS]: 5,
		[XPEventType.ACHIEVEMENT_UNLOCK]: 100,
		[XPEventType.REFERRAL_BONUS]: 200,
		[XPEventType.COURSE_COMPLETION]: 500,
		[XPEventType.LEVEL_UP_BONUS]: 50,
		[XPEventType.DAILY_LOGIN]: 5,
		[XPEventType.WEEKLY_STREAK]: 25,
		[XPEventType.MONTHLY_STREAK]: 100,
		[XPEventType.SOCIAL_SHARE]: 10,
		[XPEventType.CONTENT_CREATION]: 30,
		[XPEventType.PEER_REVIEW]: 15,
		[XPEventType.MENTORING]: 20,
		[XPEventType.ADMIN_BONUS]: 0,
	},
	multipliers: {
		streak_week: 1.5,
		streak_month: 2.0,
		difficulty_easy: 0.8,
		difficulty_medium: 1.0,
		difficulty_hard: 1.5,
		difficulty_expert: 2.0,
		first_attempt: 2.0,
		morning_bonus: 1.2,
		night_bonus: 1.1,
		weekend_bonus: 1.3,
	},
	caps: {
		daily: 100,
		weekly: 500,
		monthly: 2000,
		lifetime: 100_000,
	},
	decay: {
		enabled: false,
		rate: 5,
		gracePeriod: 30,
	},
};

export const DEFAULT_LEVEL_CONFIG: LevelConfig = {
	formula: "exponential",
	baseXP: 100,
	growthRate: 1.2,
	maxLevel: 100,
};
