import { z } from "zod";

export enum TelemetryEventType {
	APP_START = "app_start",
	APP_ERROR = "app_error",
	USER_ACTION = "user_action",
	PERFORMANCE_METRIC = "performance_metric",
	API_CALL = "api_call",
	DATABASE_QUERY = "database_query",
	CACHE_HIT = "cache_hit",
	CACHE_MISS = "cache_miss",
	FEATURE_USAGE = "feature_usage",
	USER_SESSION = "user_session",
	BUSINESS_METRIC = "business_metric",
}

export const TelemetryEventSchema = z.object({
	id: z.string().uuid(),
	timestamp: z.date(),
	type: z.nativeEnum(TelemetryEventType),
	userId: z.string().optional(),
	sessionId: z.string().optional(),
	properties: z.record(z.string(), z.unknown()),
	metrics: z.record(z.string(), z.number()).optional(),
	tags: z.array(z.string()).optional(),
	environment: z.string().optional(),
	version: z.string().optional(),
});

export type TelemetryEvent = z.infer<typeof TelemetryEventSchema>;

export interface TelemetryConfig {
	serviceName: string;
	serviceVersion: string;
	environment: "development" | "staging" | "production";
	samplingRate: number; // 0.0 to 1.0
	batchSize: number;
	flushInterval: number; // milliseconds
	exporters: TelemetryExporter[];
	filters: TelemetryFilter[];
}

export interface TelemetryExporter {
	name: string;
	export(events: TelemetryEvent[]): Promise<void>;
	flush(): Promise<void>;
	shutdown(): Promise<void>;
}

export interface TelemetryFilter {
	shouldInclude(event: TelemetryEvent): boolean;
}

export class ConsoleExporter implements TelemetryExporter {
	name = "console";

	async export(_events: TelemetryEvent[]): Promise<void> {
		/* noop */
	}

	async flush(): Promise<void> {
		/* noop */
	}

	async shutdown(): Promise<void> {
		/* noop */
	}
}

export class HTTPExporter implements TelemetryExporter {
	name = "http";
	private endpoint: string;
	private headers: Record<string, string>;

	constructor(endpoint: string, headers: Record<string, string> = {}) {
		this.endpoint = endpoint;
		this.headers = headers;
	}

	async export(events: TelemetryEvent[]): Promise<void> {
		try {
			const response = await fetch(this.endpoint, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					...this.headers,
				},
				body: JSON.stringify({ events }),
			});

			if (!response.ok) {
				console.error(`Telemetry export failed: ${response.status}`);
			}
		} catch (error) {
			console.error("Telemetry export error:", error);
		}
	}

	async flush(): Promise<void> {
		/* noop */
	}

	async shutdown(): Promise<void> {
		/* noop */
	}
}

export class FileExporter implements TelemetryExporter {
	name = "file";
	private events: TelemetryEvent[] = [];

	async export(events: TelemetryEvent[]): Promise<void> {
		this.events.push(...events);
	}

	async flush(): Promise<void> {
		if (this.events.length === 0) return;

		try {
			this.events = [];
		} catch (error) {
			console.error("File export error:", error);
		}
	}

	async shutdown(): Promise<void> {
		await this.flush();
	}
}

export class SamplingFilter implements TelemetryFilter {
	private rate: number;

	constructor(rate: number) {
		this.rate = Math.max(0, Math.min(1, rate));
	}

	shouldInclude(_event: TelemetryEvent): boolean {
		return Math.random() < this.rate;
	}
}

export class TelemetryEventTypeFilter implements TelemetryFilter {
	private allowedTypes: Set<TelemetryEventType>;

	constructor(allowedTypes: TelemetryEventType[]) {
		this.allowedTypes = new Set(allowedTypes);
	}

	shouldInclude(event: TelemetryEvent): boolean {
		return this.allowedTypes.has(event.type);
	}
}

export class TelemetryUserFilter implements TelemetryFilter {
	private excludedUsers: Set<string>;

	constructor(excludedUsers: string[]) {
		this.excludedUsers = new Set(excludedUsers);
	}

	shouldInclude(event: TelemetryEvent): boolean {
		return !event.userId || !this.excludedUsers.has(event.userId);
	}
}

export class TelemetryService {
	private config: TelemetryConfig;
	private eventBuffer: TelemetryEvent[] = [];
	private flushTimer: NodeJS.Timeout | null = null;
	private isRunning = false;

	constructor(config: TelemetryConfig) {
		this.config = config;
	}

	async start(): Promise<void> {
		if (this.isRunning) return;

		this.isRunning = true;
		this.startFlushTimer();

		await this.recordEvent({
			type: TelemetryEventType.APP_START,
			properties: {
				serviceName: this.config.serviceName,
				serviceVersion: this.config.serviceVersion,
				environment: this.config.environment,
			},
		});
	}

	async stop(): Promise<void> {
		if (!this.isRunning) return;

		this.isRunning = false;

		if (this.flushTimer) {
			clearInterval(this.flushTimer);
			this.flushTimer = null;
		}

		await this.flush();

		await Promise.all(this.config.exporters.map((exporter) => exporter.shutdown()));
	}

	async recordEvent(
		event: Omit<TelemetryEvent, "id" | "timestamp" | "environment" | "version">
	): Promise<void> {
		if (!this.isRunning) return;

		const fullEvent: TelemetryEvent = {
			id: crypto.randomUUID(),
			timestamp: new Date(),
			environment: this.config.environment,
			version: this.config.serviceVersion,
			...event,
		};

		for (const filter of this.config.filters) {
			if (!filter.shouldInclude(fullEvent)) {
				return;
			}
		}

		if (Math.random() > this.config.samplingRate) {
			return;
		}

		this.eventBuffer.push(fullEvent);

		if (this.eventBuffer.length >= this.config.batchSize) {
			await this.flush();
		}
	}

	async recordUserAction(
		userId: string,
		action: string,
		category: string,
		properties?: Record<string, unknown>
	): Promise<void> {
		await this.recordEvent({
			type: TelemetryEventType.USER_ACTION,
			userId,
			properties: {
				action,
				category,
				...properties,
			},
		});
	}

	async recordError(
		error: Error,
		userId?: string,
		sessionId?: string,
		additionalContext?: Record<string, unknown>
	): Promise<void> {
		await this.recordEvent({
			type: TelemetryEventType.APP_ERROR,
			...(userId !== undefined && { userId }),
			...(sessionId !== undefined && { sessionId }),
			properties: {
				errorName: error.name,
				errorMessage: error.message,
				errorStack: error.stack,
				...additionalContext,
			},
		});
	}

	async recordPerformanceMetric(
		metricName: string,
		value: number,
		unit: string,
		tags?: string[],
		userId?: string
	): Promise<void> {
		await this.recordEvent({
			type: TelemetryEventType.PERFORMANCE_METRIC,
			...(userId !== undefined && { userId }),
			properties: {
				metricName,
				unit,
			},
			metrics: {
				[metricName]: value,
			},
			...(tags !== undefined && { tags }),
		});
	}

	async recordAPICall(
		method: string,
		endpoint: string,
		statusCode: number,
		duration: number,
		userId?: string
	): Promise<void> {
		await this.recordEvent({
			type: TelemetryEventType.API_CALL,
			...(userId !== undefined && { userId }),
			properties: {
				method,
				endpoint,
				statusCode,
			},
			metrics: {
				duration,
				statusCode,
			},
		});
	}

	async recordBusinessMetric(
		metricName: string,
		value: number,
		category: string,
		properties?: Record<string, unknown>
	): Promise<void> {
		await this.recordEvent({
			type: TelemetryEventType.BUSINESS_METRIC,
			properties: {
				metricName,
				category,
				...properties,
			},
			metrics: {
				[metricName]: value,
			},
		});
	}

	getStats(): {
		totalEvents: number;
		bufferedEvents: number;
		exportedEvents: number;
		droppedEvents: number;
		uptime: number;
	} {
		return {
			totalEvents: 0,
			bufferedEvents: this.eventBuffer.length,
			exportedEvents: 0,
			droppedEvents: 0,
			uptime: 0,
		};
	}

	private async flush(): Promise<void> {
		if (this.eventBuffer.length === 0) return;

		const events = [...this.eventBuffer];
		this.eventBuffer = [];

		try {
			await Promise.all(this.config.exporters.map((exporter) => exporter.export(events)));
		} catch (error) {
			console.error("Error flushing telemetry events:", error);
			this.eventBuffer.unshift(...events);
		}
	}

	private startFlushTimer(): void {
		this.flushTimer = setInterval(() => {
			this.flush().catch((error) => {
				console.error("Error in flush timer:", error);
			});
		}, this.config.flushInterval);
	}
}

export const TelemetryFactory = {
	createTelemetryService(config: TelemetryConfig): TelemetryService {
		return new TelemetryService(config);
	},

	createDefaultConfig(serviceName: string, serviceVersion: string): TelemetryConfig {
		return {
			serviceName,
			serviceVersion,
			environment: "development",
			samplingRate: 1.0,
			batchSize: 100,
			flushInterval: 30_000, // 30 seconds
			exporters: [new ConsoleExporter()],
			filters: [],
		};
	},

	createProductionConfig(
		serviceName: string,
		serviceVersion: string,
		telemetryEndpoint?: string
	): TelemetryConfig {
		const exporters: TelemetryExporter[] = [new ConsoleExporter()];

		if (telemetryEndpoint) {
			exporters.push(new HTTPExporter(telemetryEndpoint));
		}

		return {
			serviceName,
			serviceVersion,
			environment: "production",
			samplingRate: 0.1, // 10% sampling
			batchSize: 100,
			flushInterval: 60_000, // 1 minute
			exporters,
			filters: [
				new TelemetryEventTypeFilter([
					TelemetryEventType.APP_ERROR,
					TelemetryEventType.PERFORMANCE_METRIC,
					TelemetryEventType.BUSINESS_METRIC,
				]),
				new SamplingFilter(0.1),
			],
		};
	},
};

export class PerformanceMonitor {
	private telemetry: TelemetryService;
	private measurements: Map<string, number> = new Map();

	constructor(telemetry: TelemetryService) {
		this.telemetry = telemetry;
	}

	startMeasurement(name: string): void {
		this.measurements.set(name, Date.now());
	}

	async endMeasurement(name: string, tags?: string[], userId?: string): Promise<void> {
		const startTime = this.measurements.get(name);
		if (!startTime) return;

		const duration = Date.now() - startTime;
		this.measurements.delete(name);

		await this.telemetry.recordPerformanceMetric(name, duration, "milliseconds", tags, userId);
	}

	async measureAsync<T>(
		name: string,
		operation: () => Promise<T>,
		tags?: string[],
		userId?: string
	): Promise<T> {
		this.startMeasurement(name);
		try {
			const result = await operation();
			await this.endMeasurement(name, tags, userId);
			return result;
		} catch (error) {
			await this.endMeasurement(name, [...(tags || []), "error"], userId);
			throw error;
		}
	}

	async recordMemoryUsage(userId?: string): Promise<void> {
		const perfWithMemory = performance as unknown as {
			memory?: { usedJSHeapSize: number; totalJSHeapSize: number };
		};
		if (typeof performance !== "undefined" && perfWithMemory.memory) {
			const memory = perfWithMemory.memory;
			await this.telemetry.recordPerformanceMetric(
				"memory_used",
				memory.usedJSHeapSize,
				"bytes",
				["memory"],
				userId
			);
			await this.telemetry.recordPerformanceMetric(
				"memory_total",
				memory.totalJSHeapSize,
				"bytes",
				["memory"],
				userId
			);
		}
	}

	async recordPageLoadTime(userId?: string): Promise<void> {
		if (typeof performance !== "undefined") {
			const navigation = performance.getEntriesByType("navigation")[0] as unknown as
				| { loadEventEnd: number; fetchStart: number }
				| undefined;
			if (navigation) {
				const loadTime = navigation.loadEventEnd - navigation.fetchStart;
				await this.telemetry.recordPerformanceMetric(
					"page_load_time",
					loadTime,
					"milliseconds",
					["page_load"],
					userId
				);
				return;
			}

			const timing = (
				performance as unknown as {
					timing?: { loadEventEnd: number; navigationStart: number };
				}
			).timing;
			if (timing) {
				const loadTime = timing.loadEventEnd - timing.navigationStart;
				await this.telemetry.recordPerformanceMetric(
					"page_load_time",
					loadTime,
					"milliseconds",
					["page_load"],
					userId
				);
			}
		}
	}
}
