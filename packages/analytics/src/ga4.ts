// GA4 Analytics Implementation
import { z } from "zod";

// GA4 Event Types
export enum GA4EventType {
	PAGE_VIEW = "page_view",
	USER_ENGAGEMENT = "user_engagement",
	SCROLL = "scroll",
	CLICK = "click",
	FORM_SUBMIT = "form_submit",
	COURSE_START = "course_start",
	COURSE_COMPLETE = "course_complete",
	CHALLENGE_ATTEMPT = "challenge_attempt",
	CHALLENGE_SUCCESS = "challenge_success",
	XP_EARNED = "xp_earned",
	LEVEL_UP = "level_up",
	ACHIEVEMENT_UNLOCKED = "achievement_unlocked",
	STREAK_MAINTAINED = "streak_maintained",
	LEADERBOARD_VIEW = "leaderboard_view",
	SOCIAL_SHARE = "social_share",
	PURCHASE = "purchase",
	REFERRAL = "referral",
}

// GA4 Event Schema
export const GA4EventSchema = z.object({
	name: z.string(),
	parameters: z.record(z.string(), z.unknown()).optional(),
});

export type GA4Event = z.infer<typeof GA4EventSchema>;

// GA4 Configuration
export interface GA4Config {
	measurementId: string;
	apiSecret: string;
	debug?: boolean;
	customParameters?: Record<string, unknown>;
	privacySettings?: {
		anonymizeIp: boolean;
		disableAdvertisingFeatures: boolean;
		dataRetentionDays: number;
	};
	crossDomainSettings?: {
		domains: string[];
		linkerParameter: string;
	};
}

// GA4 Client
export class GA4Client {
	private config: GA4Config;
	private baseUrl = "https://www.google-analytics.com/mp/collect";

	constructor(config: GA4Config) {
		this.config = config;
	}

	getConfig(): GA4Config {
		return this.config;
	}

	// Send event to GA4
	async sendEvent(
		clientId: string,
		event: GA4Event,
		userProperties?: Record<string, unknown>
	): Promise<boolean> {
		try {
			const payload = {
				client_id: clientId,
				events: [
					{
						name: event.name,
						params: {
							...event.parameters,
							...this.config.customParameters,
							debug_mode: this.config.debug ? 1 : 0,
							// Privacy controls
							...(this.config.privacySettings?.anonymizeIp && {
								anonymize_ip: true,
							}),
						},
					},
				],
				user_properties: userProperties,
			};

			const response = await fetch(
				`${this.baseUrl}?measurement_id=${this.config.measurementId}&api_secret=${this.config.apiSecret}`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(payload),
				}
			);

			return response.ok;
		} catch (error) {
			console.error("GA4 event send failed:", error);
			return false;
		}
	}

	// Send multiple events
	async sendEvents(
		clientId: string,
		events: GA4Event[],
		userProperties?: Record<string, unknown>
	): Promise<boolean> {
		try {
			const payload: {
				client_id: string;
				events: Array<{ name: string; params: Record<string, unknown> }>;
				user_properties?: Record<string, unknown>;
			} = {
				client_id: clientId,
				events: events.map((event) => ({
					name: event.name,
					params: {
						...event.parameters,
						...this.config.customParameters,
						debug_mode: this.config.debug ? 1 : 0,
						// Privacy controls
						...(this.config.privacySettings?.anonymizeIp && {
							anonymize_ip: true,
						}),
					},
				})),
			};

			// Only include user_properties if provided
			if (userProperties && Object.keys(userProperties).length > 0) {
				payload.user_properties = userProperties;
			}

			const response = await fetch(
				`${this.baseUrl}?measurement_id=${this.config.measurementId}&api_secret=${this.config.apiSecret}`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(payload),
				}
			);

			return response.ok;
		} catch (error) {
			console.error("GA4 events send failed:", error);
			return false;
		}
	}

	// Track page view
	async trackPageView(
		clientId: string,
		pageTitle: string,
		pageLocation: string,
		userId?: string
	): Promise<boolean> {
		return this.sendEvent(clientId, {
			name: GA4EventType.PAGE_VIEW,
			parameters: {
				page_title: pageTitle,
				page_location: pageLocation,
				user_id: userId,
			},
		});
	}

	// Track user engagement
	async trackEngagement(
		clientId: string,
		engagementTime: number,
		sessionId: string,
		userId?: string
	): Promise<boolean> {
		return this.sendEvent(clientId, {
			name: GA4EventType.USER_ENGAGEMENT,
			parameters: {
				engagement_time_msec: engagementTime,
				session_id: sessionId,
				user_id: userId,
			},
		});
	}

	// Track course progress
	async trackCourseProgress(
		clientId: string,
		courseId: string,
		courseName: string,
		progress: number,
		userId: string
	): Promise<boolean> {
		return this.sendEvent(clientId, {
			name: "course_progress",
			parameters: {
				course_id: courseId,
				course_name: courseName,
				progress_percentage: progress,
				user_id: userId,
			},
		});
	}

	// Track XP earning
	async trackXPEarned(
		clientId: string,
		amount: number,
		source: string,
		userId: string,
		level?: number
	): Promise<boolean> {
		return this.sendEvent(clientId, {
			name: GA4EventType.XP_EARNED,
			parameters: {
				xp_amount: amount,
				xp_source: source,
				user_id: userId,
				user_level: level,
			},
		});
	}

	// Track achievement unlock
	async trackAchievementUnlocked(
		clientId: string,
		achievementId: string,
		achievementName: string,
		rarity: string,
		userId: string
	): Promise<boolean> {
		return this.sendEvent(clientId, {
			name: GA4EventType.ACHIEVEMENT_UNLOCKED,
			parameters: {
				achievement_id: achievementId,
				achievement_name: achievementName,
				achievement_rarity: rarity,
				user_id: userId,
			},
		});
	}

	// Track leaderboard interaction
	async trackLeaderboardView(
		clientId: string,
		leaderboardType: string,
		userRank?: number,
		userId?: string
	): Promise<boolean> {
		return this.sendEvent(clientId, {
			name: GA4EventType.LEADERBOARD_VIEW,
			parameters: {
				leaderboard_type: leaderboardType,
				user_rank: userRank,
				...(userId && { user_id: userId }),
			},
		});
	}
}

// GA4 Analytics Service
export class GA4AnalyticsService {
	private client: GA4Client;
	private eventQueue: Array<{
		clientId: string;
		event: GA4Event;
		userProperties?: Record<string, unknown>;
	}> = [];
	private isProcessing = false;

	constructor(config: GA4Config) {
		this.client = new GA4Client(config);
	}

	// Get GA4 config
	getConfig(): GA4Config {
		return this.client.getConfig();
	}

	// Initialize GA4
	init(): void {
		// Load GA4 script if in browser environment
		if (typeof window !== "undefined") {
			this.loadGAScript();
		}
	}

	// Track event
	async trackEvent(
		clientId: string,
		event: GA4Event,
		userProperties?: Record<string, unknown>
	): Promise<void> {
		const queueItem: {
			clientId: string;
			event: GA4Event;
			userProperties?: Record<string, unknown>;
		} = { clientId, event };
		if (userProperties && Object.keys(userProperties).length > 0) {
			queueItem.userProperties = userProperties;
		}
		this.eventQueue.push(queueItem);
		await this.processQueue();
	}

	// Track user action
	async trackUserAction(
		clientId: string,
		action: string,
		category: string,
		label?: string,
		value?: number,
		userId?: string
	): Promise<void> {
		await this.trackEvent(clientId, {
			name: action,
			parameters: {
				event_category: category,
				event_label: label,
				value: value,
				user_id: userId,
			},
		});
	}

	// Track conversion
	async trackConversion(
		clientId: string,
		conversionType: string,
		value: number,
		currency = "USD",
		userId?: string
	): Promise<void> {
		await this.trackEvent(clientId, {
			name: "conversion",
			parameters: {
				conversion_type: conversionType,
				value: value,
				currency: currency,
				user_id: userId,
			},
		});
	}

	// Track funnel step
	async trackFunnelStep(
		clientId: string,
		funnelName: string,
		stepName: string,
		stepNumber: number,
		userId?: string
	): Promise<void> {
		await this.trackEvent(clientId, {
			name: "funnel_step",
			parameters: {
				funnel_name: funnelName,
				step_name: stepName,
				step_number: stepNumber,
				user_id: userId,
			},
		});
	}

	// Get analytics data (for reporting)
	async getAnalyticsData(
		startDate: string,
		endDate: string,
		metrics: string[],
		dimensions: string[]
	): Promise<unknown> {
		// This would integrate with GA4 Data API
		// For now, return mock data
		return {
			reports: [],
			metadata: {
				startDate,
				endDate,
				metrics,
				dimensions,
			},
		};
	}

	// Set user properties
	async setUserProperties(clientId: string, properties: Record<string, unknown>): Promise<void> {
		await this.trackEvent(clientId, {
			name: "set_user_properties",
			parameters: properties,
		});
	}

	// Track custom event
	async trackCustomEvent(
		clientId: string,
		eventName: string,
		parameters: Record<string, unknown>,
		userId?: string
	): Promise<void> {
		await this.trackEvent(clientId, {
			name: eventName,
			parameters: {
				...parameters,
				user_id: userId,
			},
		});
	}

	private async processQueue(): Promise<void> {
		if (this.isProcessing || this.eventQueue.length === 0) return;

		this.isProcessing = true;

		try {
			// Process events in batches
			const batchSize = 25;
			while (this.eventQueue.length > 0) {
				const batch = this.eventQueue.splice(0, batchSize);
				const clientId = batch[0].clientId;
				const events = batch.map((item) => item.event);
				const userProperties = batch[0].userProperties || {};

				await this.client.sendEvents(clientId, events, userProperties);
			}
		} catch (error) {
			console.error("Error processing event queue:", error);
		} finally {
			this.isProcessing = false;
		}
	}

	private loadGAScript(): void {
		// Load Google Analytics script
		const script = document.createElement("script");
		script.async = true;
		script.src = `https://www.googletagmanager.com/gtag/js?id=${this.client.getConfig().measurementId}`;
		document.head.appendChild(script);

		// Initialize gtag
		const win = window as unknown as { dataLayer: unknown[] };
		win.dataLayer = win.dataLayer || [];
		function gtag(...args: unknown[]) {
			win.dataLayer.push(args);
		}
		gtag("js", new Date());

		const config = this.client.getConfig();
		const privacySettings = config.privacySettings || {
			anonymizeIp: false,
			disableAdvertisingFeatures: false,
		};
		const crossDomainSettings = config.crossDomainSettings;

		gtag("config", config.measurementId, {
			// Privacy settings
			anonymize_ip: privacySettings.anonymizeIp,
			allow_ad_features: !privacySettings.disableAdvertisingFeatures,
			// Cross-domain tracking
			...(crossDomainSettings && {
				linker: {
					domains: crossDomainSettings.domains,
					decorate_forms: true,
				},
			}),
		});
	}
}

// Funnel Analysis
export class FunnelAnalysis {
	private _ga4Service: GA4AnalyticsService;

	constructor(ga4Service: GA4AnalyticsService) {
		this._ga4Service = ga4Service;
	}

	// Define funnel
	async defineFunnel(
		_funnelId: string,
		_name: string,
		_steps: Array<{
			name: string;
			eventName: string;
			conditions?: Record<string, unknown>;
		}>
	): Promise<void> {
		// ignored
	}

	// Track funnel progress
	async trackFunnelProgress(
		clientId: string,
		funnelId: string,
		userId: string,
		stepNumber: number,
		stepName: string
	): Promise<void> {
		await this._ga4Service.trackFunnelStep(clientId, funnelId, stepName, stepNumber, userId);
	}

	// Analyze funnel performance
	async analyzeFunnel(
		_funnelId: string,
		_startDate: string,
		_endDate: string
	): Promise<FunnelResult> {
		// In real implementation, this would query GA4 Data API
		return {
			funnelId: "",
			totalEntrants: 0,
			completionRates: [],
			dropOffPoints: [],
			averageTimeToComplete: 0,
		};
	}
}

export interface FunnelResult {
	funnelId: string;
	totalEntrants: number;
	completionRates: number[];
	dropOffPoints: Array<{ step: number; dropOffRate: number }>;
	averageTimeToComplete: number;
}

// Audience Segmentation
export class AudienceSegmentation {
	constructor(_ga4Service: GA4AnalyticsService) {}

	// Create audience segment
	async createSegment(
		_segmentId: string,
		_name: string,
		_conditions: Array<{
			dimension: string;
			operator: "equals" | "contains" | "greater_than" | "less_than";
			value: unknown;
		}>
	): Promise<void> {
		// ignored
	}

	// Analyze segment
	async analyzeSegment(
		_segmentId: string,
		_metrics: string[],
		_startDate: string,
		_endDate: string
	): Promise<SegmentAnalysis> {
		// In real implementation, this would query GA4 Data API
		return {
			segmentId: "",
			userCount: 0,
			metrics: {},
			topPages: [],
			topEvents: [],
		};
	}

	// Get segment users
	async getSegmentUsers(_segmentId: string): Promise<string[]> {
		// In real implementation, this would query user data
		return [];
	}
}

export interface SegmentAnalysis {
	segmentId: string;
	userCount: number;
	metrics: Record<string, number>;
	topPages: Array<{ page: string; views: number }>;
	topEvents: Array<{ event: string; count: number }>;
}

// Custom Reports and Dashboards
export class CustomReports {
	constructor(_ga4Service: GA4AnalyticsService) {}

	// Create custom report
	async createReport(
		_reportId: string,
		_name: string,
		_config: {
			dimensions: string[];
			metrics: string[];
			dateRange: { start: string; end: string };
			filters?: Array<{
				dimension: string;
				operator: string;
				value: unknown;
			}>;
			orderBy?: Array<{
				field: string;
				order: "ascending" | "descending";
			}>;
		}
	): Promise<void> {
		// ignored
	}

	// Generate report
	async generateReport(_reportId: string): Promise<ReportData> {
		// In real implementation, this would query GA4 Data API
		return {
			reportId: "",
			data: [],
			metadata: {
				totalRows: 0,
				sampling: false,
			},
		};
	}

	// Create dashboard
	async createDashboard(_dashboardId: string, _name: string, _reports: string[]): Promise<void> {
		// ignored
	}

	// Get dashboard data
	async getDashboardData(_dashboardId: string): Promise<DashboardData> {
		// In real implementation, this would aggregate multiple reports
		return {
			dashboardId: "",
			reports: [],
			lastUpdated: new Date().toISOString(),
		};
	}
}

export interface ReportData {
	reportId: string;
	data: Record<string, unknown>[];
	metadata: {
		totalRows: number;
		sampling: boolean;
	};
}

export interface DashboardData {
	dashboardId: string;
	reports: ReportData[];
	lastUpdated: string;
}

// Privacy Controls
export class PrivacyControls {
	private _ga4Service: GA4AnalyticsService;

	constructor(ga4Service: GA4AnalyticsService) {
		this._ga4Service = ga4Service;
	}

	// Configure privacy settings
	async configurePrivacy(
		clientId: string,
		settings: {
			analyticsStorage: "granted" | "denied";
			adStorage: "granted" | "denied";
			functionalityStorage: "granted" | "denied";
			personalizationStorage: "granted" | "denied";
			securityStorage: "granted" | "denied";
		}
	): Promise<void> {
		await this._ga4Service.trackEvent(clientId, {
			name: "consent_update",
			parameters: settings,
		});
	}

	// Handle GDPR consent
	async handleGDPRConsent(
		clientId: string,
		consentGiven: boolean,
		consentCategories: string[]
	): Promise<void> {
		await this._ga4Service.trackEvent(clientId, {
			name: "gdpr_consent",
			parameters: {
				consent_given: consentGiven,
				consent_categories: consentCategories,
			},
		});
	}

	// Delete user data
	async deleteUserData(_userId: string): Promise<void> {
		// ignored
	}

	// Export user data
	async exportUserData(userId: string): Promise<unknown> {
		// In real implementation, this would call GA4 Data API to export user data
		return {
			userId,
			data: {},
			exportedAt: new Date().toISOString(),
		};
	}
}

// Data Retention Management
export class DataRetentionManager {
	constructor(_ga4Service: GA4AnalyticsService) {}

	// Set data retention policy
	async setRetentionPolicy(_propertyId: string, _retentionDays: number): Promise<void> {
		// ignored
	}

	// Get current retention policy
	async getRetentionPolicy(_propertyId: string): Promise<number> {
		// In real implementation, this would query GA4 Admin API
		return 26; // Default 26 months
	}

	// Schedule data deletion
	async scheduleDataDeletion(_userId: string, _deleteAfterDays: number): Promise<void> {
		// ignored
	}
}

// Cross-Domain Tracking
export class CrossDomainTracking {
	private _ga4Service: GA4AnalyticsService;

	constructor(ga4Service: GA4AnalyticsService) {
		this._ga4Service = ga4Service;
	}

	// Configure cross-domain tracking
	async configureCrossDomain(_domains: string[], _linkerParameter = "_gl"): Promise<void> {
		// ignored
	}

	// Generate cross-domain link
	generateCrossDomainLink(targetUrl: string, sourceParams: Record<string, string>): string {
		// In real implementation, this would generate linker parameter
		const linkerParam = btoa(JSON.stringify(sourceParams));
		const config = this._ga4Service.getConfig();
		const linkerParameter = config.crossDomainSettings?.linkerParameter ?? "_gl";
		return `${targetUrl}?${linkerParameter}=${linkerParam}`;
	}

	// Process cross-domain linker
	processCrossDomainLink(linkerParam: string): Record<string, string> {
		try {
			return JSON.parse(atob(linkerParam));
		} catch {
			return {};
		}
	}
}

// GA4 Factory
export const GA4Factory = {
	createGA4Service(config: GA4Config): GA4AnalyticsService {
		const service = new GA4AnalyticsService(config);
		service.init();
		return service;
	},

	createGA4Client(config: GA4Config): GA4Client {
		return new GA4Client(config);
	},

	createFunnelAnalysis(ga4Service: GA4AnalyticsService): FunnelAnalysis {
		return new FunnelAnalysis(ga4Service);
	},

	createAudienceSegmentation(ga4Service: GA4AnalyticsService): AudienceSegmentation {
		return new AudienceSegmentation(ga4Service);
	},

	createCustomReports(ga4Service: GA4AnalyticsService): CustomReports {
		return new CustomReports(ga4Service);
	},

	createPrivacyControls(ga4Service: GA4AnalyticsService): PrivacyControls {
		return new PrivacyControls(ga4Service);
	},

	createDataRetentionManager(ga4Service: GA4AnalyticsService): DataRetentionManager {
		return new DataRetentionManager(ga4Service);
	},

	createCrossDomainTracking(ga4Service: GA4AnalyticsService): CrossDomainTracking {
		return new CrossDomainTracking(ga4Service);
	},
};
