// Custom Analytics Pipeline Implementation
import { z } from "zod";

// Analytics Event Types
export enum AnalyticsEventType {
	USER_REGISTRATION = "user_registration",
	USER_LOGIN = "user_login",
	USER_LOGOUT = "user_logout",
	COURSE_ENROLLMENT = "course_enrollment",
	LESSON_COMPLETION = "lesson_completion",
	COURSE_COMPLETION = "course_completion",
	ACHIEVEMENT_UNLOCKED = "achievement_unlocked",
	XP_EARNED = "xp_earned",
	STREAK_UPDATED = "streak_updated",
	LEADERBOARD_VIEWED = "leaderboard_viewed",
	SOCIAL_SHARE = "social_share",
	REFERRAL_USED = "referral_used",
	PAYMENT_INITIATED = "payment_initiated",
	PAYMENT_COMPLETED = "payment_completed",
	FEATURE_USAGE = "feature_usage",
	SEARCH_PERFORMED = "search_performed",
	CONTENT_VIEWED = "content_viewed",
	TIME_SPENT = "time_spent",
	SESSION_START = "session_start",
	SESSION_END = "session_end",
	CUSTOM_EVENT = "custom_event",
}

// Analytics Event Schema
export const AnalyticsEventSchema = z.object({
	id: z.string().uuid(),
	type: z.nativeEnum(AnalyticsEventType),
	timestamp: z.date(),
	userId: z.string(),
	sessionId: z.string().optional(),
	anonymousId: z.string().optional(),
	properties: z.record(z.string(), z.unknown()),
	context: z
		.object({
			app: z.object({
				name: z.string(),
				version: z.string(),
				build: z.string().optional(),
			}),
			device: z.object({
				id: z.string().optional(),
				manufacturer: z.string().optional(),
				model: z.string().optional(),
				type: z.enum(["mobile", "tablet", "desktop", "server"]).optional(),
			}),
			os: z.object({
				name: z.string().optional(),
				version: z.string().optional(),
			}),
			network: z.object({
				bluetooth: z.boolean().optional(),
				cellular: z.boolean().optional(),
				wifi: z.boolean().optional(),
				carrier: z.string().optional(),
			}),
			screen: z.object({
				width: z.number().optional(),
				height: z.number().optional(),
				density: z.number().optional(),
			}),
			locale: z.string().optional(),
			timezone: z.string().optional(),
			ip: z.string().optional(),
			userAgent: z.string().optional(),
		})
		.optional(),
	integrations: z.record(z.string(), z.unknown()).optional(),
});

export type AnalyticsEvent = z.infer<typeof AnalyticsEventSchema>;

// Analytics Configuration
export interface AnalyticsConfig {
	serviceName: string;
	environment: "development" | "staging" | "production";
	batchSize: number;
	flushInterval: number; // milliseconds
	retryAttempts: number;
	retryDelay: number; // milliseconds
	destinations: AnalyticsDestination[];
	transformers: AnalyticsTransformer[];
	filters: AnalyticsFilter[];
	sampling: {
		enabled: boolean;
		rate: number; // 0.0 to 1.0
	};
	privacy: {
		anonymizeIp: boolean;
		excludeFields: string[];
		retentionDays: number;
	};
}

// Analytics Destination Interface
export interface AnalyticsDestination {
	name: string;
	send(events: AnalyticsEvent[]): Promise<void>;
	flush(): Promise<void>;
	close(): Promise<void>;
}

// Analytics Transformer Interface
export interface AnalyticsTransformer {
	name: string;
	transform(event: AnalyticsEvent): AnalyticsEvent | null;
}

// Analytics Filter Interface
export interface AnalyticsFilter {
	name: string;
	shouldInclude(event: AnalyticsEvent): boolean;
}

// Built-in Destinations
export class HTTPDestination implements AnalyticsDestination {
	name: string;
	private endpoint: string;
	private apiKey: string | undefined;
	private headers: Record<string, string>;

	constructor(
		name: string,
		endpoint: string,
		apiKey?: string,
		headers: Record<string, string> = {}
	) {
		this.name = name;
		this.endpoint = endpoint;
		this.apiKey = apiKey;
		this.headers = headers;
	}

	async send(events: AnalyticsEvent[]): Promise<void> {
		const requestHeaders: Record<string, string> = {
			"Content-Type": "application/json",
			...this.headers,
		};

		if (this.apiKey) {
			requestHeaders.Authorization = `Bearer ${this.apiKey}`;
		}

		const response = await fetch(this.endpoint, {
			method: "POST",
			headers: requestHeaders,
			body: JSON.stringify({ events }),
		});

		if (!response.ok) {
			throw new Error(`Analytics destination failed: ${response.status}`);
		}
	}

	async flush(): Promise<void> {
		// No-op for HTTP
	}

	async close(): Promise<void> {
		// No-op for HTTP
	}
}

export class DatabaseDestination implements AnalyticsDestination {
	name: string;

	constructor(name: string, _connectionString: string, _tableName: string) {
		this.name = name;
	}

	async send(_events: AnalyticsEvent[]): Promise<void> {
		// ignored
	}

	async flush(): Promise<void> {
		// Flush database connections
	}

	async close(): Promise<void> {
		// Close database connections
	}
}

export class FileDestination implements AnalyticsDestination {
	name: string;

	constructor(name: string, _filePath: string) {
		this.name = name;
	}

	async send(_events: AnalyticsEvent[]): Promise<void> {
		// ignored
	}

	async flush(): Promise<void> {
		// Flush file buffers
	}

	async close(): Promise<void> {
		// Close file handles
	}
}

// Built-in Transformers
export class PrivacyTransformer implements AnalyticsTransformer {
	name = "privacy";
	private config: { anonymizeIp: boolean; excludeFields: string[] };

	constructor(config: { anonymizeIp: boolean; excludeFields: string[] }) {
		this.config = config;
	}

	transform(event: AnalyticsEvent): AnalyticsEvent | null {
		const transformed = { ...event };

		// Anonymize IP
		if (this.config.anonymizeIp && transformed.context?.ip) {
			transformed.context.ip = this.anonymizeIp(transformed.context.ip);
		}

		// Exclude fields
		for (const field of this.config.excludeFields) {
			this.removeField(transformed, field);
		}

		return transformed;
	}

	private anonymizeIp(ip: string): string {
		// Simple anonymization: replace last octet with 0
		const parts = ip.split(".");
		if (parts.length === 4) {
			parts[3] = "0";
			return parts.join(".");
		}
		return ip;
	}

	private removeField(obj: unknown, field: string): void {
		const parts = field.split(".");
		let current: Record<string, unknown> | undefined;

		if (obj && typeof obj === "object") {
			current = obj as Record<string, unknown>;
		} else {
			return;
		}

		for (let i = 0; i < parts.length - 1; i++) {
			const next = current[parts[i]];
			if (next && typeof next === "object") {
				current = next as Record<string, unknown>;
			} else {
				return;
			}
		}

		delete current[parts[parts.length - 1]];
	}
}

export class EnrichmentTransformer implements AnalyticsTransformer {
	name = "enrichment";
	private enrichers: Array<(event: AnalyticsEvent) => Record<string, unknown>>;

	constructor(enrichers: Array<(event: AnalyticsEvent) => Record<string, unknown>> = []) {
		this.enrichers = enrichers;
	}

	transform(event: AnalyticsEvent): AnalyticsEvent | null {
		const enriched = { ...event };

		for (const enricher of this.enrichers) {
			const additionalData = enricher(event);
			enriched.properties = { ...enriched.properties, ...additionalData };
		}

		return enriched;
	}
}

export class SamplingTransformer implements AnalyticsTransformer {
	name = "sampling";
	private rate: number;

	constructor(rate: number) {
		this.rate = Math.max(0, Math.min(1, rate));
	}

	transform(event: AnalyticsEvent): AnalyticsEvent | null {
		return Math.random() < this.rate ? event : null;
	}
}

// Built-in Filters
export class EventTypeFilter implements AnalyticsFilter {
	name: string;
	private allowedTypes: Set<AnalyticsEventType>;

	constructor(name: string, allowedTypes: AnalyticsEventType[]) {
		this.name = name;
		this.allowedTypes = new Set(allowedTypes);
	}

	shouldInclude(event: AnalyticsEvent): boolean {
		return this.allowedTypes.has(event.type);
	}
}

export class UserFilter implements AnalyticsFilter {
	name: string;
	private excludedUsers: Set<string>;

	constructor(name: string, excludedUsers: string[]) {
		this.name = name;
		this.excludedUsers = new Set(excludedUsers);
	}

	shouldInclude(event: AnalyticsEvent): boolean {
		return !event.userId || !this.excludedUsers.has(event.userId);
	}
}

export class PropertyFilter implements AnalyticsFilter {
	name: string;
	private property: string;
	private value: unknown;

	constructor(name: string, property: string, value: unknown) {
		this.name = name;
		this.property = property;
		this.value = value;
	}

	shouldInclude(event: AnalyticsEvent): boolean {
		const propertyValue = this.getPropertyValue(event, this.property);
		return propertyValue === this.value;
	}

	private getPropertyValue(obj: unknown, path: string): unknown {
		return path.split(".").reduce<unknown>((current, key) => {
			if (current && typeof current === "object") {
				return (current as Record<string, unknown>)[key];
			}
			return undefined;
		}, obj);
	}
}

// Analytics Service
export class AnalyticsService {
	private config: AnalyticsConfig;
	private eventBuffer: AnalyticsEvent[] = [];
	private flushTimer: NodeJS.Timeout | null = null;
	private isRunning = false;

	constructor(config: AnalyticsConfig) {
		this.config = config;
	}

	// Start analytics collection
	async start(): Promise<void> {
		if (this.isRunning) return;

		this.isRunning = true;
		this.startFlushTimer();
	}

	// Stop analytics collection
	async stop(): Promise<void> {
		if (!this.isRunning) return;

		this.isRunning = false;

		if (this.flushTimer) {
			clearInterval(this.flushTimer);
			this.flushTimer = null;
		}

		await this.flush();
	}

	// Track an event
	async track(
		eventType: AnalyticsEventType,
		userId: string,
		properties: Record<string, unknown> = {},
		context?: Partial<AnalyticsEvent["context"]>
	): Promise<void> {
		if (!this.isRunning) return;

		const event: AnalyticsEvent = {
			id: crypto.randomUUID(),
			type: eventType,
			timestamp: new Date(),
			userId,
			properties,
			context: context as AnalyticsEvent["context"],
		};

		// Apply filters
		for (const filter of this.config.filters) {
			if (!filter.shouldInclude(event)) {
				return;
			}
		}

		// Apply transformers
		let transformedEvent: AnalyticsEvent | null = event;
		for (const transformer of this.config.transformers) {
			if (transformedEvent) {
				transformedEvent = transformer.transform(transformedEvent);
			}
			if (!transformedEvent) break;
		}

		if (!transformedEvent) return;

		// Apply sampling
		if (this.config.sampling.enabled && Math.random() > this.config.sampling.rate) {
			return;
		}

		this.eventBuffer.push(transformedEvent);

		// Flush if buffer is full
		if (this.eventBuffer.length >= this.config.batchSize) {
			await this.flush();
		}
	}

	// Track user registration
	async trackUserRegistration(
		userId: string,
		registrationMethod: string,
		additionalData?: Record<string, unknown>
	): Promise<void> {
		await this.track(AnalyticsEventType.USER_REGISTRATION, userId, {
			registrationMethod,
			...additionalData,
		});
	}

	// Track course enrollment
	async trackCourseEnrollment(
		userId: string,
		courseId: string,
		courseName: string,
		enrollmentType: "free" | "paid" = "free"
	): Promise<void> {
		await this.track(AnalyticsEventType.COURSE_ENROLLMENT, userId, {
			courseId,
			courseName,
			enrollmentType,
		});
	}

	// Track lesson completion
	async trackLessonCompletion(
		userId: string,
		courseId: string,
		lessonId: string,
		lessonName: string,
		timeSpent: number,
		completionRate: number
	): Promise<void> {
		await this.track(AnalyticsEventType.LESSON_COMPLETION, userId, {
			courseId,
			lessonId,
			lessonName,
			timeSpent,
			completionRate,
		});
	}

	// Track course completion
	async trackCourseCompletion(
		userId: string,
		courseId: string,
		courseName: string,
		totalTimeSpent: number,
		averageCompletionRate: number
	): Promise<void> {
		await this.track(AnalyticsEventType.COURSE_COMPLETION, userId, {
			courseId,
			courseName,
			totalTimeSpent,
			averageCompletionRate,
		});
	}

	// Track achievement unlocked
	async trackAchievementUnlocked(
		userId: string,
		achievementId: string,
		achievementName: string,
		xpReward: number
	): Promise<void> {
		await this.track(AnalyticsEventType.ACHIEVEMENT_UNLOCKED, userId, {
			achievementId,
			achievementName,
			xpReward,
		});
	}

	// Track XP earned
	async trackXPEarned(
		userId: string,
		amount: number,
		source: string,
		sourceId?: string
	): Promise<void> {
		await this.track(AnalyticsEventType.XP_EARNED, userId, {
			amount,
			source,
			sourceId,
		});
	}

	// Track feature usage
	async trackFeatureUsage(
		userId: string,
		featureName: string,
		action: string,
		properties?: Record<string, unknown>
	): Promise<void> {
		await this.track(AnalyticsEventType.FEATURE_USAGE, userId, {
			featureName,
			action,
			...properties,
		});
	}

	// Track search performed
	async trackSearchPerformed(
		userId: string,
		query: string,
		resultsCount: number,
		filters?: Record<string, unknown>
	): Promise<void> {
		await this.track(AnalyticsEventType.SEARCH_PERFORMED, userId, {
			query,
			resultsCount,
			filters,
		});
	}

	// Track time spent
	async trackTimeSpent(
		userId: string,
		activity: string,
		duration: number,
		context?: Record<string, unknown>
	): Promise<void> {
		await this.track(AnalyticsEventType.TIME_SPENT, userId, {
			activity,
			duration,
			...context,
		});
	}

	// Get analytics statistics
	getStats(): {
		totalEvents: number;
		bufferedEvents: number;
		processedEvents: number;
		droppedEvents: number;
		uptime: number;
	} {
		return {
			totalEvents: 0,
			bufferedEvents: this.eventBuffer.length,
			processedEvents: 0,
			droppedEvents: 0,
			uptime: 0,
		};
	}

	// Flush events to destinations
	private async flush(): Promise<void> {
		if (this.eventBuffer.length === 0) return;

		const events = [...this.eventBuffer];
		this.eventBuffer = [];

		const sendPromises = this.config.destinations.map(async (destination) => {
			let attempts = 0;
			while (attempts < this.config.retryAttempts) {
				try {
					await destination.send(events);
					return;
				} catch (error) {
					attempts++;
					if (attempts < this.config.retryAttempts) {
						await new Promise((resolve) => setTimeout(resolve, this.config.retryDelay));
					} else {
						console.error(`Failed to send events to ${destination.name}:`, error);
						// Put events back in buffer
						this.eventBuffer.unshift(...events);
					}
				}
			}
		});

		await Promise.all(sendPromises);
	}

	// Start flush timer
	private startFlushTimer(): void {
		this.flushTimer = setInterval(() => {
			this.flush().catch((error) => {
				console.error("Error in flush timer:", error);
			});
		}, this.config.flushInterval);
	}
}

// Analytics Factory
export const AnalyticsFactory = {
	createAnalyticsService(config: AnalyticsConfig): AnalyticsService {
		return new AnalyticsService(config);
	},

	createDefaultConfig(serviceName: string): AnalyticsConfig {
		return {
			serviceName,
			environment: "development",
			batchSize: 100,
			flushInterval: 30_000, // 30 seconds
			retryAttempts: 3,
			retryDelay: 1000, // 1 second
			destinations: [new FileDestination("default", "analytics.log")],
			transformers: [],
			filters: [],
			sampling: {
				enabled: false,
				rate: 1.0,
			},
			privacy: {
				anonymizeIp: false,
				excludeFields: [],
				retentionDays: 365,
			},
		};
	},

	createProductionConfig(
		serviceName: string,
		analyticsEndpoint?: string,
		databaseUrl?: string
	): AnalyticsConfig {
		const destinations: AnalyticsDestination[] = [];

		if (analyticsEndpoint) {
			destinations.push(new HTTPDestination("analytics-api", analyticsEndpoint));
		}

		if (databaseUrl) {
			destinations.push(
				new DatabaseDestination("analytics-db", databaseUrl, "analytics_events")
			);
		}

		return {
			serviceName,
			environment: "production",
			batchSize: 100,
			flushInterval: 60_000, // 1 minute
			retryAttempts: 5,
			retryDelay: 2000, // 2 seconds
			destinations,
			transformers: [
				new PrivacyTransformer({
					anonymizeIp: true,
					excludeFields: ["context.device.id", "context.ip"],
				}),
				new EnrichmentTransformer([
					(_event) => ({
						processedAt: new Date().toISOString(),
						environment: "production",
					}),
				]),
			],
			filters: [],
			sampling: {
				enabled: true,
				rate: 0.1, // 10% sampling
			},
			privacy: {
				anonymizeIp: true,
				excludeFields: ["context.device.id", "context.ip"],
				retentionDays: 2555, // 7 years
			},
		};
	},
};

// Cohort Analysis
export class CohortAnalysis {
	// Analyze user cohorts
	async analyzeCohorts(
		_cohortDefinition: {
			dimension: "registration_date" | "first_course_enrollment" | "first_lesson_completion";
			period: "day" | "week" | "month";
			size: number;
		},
		_metrics: Array<{
			name: string;
			eventType: AnalyticsEventType;
			aggregation: "count" | "sum" | "avg";
			property?: string;
		}>,
		_timeRange: {
			start: Date;
			end: Date;
		}
	): Promise<CohortResult[]> {
		// In a real implementation, this would query analytics data
		// For now, return mock data
		return [];
	}

	// Calculate retention rates
	async calculateRetention(cohortSize: number, periods: number): Promise<RetentionResult> {
		// Mock implementation
		return {
			cohortSize,
			retentionRates: Array.from({ length: periods }, (_, i) => Math.max(0, 1 - i * 0.1)),
		};
	}
}

export interface CohortResult {
	cohortId: string;
	cohortSize: number;
	period: number;
	metrics: Record<string, number>;
}

export interface RetentionResult {
	cohortSize: number;
	retentionRates: number[];
}

// A/B Testing Framework
export class ABTesting {
	private analytics: AnalyticsService;
	private experiments: Map<string, Experiment> = new Map();

	constructor(analytics: AnalyticsService) {
		this.analytics = analytics;
	}

	// Create experiment
	createExperiment(
		id: string,
		name: string,
		variants: Array<{ id: string; name: string; weight: number }>,
		targetMetric: string
	): void {
		this.experiments.set(id, {
			id,
			name,
			variants,
			targetMetric,
			startDate: new Date(),
			status: "active",
		});
	}

	// Assign user to variant
	assignUser(experimentId: string, userId: string): string | null {
		const experiment = this.experiments.get(experimentId);
		if (!experiment || experiment.status !== "active") return null;

		// Simple hash-based assignment
		const hash = this.hashString(userId + experimentId);
		const totalWeight = experiment.variants.reduce((sum, v) => sum + v.weight, 0);
		let cumulativeWeight = 0;

		for (const variant of experiment.variants) {
			cumulativeWeight += variant.weight;
			if (hash % totalWeight < cumulativeWeight) {
				return variant.id;
			}
		}

		return experiment.variants[0].id; // Fallback
	}

	// Track experiment event
	async trackExperimentEvent(
		experimentId: string,
		userId: string,
		eventType: AnalyticsEventType,
		properties: Record<string, unknown> = {}
	): Promise<void> {
		const variantId = this.assignUser(experimentId, userId);
		if (!variantId) return;

		await this.analytics.track(eventType, userId, {
			experimentId,
			variantId,
			...properties,
		});
	}

	// Get experiment results
	getExperimentResults(experimentId: string): ExperimentResult | null {
		const experiment = this.experiments.get(experimentId);
		if (!experiment) return null;

		// Mock results - in real implementation, this would query analytics data
		return {
			experimentId,
			variants: experiment.variants.map((v) => ({
				id: v.id,
				name: v.name,
				participants: Math.floor(Math.random() * 1000),
				conversions: Math.floor(Math.random() * 100),
				conversionRate: Math.random(),
			})),
			winner: experiment.variants[Math.floor(Math.random() * experiment.variants.length)].id,
			confidence: Math.random() * 100,
		};
	}

	private hashString(str: string): number {
		let hash = 0;
		for (let i = 0; i < str.length; i++) {
			const char = str.charCodeAt(i);
			hash = (hash << 5) - hash + char;
			hash &= hash; // Convert to 32-bit integer
		}
		return Math.abs(hash);
	}
}

interface Experiment {
	id: string;
	name: string;
	variants: Array<{ id: string; name: string; weight: number }>;
	targetMetric: string;
	startDate: Date;
	status: "active" | "completed" | "stopped";
}

export interface ExperimentResult {
	experimentId: string;
	variants: Array<{
		id: string;
		name: string;
		participants: number;
		conversions: number;
		conversionRate: number;
	}>;
	winner: string;
	confidence: number;
}
