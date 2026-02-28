import { z } from "zod";

export enum LogLevel {
	DEBUG = 0,
	INFO = 1,
	WARN = 2,
	ERROR = 3,
	FATAL = 4,
}

export const LogEntrySchema = z.object({
	id: z.string().uuid(),
	timestamp: z.date(),
	level: z.nativeEnum(LogLevel),
	message: z.string(),
	service: z.string(),
	environment: z.string(),
	version: z.string(),
	traceId: z.string().optional(),
	spanId: z.string().optional(),
	parentSpanId: z.string().optional(),
	userId: z.string().optional(),
	sessionId: z.string().optional(),
	requestId: z.string().optional(),
	correlationId: z.string().optional(),
	context: z.record(z.string(), z.unknown()).optional(),
	tags: z.array(z.string()).optional(),
	error: z
		.object({
			name: z.string(),
			message: z.string(),
			stack: z.string().optional(),
		})
		.optional(),
	metrics: z.record(z.string(), z.number()).optional(),
});

export type LogEntry = z.infer<typeof LogEntrySchema>;

export interface SpanContext {
	traceId: string;
	spanId: string;
	parentSpanId?: string;
	sampled: boolean;
}

export const SpanSchema = z.object({
	id: z.string(),
	traceId: z.string(),
	parentSpanId: z.string().optional(),
	name: z.string(),
	kind: z.enum(["client", "server", "producer", "consumer", "internal"]),
	startTime: z.date(),
	endTime: z.date().optional(),
	duration: z.number().optional(), // microseconds
	status: z.enum(["ok", "error", "unset"]),
	statusMessage: z.string().optional(),
	attributes: z.record(z.string(), z.unknown()),
	events: z
		.array(
			z.object({
				name: z.string(),
				timestamp: z.date(),
				attributes: z.record(z.string(), z.unknown()).optional(),
			})
		)
		.optional(),
	links: z
		.array(
			z.object({
				traceId: z.string(),
				spanId: z.string(),
				attributes: z.record(z.string(), z.unknown()).optional(),
			})
		)
		.optional(),
});

export type Span = z.infer<typeof SpanSchema>;

export interface LoggerConfig {
	serviceName: string;
	serviceVersion: string;
	environment: "development" | "staging" | "production";
	level: LogLevel;
	format: "json" | "text" | "structured";
	transports: LogTransport[];
	sampling: {
		enabled: boolean;
		rate: number; // 0.0 to 1.0
	};
	buffer: {
		enabled: boolean;
		size: number;
		flushInterval: number; // milliseconds
	};
}

export interface LogTransport {
	name: string;
	level: LogLevel;
	log(entry: LogEntry): Promise<void>;
	flush(): Promise<void>;
	close(): Promise<void>;
}

export class ConsoleTransport implements LogTransport {
	name = "console";
	level: LogLevel;

	constructor(level: LogLevel = LogLevel.INFO) {
		this.level = level;
	}

	async log(entry: LogEntry): Promise<void> {
		const levelName = LogLevel[entry.level].toLowerCase();
		const timestamp = entry.timestamp.toISOString();
		const prefix = `[${timestamp}] ${levelName.toUpperCase()}`;

		let message = `${prefix} ${entry.message}`;

		if (entry.context) {
			message += ` ${JSON.stringify(entry.context)}`;
		}

		if (entry.error) {
			message += ` Error: ${entry.error.message}`;
		}

		switch (entry.level) {
			case LogLevel.DEBUG:
				console.debug(message);
				break;
			case LogLevel.INFO:
				console.info(message);
				break;
			case LogLevel.WARN:
				console.warn(message);
				break;
			case LogLevel.ERROR:
			case LogLevel.FATAL:
				console.error(message);
				break;
			default:
				break;
		}
	}

	async flush(): Promise<void> {
		/* noop */
	}

	async close(): Promise<void> {
		/* noop */
	}
}

export class FileTransport implements LogTransport {
	name: string;
	level: LogLevel;
	private writeStream?: unknown;

	constructor(name: string, _filePath: string, level: LogLevel = LogLevel.INFO) {
		this.name = name;
		this.level = level;
	}

	async log(_entry: LogEntry): Promise<void> {
		/* noop */
	}

	async flush(): Promise<void> {
		/* noop */
	}

	async close(): Promise<void> {
		if (this.writeStream) {
			/* noop */
		}
	}
}

export class HTTPTransport implements LogTransport {
	name: string;
	level: LogLevel;
	private endpoint: string;
	private headers: Record<string, string>;
	private buffer: LogEntry[] = [];
	private flushTimer?: NodeJS.Timeout;

	constructor(
		name: string,
		endpoint: string,
		level: LogLevel = LogLevel.INFO,
		headers: Record<string, string> = {},
		autoFlush = true
	) {
		this.name = name;
		this.endpoint = endpoint;
		this.level = level;
		this.headers = headers;

		if (autoFlush) {
			this.flushTimer = setInterval(() => this.flush(), 30_000); // 30 seconds
		}
	}

	async log(entry: LogEntry): Promise<void> {
		this.buffer.push(entry);

		if (this.buffer.length >= 100) {
			await this.flush();
		}
	}

	async flush(): Promise<void> {
		if (this.buffer.length === 0) return;

		const entries = [...this.buffer];
		this.buffer = [];

		try {
			const response = await fetch(this.endpoint, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					...this.headers,
				},
				body: JSON.stringify({ entries }),
			});

			if (!response.ok) {
				console.error(`Log transport failed: ${response.status}`);
				this.buffer.unshift(...entries);
			}
		} catch (error) {
			console.error("Error sending logs:", error);
			this.buffer.unshift(...entries);
		}
	}

	async close(): Promise<void> {
		if (this.flushTimer) {
			clearInterval(this.flushTimer);
		}
		await this.flush();
	}
}

export class Logger {
	private config: LoggerConfig;
	private context: Record<string, unknown> = {};
	private spanContext?: SpanContext;

	constructor(config: LoggerConfig) {
		this.config = config;
	}

	setContext(context: Record<string, unknown>): void {
		this.context = { ...this.context, ...context };
	}

	setSpanContext(spanContext: SpanContext): void {
		this.spanContext = spanContext;
	}

	child(context: Record<string, unknown>): Logger {
		const childLogger = new Logger(this.config);
		childLogger.context = { ...this.context, ...context };
		if (this.spanContext) {
			childLogger.spanContext = this.spanContext;
		}
		return childLogger;
	}

	debug(message: string, context?: Record<string, unknown>, error?: Error): void {
		this.log(LogLevel.DEBUG, message, context, error);
	}

	info(message: string, context?: Record<string, unknown>, error?: Error): void {
		this.log(LogLevel.INFO, message, context, error);
	}

	warn(message: string, context?: Record<string, unknown>, error?: Error): void {
		this.log(LogLevel.WARN, message, context, error);
	}

	error(message: string, context?: Record<string, unknown>, error?: Error): void {
		this.log(LogLevel.ERROR, message, context, error);
	}

	fatal(message: string, context?: Record<string, unknown>, error?: Error): void {
		this.log(LogLevel.FATAL, message, context, error);
	}

	private log(
		level: LogLevel,
		message: string,
		context?: Record<string, unknown>,
		error?: Error
	): void {
		if (level < this.config.level) return;

		if (this.config.sampling.enabled && Math.random() > this.config.sampling.rate) {
			return;
		}

		const entry: LogEntry = {
			id: crypto.randomUUID(),
			timestamp: new Date(),
			level,
			message,
			service: this.config.serviceName,
			environment: this.config.environment,
			version: this.config.serviceVersion,
			...(this.spanContext?.traceId !== undefined && { traceId: this.spanContext.traceId }),
			...(this.spanContext?.spanId !== undefined && { spanId: this.spanContext.spanId }),
			...(this.spanContext?.parentSpanId !== undefined && {
				parentSpanId: this.spanContext.parentSpanId,
			}),
			context: { ...this.context, ...context },
			...(error !== undefined && {
				error: {
					name: error.name,
					message: error.message,
					...(error.stack !== undefined && { stack: error.stack }),
				},
			}),
		};

		this.config.transports
			.filter((transport) => level >= transport.level)
			.forEach((transport) => {
				transport.log(entry).catch((err) => {
					console.error("Error in log transport:", err);
				});
			});
	}

	async flush(): Promise<void> {
		await Promise.all(this.config.transports.map((transport) => transport.flush()));
	}

	async close(): Promise<void> {
		await Promise.all(this.config.transports.map((transport) => transport.close()));
	}
}

export class Tracer {
	private serviceName: string;
	private spans: Map<string, Span> = new Map();
	private activeSpans: Span[] = [];

	constructor(serviceName: string) {
		this.serviceName = serviceName;
	}

	startSpan(
		name: string,
		kind: Span["kind"] = "internal",
		parentContext?: SpanContext,
		attributes: Record<string, unknown> = {
			/* noop */
		}
	): SpanContext {
		const spanId = this.generateSpanId();
		const traceId = parentContext?.traceId || this.generateTraceId();
		const parentSpanId = parentContext?.spanId;

		const span: Span = {
			id: spanId,
			traceId,
			...(parentSpanId !== undefined && { parentSpanId }),
			name,
			kind,
			startTime: new Date(),
			status: "unset",
			attributes: {
				service: this.serviceName,
				...attributes,
			},
		};

		this.spans.set(spanId, span);
		this.activeSpans.push(span);

		return {
			traceId,
			spanId,
			...(parentSpanId !== undefined && { parentSpanId }),
			sampled: true,
		};
	}

	endSpan(spanContext: SpanContext, status: Span["status"] = "ok", statusMessage?: string): void {
		const span = this.spans.get(spanContext.spanId);
		if (!span) return;

		span.endTime = new Date();
		span.duration = span.endTime.getTime() - span.startTime.getTime();
		span.status = status;
		span.statusMessage = statusMessage;

		const index = this.activeSpans.findIndex((s) => s.id === spanContext.spanId);
		if (index > -1) {
			this.activeSpans.splice(index, 1);
		}

		this.exportSpan(span);
	}

	addEvent(name: string, attributes?: Record<string, unknown>): void {
		const activeSpan = this.getActiveSpan();
		if (!activeSpan) return;

		activeSpan.events = activeSpan.events || [];
		activeSpan.events.push({
			name,
			timestamp: new Date(),
			attributes,
		});
	}

	setAttributes(attributes: Record<string, unknown>): void {
		const activeSpan = this.getActiveSpan();
		if (!activeSpan) return;

		activeSpan.attributes = { ...activeSpan.attributes, ...attributes };
	}

	private getActiveSpan(): Span | undefined {
		return this.activeSpans[this.activeSpans.length - 1];
	}

	private generateTraceId(): string {
		return crypto.randomUUID();
	}

	private generateSpanId(): string {
		return crypto.randomUUID().slice(0, 16);
	}

	private exportSpan(_span: Span): void {
		/* noop */
	}

	getSpansForTrace(traceId: string): Span[] {
		return Array.from(this.spans.values()).filter((span) => span.traceId === traceId);
	}

	getActiveSpans(): Span[] {
		return [...this.activeSpans];
	}
}

export const LoggingTracingFactory = {
	createLogger(config: LoggerConfig): Logger {
		return new Logger(config);
	},

	createDefaultLoggerConfig(serviceName: string, serviceVersion: string): LoggerConfig {
		return {
			serviceName,
			serviceVersion,
			environment: "development",
			level: LogLevel.INFO,
			format: "text",
			transports: [new ConsoleTransport(LogLevel.DEBUG)],
			sampling: {
				enabled: false,
				rate: 1.0,
			},
			buffer: {
				enabled: false,
				size: 100,
				flushInterval: 30_000,
			},
		};
	},

	createProductionLoggerConfig(
		serviceName: string,
		serviceVersion: string,
		logEndpoint?: string
	): LoggerConfig {
		const transports: LogTransport[] = [new ConsoleTransport(LogLevel.WARN)];

		if (logEndpoint) {
			transports.push(new HTTPTransport("remote", logEndpoint, LogLevel.INFO));
		}

		return {
			serviceName,
			serviceVersion,
			environment: "production",
			level: LogLevel.INFO,
			format: "json",
			transports,
			sampling: {
				enabled: true,
				rate: 0.1, // 10% sampling
			},
			buffer: {
				enabled: true,
				size: 100,
				flushInterval: 60_000, // 1 minute
			},
		};
	},

	createTracer(serviceName: string): Tracer {
		return new Tracer(serviceName);
	},
};

export interface MiddlewareRequest {
	method: string;
	path: string;
	url: string;
	ip: string;
	headers: Record<string, string | string[] | undefined>;
	get(name: string): string | undefined;
	correlationId?: string;
	spanContext?: SpanContext;
	logger?: Logger;
}

export interface MiddlewareResponse {
	statusCode: number;
	end: (...args: unknown[]) => void;
	get(name: string): string | undefined;
}

export class HTTPLoggingMiddleware {
	private logger: Logger;
	private tracer: Tracer;

	constructor(logger: Logger, tracer: Tracer) {
		this.logger = logger;
		this.tracer = tracer;
	}

	getExpressMiddleware() {
		return (req: MiddlewareRequest, res: MiddlewareResponse, next: () => void) => {
			const startTime = Date.now();
			const spanContext = this.tracer.startSpan(
				`${req.method} ${req.path}`,
				"server",
				undefined,
				{
					"http.method": req.method,
					"http.url": req.url,
					"http.user_agent": req.get("User-Agent"),
					"http.remote_ip": req.ip,
				}
			);

			const correlationId =
				(req.headers["x-correlation-id"] as string | undefined) ?? crypto.randomUUID();
			req.correlationId = correlationId;

			const requestLogger = this.logger.child({
				correlationId,
				traceId: spanContext.traceId,
				spanId: spanContext.spanId,
				method: req.method,
				url: req.url,
				userAgent: req.get("User-Agent"),
				ip: req.ip,
			});

			requestLogger.info("HTTP request started", {
				method: req.method,
				url: req.url,
				headers: req.headers as Record<string, unknown>,
			});

			const originalEnd = res.end;
			res.end = (...args: unknown[]) => {
				const duration = Date.now() - startTime;

				this.tracer.setAttributes({
					"http.status_code": res.statusCode,
					"http.duration": duration,
				});

				requestLogger.info("HTTP request completed", {
					statusCode: res.statusCode,
					duration,
					contentLength: res.get("Content-Length"),
				});

				const status: Span["status"] = res.statusCode >= 400 ? "error" : "ok";
				this.tracer.endSpan(spanContext, status);

				originalEnd.apply(res, args);
			};

			req.spanContext = spanContext;
			req.logger = requestLogger;

			next();
		};
	}

	logRequest(
		method: string,
		url: string,
		headers: Record<string, string>,
		ip?: string
	): {
		logger: Logger;
		spanContext: SpanContext;
		endRequest: (statusCode: number, duration: number) => void;
	} {
		const spanContext = this.tracer.startSpan(`${method} ${url}`, "server", undefined, {
			"http.method": method,
			"http.url": url,
			"http.user_agent": headers["user-agent"],
			"http.remote_ip": ip,
		});

		const correlationId = headers["x-correlation-id"] || crypto.randomUUID();

		const requestLogger = this.logger.child({
			correlationId,
			traceId: spanContext.traceId,
			spanId: spanContext.spanId,
			method,
			url,
			userAgent: headers["user-agent"],
			ip,
		});

		requestLogger.info("Request started", { method, url, headers });

		const endRequest = (statusCode: number, duration: number) => {
			this.tracer.setAttributes({
				"http.status_code": statusCode,
				"http.duration": duration,
			});

			requestLogger.info("Request completed", { statusCode, duration });

			const status: Span["status"] = statusCode >= 400 ? "error" : "ok";
			this.tracer.endSpan(spanContext, status);
		};

		return { logger: requestLogger, spanContext, endRequest };
	}
}

export function logExecutionTime(logger: Logger, operationName: string) {
	return (_target: unknown, propertyKey: string, descriptor: PropertyDescriptor) => {
		const originalMethod = descriptor.value;

		descriptor.value = async function (...args: unknown[]) {
			const startTime = Date.now();

			try {
				logger.debug(`Starting ${operationName}`, { propertyKey });
				const result = await originalMethod.apply(this, args);
				const duration = Date.now() - startTime;

				logger.info(`${operationName} completed`, {
					propertyKey,
					duration,
				});

				return result;
			} catch (error) {
				const duration = Date.now() - startTime;
				logger.error(
					`${operationName} failed`,
					{
						propertyKey,
						duration,
						error: error instanceof Error ? error.message : String(error),
					},
					error instanceof Error ? error : undefined
				);
				throw error;
			}
		};

		return descriptor;
	};
}

const _correlationIdStorage = new Map<string, string>();

function _getCorrelationIdKey(): string {
	return "correlation-id";
}

export const CorrelationId = {
	set(id: string): void {
		const key = _getCorrelationIdKey();
		_correlationIdStorage.set(key, id);
	},

	get(): string | undefined {
		const key = _getCorrelationIdKey();
		return _correlationIdStorage.get(key);
	},

	generate(): string {
		const id = crypto.randomUUID();
		CorrelationId.set(id);
		return id;
	},
};
