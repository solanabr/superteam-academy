// Error Monitoring and Alerting Implementation
import { z } from "zod";

// Error Severity Levels
export enum ErrorSeverity {
	LOW = "low",
	MEDIUM = "medium",
	HIGH = "high",
	CRITICAL = "critical",
}

// Error Categories
export enum ErrorCategory {
	NETWORK = "network",
	DATABASE = "database",
	AUTHENTICATION = "authentication",
	AUTHORIZATION = "authorization",
	VALIDATION = "validation",
	BUSINESS_LOGIC = "business_logic",
	EXTERNAL_SERVICE = "external_service",
	PERFORMANCE = "performance",
	SECURITY = "security",
	UNKNOWN = "unknown",
}

// Error Context Schema
export const ErrorContextSchema = z.object({
	userId: z.string().optional(),
	sessionId: z.string().optional(),
	requestId: z.string().optional(),
	userAgent: z.string().optional(),
	ipAddress: z.string().optional(),
	url: z.string().optional(),
	method: z.string().optional(),
	timestamp: z.date(),
	environment: z.string(),
	version: z.string(),
	tags: z.array(z.string()).optional(),
	customData: z.record(z.string(), z.unknown()).optional(),
});

export type ErrorContext = z.infer<typeof ErrorContextSchema>;

// Error Report Schema
export const ErrorReportSchema = z.object({
	id: z.string().uuid(),
	message: z.string(),
	stack: z.string().optional(),
	name: z.string(),
	severity: z.nativeEnum(ErrorSeverity),
	category: z.nativeEnum(ErrorCategory),
	context: ErrorContextSchema,
	fingerprint: z.string(), // For grouping similar errors
	occurrences: z.number().default(1),
	firstSeen: z.date(),
	lastSeen: z.date(),
	resolved: z.boolean().default(false),
	resolvedAt: z.date().optional(),
	assignedTo: z.string().optional(),
	comments: z
		.array(
			z.object({
				id: z.string().uuid(),
				author: z.string(),
				message: z.string(),
				timestamp: z.date(),
			})
		)
		.optional(),
});

export type ErrorReport = z.infer<typeof ErrorReportSchema>;

// Alert Configuration
export interface AlertConfig {
	enabled: boolean;
	channels: AlertChannel[];
	thresholds: {
		errorRate: number; // errors per minute
		responseTime: number; // milliseconds
		errorCount: number; // consecutive errors
	};
	cooldownPeriod: number; // milliseconds
}

// Alert Channel Interface
export interface AlertChannel {
	name: string;
	type: "email" | "slack" | "webhook" | "pagerduty" | "opsgenie";
	sendAlert(alert: Alert): Promise<void>;
}

// Alert Types
export enum AlertType {
	ERROR_RATE_SPIKE = "error_rate_spike",
	HIGH_ERROR_COUNT = "high_error_count",
	CRITICAL_ERROR = "critical_error",
	PERFORMANCE_DEGRADATION = "performance_degradation",
	SERVICE_DOWN = "service_down",
}

// Alert Schema
export const AlertSchema = z.object({
	id: z.string().uuid(),
	type: z.nativeEnum(AlertType),
	severity: z.nativeEnum(ErrorSeverity),
	title: z.string(),
	description: z.string(),
	service: z.string(),
	environment: z.string(),
	timestamp: z.date(),
	data: z.record(z.string(), z.unknown()),
	acknowledged: z.boolean().default(false),
	acknowledgedBy: z.string().optional(),
	acknowledgedAt: z.date().optional(),
	resolved: z.boolean().default(false),
	resolvedAt: z.date().optional(),
});

export type Alert = z.infer<typeof AlertSchema>;

// Built-in Alert Channels
export class EmailAlertChannel implements AlertChannel {
	name: string;
	type = "email" as const;

	constructor(name: string, _recipients: string[], _smtpConfig?: unknown) {
		this.name = name;
	}

	async sendAlert(_alert: Alert): Promise<void> {
		// ignored
	}
}

export class SlackAlertChannel implements AlertChannel {
	name: string;
	type = "slack" as const;
	private webhookUrl: string;
	private channel: string;

	constructor(name: string, webhookUrl: string, channel: string) {
		this.name = name;
		this.webhookUrl = webhookUrl;
		this.channel = channel;
	}

	async sendAlert(alert: Alert): Promise<void> {
		const payload = {
			channel: this.channel,
			text: `*${alert.severity.toUpperCase()}*: ${alert.title}`,
			blocks: [
				{
					type: "header",
					text: {
						type: "plain_text",
						text: alert.title,
					},
				},
				{
					type: "section",
					text: {
						type: "mrkdwn",
						text: alert.description,
					},
				},
				{
					type: "section",
					fields: [
						{
							type: "mrkdwn",
							text: `*Service:* ${alert.service}`,
						},
						{
							type: "mrkdwn",
							text: `*Environment:* ${alert.environment}`,
						},
						{
							type: "mrkdwn",
							text: `*Time:* ${alert.timestamp.toISOString()}`,
						},
					],
				},
			],
		};

		try {
			const response = await fetch(this.webhookUrl, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				console.error(`Slack alert failed: ${response.status}`);
			}
		} catch (error) {
			console.error("Error sending Slack alert:", error);
		}
	}
}

export class WebhookAlertChannel implements AlertChannel {
	name: string;
	type = "webhook" as const;
	private url: string;
	private headers: Record<string, string>;

	constructor(name: string, url: string, headers: Record<string, string> = {}) {
		this.name = name;
		this.url = url;
		this.headers = headers;
	}

	async sendAlert(alert: Alert): Promise<void> {
		try {
			const response = await fetch(this.url, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					...this.headers,
				},
				body: JSON.stringify(alert),
			});

			if (!response.ok) {
				console.error(`Webhook alert failed: ${response.status}`);
			}
		} catch (error) {
			console.error("Error sending webhook alert:", error);
		}
	}
}

// Error Monitoring Service
export class ErrorMonitoringService {
	private serviceName: string;
	private environment: string;
	private version: string;
	private alertConfig: AlertConfig;
	private errorReports: Map<string, ErrorReport> = new Map();
	private recentErrors: ErrorReport[] = [];
	private alertCooldowns: Map<string, number> = new Map();
	private isRunning = false;

	constructor(
		serviceName: string,
		environment: string,
		version: string,
		alertConfig: AlertConfig
	) {
		this.serviceName = serviceName;
		this.environment = environment;
		this.version = version;
		this.alertConfig = alertConfig;
	}

	// Start error monitoring
	async start(): Promise<void> {
		this.isRunning = true;
	}

	// Stop error monitoring
	async stop(): Promise<void> {
		this.isRunning = false;
	}

	// Capture an error
	async captureError(
		error: Error,
		context: Partial<ErrorContext> = {},
		severity: ErrorSeverity = ErrorSeverity.MEDIUM,
		category: ErrorCategory = ErrorCategory.UNKNOWN
	): Promise<string> {
		if (!this.isRunning) return "";

		const fullContext: ErrorContext = {
			timestamp: new Date(),
			environment: this.environment,
			version: this.version,
			...context,
		};

		// Generate fingerprint for grouping
		const fingerprint = this.generateFingerprint(error, category);

		// Check if this error already exists
		let report = this.errorReports.get(fingerprint);

		if (report) {
			// Update existing report
			report.occurrences++;
			report.lastSeen = new Date();
			report.context = fullContext; // Update with latest context
		} else {
			// Create new report
			report = {
				id: crypto.randomUUID(),
				message: error.message,
				stack: error.stack,
				name: error.name,
				severity,
				category,
				context: fullContext,
				fingerprint,
				occurrences: 1,
				firstSeen: new Date(),
				lastSeen: new Date(),
				resolved: false,
			};
			this.errorReports.set(fingerprint, report);
		}

		// Add to recent errors for rate monitoring
		this.recentErrors.push(report);
		this.cleanupRecentErrors();

		// Check for alerts
		await this.checkAlerts(report);

		return report.id;
	}

	// Capture exception with automatic categorization
	async captureException(error: Error, context: Partial<ErrorContext> = {}): Promise<string> {
		const category = this.categorizeError(error);
		const severity = this.determineSeverity(error, category);

		return this.captureError(error, context, severity, category);
	}

	// Manually create alert
	async createAlert(
		type: AlertType,
		title: string,
		description: string,
		severity: ErrorSeverity,
		data: Record<string, unknown> = {}
	): Promise<void> {
		if (!this.alertConfig.enabled) return;

		const alert: Alert = {
			id: crypto.randomUUID(),
			type,
			severity,
			title,
			description,
			service: this.serviceName,
			environment: this.environment,
			timestamp: new Date(),
			data,
			acknowledged: false,
			resolved: false,
		};

		// Check cooldown
		const cooldownKey = `${type}:${severity}`;
		const lastAlert = this.alertCooldowns.get(cooldownKey);
		const now = Date.now();

		if (lastAlert && now - lastAlert < this.alertConfig.cooldownPeriod) {
			return; // Still in cooldown
		}

		this.alertCooldowns.set(cooldownKey, now);

		// Send to all channels
		await Promise.all(this.alertConfig.channels.map((channel) => channel.sendAlert(alert)));
	}

	// Get error reports
	getErrorReports(resolved = false, limit = 100, offset = 0): ErrorReport[] {
		const reports = Array.from(this.errorReports.values())
			.filter((report) => report.resolved === resolved)
			.sort((a, b) => b.lastSeen.getTime() - a.lastSeen.getTime())
			.slice(offset, offset + limit);

		return reports;
	}

	// Get error report by ID
	getErrorReport(id: string): ErrorReport | undefined {
		return Array.from(this.errorReports.values()).find((report) => report.id === id);
	}

	// Resolve error report
	async resolveError(id: string, comment?: string): Promise<boolean> {
		const report = this.getErrorReport(id);
		if (!report || report.resolved) return false;

		report.resolved = true;
		report.resolvedAt = new Date();

		if (comment) {
			report.comments = report.comments || [];
			report.comments.push({
				id: crypto.randomUUID(),
				author: "system",
				message: comment,
				timestamp: new Date(),
			});
		}

		return true;
	}

	// Get error statistics
	getErrorStats(): {
		totalErrors: number;
		unresolvedErrors: number;
		criticalErrors: number;
		errorRate: number; // errors per minute
		topCategories: Array<{ category: ErrorCategory; count: number }>;
	} {
		const now = Date.now();
		const oneMinuteAgo = now - 60_000;

		const recentErrors = this.recentErrors.filter(
			(error) => error.context.timestamp.getTime() > oneMinuteAgo
		);

		const categoryCounts = new Map<ErrorCategory, number>();
		let criticalCount = 0;

		for (const report of this.errorReports.values()) {
			if (!report.resolved) {
				categoryCounts.set(
					report.category,
					(categoryCounts.get(report.category) || 0) + report.occurrences
				);

				if (report.severity === ErrorSeverity.CRITICAL) {
					criticalCount += report.occurrences;
				}
			}
		}

		const topCategories = Array.from(categoryCounts.entries())
			.sort(([, a], [, b]) => b - a)
			.slice(0, 5)
			.map(([category, count]) => ({ category, count }));

		return {
			totalErrors: Array.from(this.errorReports.values()).reduce(
				(sum, report) => sum + report.occurrences,
				0
			),
			unresolvedErrors: Array.from(this.errorReports.values()).filter(
				(report) => !report.resolved
			).length,
			criticalErrors: criticalCount,
			errorRate: recentErrors.length,
			topCategories,
		};
	}

	// Generate error fingerprint
	private generateFingerprint(error: Error, category: ErrorCategory): string {
		// Simple fingerprint based on error name, message, and stack trace
		const stack = error.stack || "";
		const stackLines = stack.split("\n").slice(0, 5).join("\n");
		return btoa(`${error.name}:${error.message}:${category}:${stackLines}`).slice(0, 32);
	}

	// Categorize error automatically
	private categorizeError(error: Error): ErrorCategory {
		const message = error.message.toLowerCase();
		const name = error.name.toLowerCase();

		if (
			message.includes("network") ||
			message.includes("fetch") ||
			message.includes("connection")
		) {
			return ErrorCategory.NETWORK;
		}

		if (message.includes("database") || message.includes("sql") || message.includes("query")) {
			return ErrorCategory.DATABASE;
		}

		if (message.includes("auth") || message.includes("login") || message.includes("token")) {
			return ErrorCategory.AUTHENTICATION;
		}

		if (
			message.includes("permission") ||
			message.includes("forbidden") ||
			message.includes("unauthorized")
		) {
			return ErrorCategory.AUTHORIZATION;
		}

		if (
			message.includes("validation") ||
			message.includes("invalid") ||
			name.includes("validation")
		) {
			return ErrorCategory.VALIDATION;
		}

		if (message.includes("timeout") || message.includes("performance")) {
			return ErrorCategory.PERFORMANCE;
		}

		if (
			message.includes("security") ||
			message.includes("attack") ||
			message.includes("breach")
		) {
			return ErrorCategory.SECURITY;
		}

		return ErrorCategory.UNKNOWN;
	}

	// Determine severity based on error and category
	private determineSeverity(error: Error, category: ErrorCategory): ErrorSeverity {
		// Critical errors
		if (category === ErrorCategory.SECURITY) {
			return ErrorSeverity.CRITICAL;
		}

		if (error.name === "TypeError" && error.message.includes("undefined")) {
			return ErrorSeverity.HIGH;
		}

		// High severity for certain categories
		if (
			[ErrorCategory.DATABASE, ErrorCategory.AUTHENTICATION, ErrorCategory.NETWORK].includes(
				category
			)
		) {
			return ErrorSeverity.HIGH;
		}

		// Medium severity for business logic and validation
		if ([ErrorCategory.BUSINESS_LOGIC, ErrorCategory.VALIDATION].includes(category)) {
			return ErrorSeverity.MEDIUM;
		}

		// Low severity for unknown or external service errors
		return ErrorSeverity.LOW;
	}

	// Check for alerts based on error patterns
	private async checkAlerts(report: ErrorReport): Promise<void> {
		if (!this.alertConfig.enabled) return;

		const stats = this.getErrorStats();

		// Check error rate
		if (stats.errorRate > this.alertConfig.thresholds.errorRate) {
			await this.createAlert(
				AlertType.ERROR_RATE_SPIKE,
				"High Error Rate Detected",
				`Error rate of ${stats.errorRate} errors/minute exceeds threshold of ${this.alertConfig.thresholds.errorRate}`,
				ErrorSeverity.HIGH,
				{ errorRate: stats.errorRate, threshold: this.alertConfig.thresholds.errorRate }
			);
		}

		// Check critical errors
		if (report.severity === ErrorSeverity.CRITICAL) {
			await this.createAlert(
				AlertType.CRITICAL_ERROR,
				"Critical Error Occurred",
				`Critical error: ${report.message}`,
				ErrorSeverity.CRITICAL,
				{ errorId: report.id, category: report.category }
			);
		}

		// Check consecutive errors (simplified)
		const recentCriticalErrors = this.recentErrors
			.filter((e) => e.severity === ErrorSeverity.CRITICAL)
			.slice(-this.alertConfig.thresholds.errorCount);

		if (recentCriticalErrors.length >= this.alertConfig.thresholds.errorCount) {
			await this.createAlert(
				AlertType.HIGH_ERROR_COUNT,
				"High Consecutive Error Count",
				`${recentCriticalErrors.length} consecutive critical errors detected`,
				ErrorSeverity.HIGH,
				{
					errorCount: recentCriticalErrors.length,
					threshold: this.alertConfig.thresholds.errorCount,
				}
			);
		}
	}

	// Clean up old recent errors (keep last 1000)
	private cleanupRecentErrors(): void {
		if (this.recentErrors.length > 1000) {
			this.recentErrors = this.recentErrors.slice(-500);
		}
	}
}

// Error Monitoring Factory
export const ErrorMonitoringFactory = {
	createErrorMonitoringService(
		serviceName: string,
		environment: string,
		version: string,
		alertConfig: AlertConfig
	): ErrorMonitoringService {
		return new ErrorMonitoringService(serviceName, environment, version, alertConfig);
	},

	createDefaultAlertConfig(): AlertConfig {
		return {
			enabled: true,
			channels: [new EmailAlertChannel("default", ["admin@example.com"])],
			thresholds: {
				errorRate: 10, // 10 errors per minute
				responseTime: 5000, // 5 seconds
				errorCount: 5, // 5 consecutive errors
			},
			cooldownPeriod: 300_000, // 5 minutes
		};
	},

	createProductionAlertConfig(slackWebhook?: string, emailRecipients?: string[]): AlertConfig {
		const channels: AlertChannel[] = [];

		if (slackWebhook) {
			channels.push(new SlackAlertChannel("production-slack", slackWebhook, "#alerts"));
		}

		if (emailRecipients && emailRecipients.length > 0) {
			channels.push(new EmailAlertChannel("production-email", emailRecipients));
		}

		return {
			enabled: true,
			channels,
			thresholds: {
				errorRate: 5, // 5 errors per minute
				responseTime: 3000, // 3 seconds
				errorCount: 3, // 3 consecutive errors
			},
			cooldownPeriod: 600_000, // 10 minutes
		};
	},
};

// Global error handler integration
export class GlobalErrorHandler {
	private errorMonitoring: ErrorMonitoringService;

	constructor(errorMonitoring: ErrorMonitoringService) {
		this.errorMonitoring = errorMonitoring;
	}

	// Setup global error handlers
	setupGlobalHandlers(): void {
		// Handle uncaught exceptions
		process.on("uncaughtException", async (error) => {
			console.error("Uncaught Exception:", error);
			await this.errorMonitoring.captureException(error, {
				tags: ["uncaught", "exception"],
			});
		});

		// Handle unhandled promise rejections
		process.on("unhandledRejection", async (reason, promise) => {
			const error = reason instanceof Error ? reason : new Error(String(reason));
			console.error("Unhandled Rejection:", error);
			await this.errorMonitoring.captureException(error, {
				tags: ["unhandled", "rejection"],
				customData: { promise: promise.toString() },
			});
		});

		// Handle browser errors (if in browser environment)
		if (typeof window !== "undefined") {
			window.addEventListener("error", async (event) => {
				const error = event.error || new Error(event.message);
				await this.errorMonitoring.captureException(error, {
					url: event.filename,
					customData: {
						lineno: event.lineno,
						colno: event.colno,
					},
					tags: ["browser", "error"],
				});
			});

			window.addEventListener("unhandledrejection", async (event) => {
				const error =
					event.reason instanceof Error ? event.reason : new Error(String(event.reason));
				await this.errorMonitoring.captureException(error, {
					tags: ["browser", "unhandled-rejection"],
				});
			});
		}
	}

	// Create error boundary for React components (if React is available)
	createErrorBoundary(): unknown {
		if (!React) return null;

		const ReactModule = React as unknown as {
			Component: new (
				props: unknown
			) => {
				state: { hasError: boolean; error: Error | null };
				props: { fallback?: unknown; children?: unknown };
			};
			createElement: (...args: unknown[]) => unknown;
		};

		const monitoring = this.errorMonitoring;

		return class ErrorBoundary extends ReactModule.Component {
			constructor(props: unknown) {
				super(props);
				this.state = { hasError: false, error: null };
			}

			static getDerivedStateFromError(error: Error) {
				return { hasError: true, error };
			}

			componentDidCatch(error: Error, errorInfo: unknown) {
				const info = errorInfo as { componentStack?: string } | null;
				monitoring.captureException(error, {
					customData: {
						componentStack: info?.componentStack,
					},
					tags: ["react", "error-boundary"],
				});
			}

			render() {
				if (this.state.hasError && this.state.error) {
					const Fallback = this.props.fallback || DefaultErrorFallback;
					return ReactModule.createElement(Fallback, { error: this.state.error });
				}

				return this.props.children;
			}
		};
	}
}

// Default error fallback component
function DefaultErrorFallback({ error }: { error: Error }) {
	const ReactModule = React as { createElement: (...args: unknown[]) => unknown } | null;
	if (ReactModule) {
		return ReactModule.createElement(
			"div",
			{ className: "error-fallback" },
			ReactModule.createElement("h2", null, "Something went wrong"),
			ReactModule.createElement("p", null, error.message),
			ReactModule.createElement(
				"button",
				{ onClick: () => window.location.reload() },
				"Reload Page"
			)
		);
	}
	// Fallback if React is not available
	return null;
}

// React import for error boundary (conditional)
let React: unknown = null;
try {
	React = require("react");
} catch {
	// React not available, error boundary won't work
}
