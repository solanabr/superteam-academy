import type { ServiceResponse } from "../types";

export interface AnalyticsEvent {
	eventId: string;
	eventType: string;
	userId?: string;
	sessionId: string;
	timestamp: Date;
	properties: Record<string, unknown>;
	context?: {
		userAgent?: string;
		ip?: string;
		referrer?: string;
		url?: string;
	};
}

export interface AnalyticsMetric {
	name: string;
	value: number;
	timestamp: Date;
	dimensions: Record<string, string>;
}

export interface UserAnalytics {
	userId: string;
	totalSessions: number;
	totalTimeSpent: number; // in minutes
	coursesStarted: number;
	coursesCompleted: number;
	averageSessionDuration: number;
	lastActivity: Date;
	preferredTracks: number[];
	completionRate: number;
	streakData: {
		current: number;
		longest: number;
		average: number;
	};
}

export interface CourseAnalytics {
	courseId: string;
	totalEnrollments: number;
	totalCompletions: number;
	completionRate: number;
	averageCompletionTime: number; // in days
	dropOffPoints: { lessonIndex: number; dropOffRate: number }[];
	averageRating?: number;
	totalRatings: number;
}

export interface PlatformAnalytics {
	totalUsers: number;
	activeUsers: {
		daily: number;
		weekly: number;
		monthly: number;
	};
	totalCourses: number;
	totalEnrollments: number;
	totalCompletions: number;
	totalXpAwarded: number;
	topTracks: { trackId: number; enrollments: number }[];
	geographicDistribution: { country: string; users: number }[];
}

export interface AnalyticsService {
	trackEvent(
		event: Omit<AnalyticsEvent, "eventId" | "timestamp">
	): Promise<ServiceResponse<void>>;
	trackMetric(metric: Omit<AnalyticsMetric, "timestamp">): Promise<ServiceResponse<void>>;
	getUserAnalytics(
		userId: string,
		timeframe?: { start: Date; end: Date }
	): Promise<ServiceResponse<UserAnalytics>>;
	getCourseAnalytics(
		courseId: string,
		timeframe?: { start: Date; end: Date }
	): Promise<ServiceResponse<CourseAnalytics>>;
	getPlatformAnalytics(timeframe?: {
		start: Date;
		end: Date;
	}): Promise<ServiceResponse<PlatformAnalytics>>;
	getEventAnalytics(
		eventType: string,
		timeframe?: { start: Date; end: Date }
	): Promise<ServiceResponse<AnalyticsEvent[]>>;
	exportAnalytics(
		format: "csv" | "json",
		timeframe: { start: Date; end: Date }
	): Promise<ServiceResponse<string>>;
}
