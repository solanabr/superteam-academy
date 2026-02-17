import type { ServiceLogger, LogEntry, LogLevel } from "../interfaces/service-logging";

export class ConsoleServiceLogger implements ServiceLogger {
	private logs: LogEntry[] = [];
	private maxLogs = 5000; // Keep last 5k logs
	private correlationId?: string;
	private userId?: string;
	private requestId?: string;

	debug(service: string, message: string, data?: Record<string, unknown>): void {
		this.log("debug", service, message, undefined, data);
	}

	info(service: string, message: string, data?: Record<string, unknown>): void {
		this.log("info", service, message, undefined, data);
	}

	warn(service: string, message: string, data?: Record<string, unknown>): void {
		this.log("warn", service, message, undefined, data);
	}

	error(service: string, message: string, error?: Error, data?: Record<string, unknown>): void {
		this.log("error", service, message, error, data);
	}

	setCorrelationId(id: string): void {
		this.correlationId = id;
	}

	setUserId(id: string): void {
		this.userId = id;
	}

	setRequestId(id: string): void {
		this.requestId = id;
	}

	private log(
		level: LogLevel,
		service: string,
		message: string,
		error?: Error,
		data?: Record<string, unknown>
	): void {
		const entry: LogEntry = {
			timestamp: new Date(),
			level,
			service,
			message,
			...(data !== undefined && { data }),
			...(error !== undefined && { error }),
			...(this.correlationId !== undefined && { correlationId: this.correlationId }),
			...(this.userId !== undefined && { userId: this.userId }),
			...(this.requestId !== undefined && { requestId: this.requestId }),
		};

		this.logs.push(entry);

		// Keep only recent logs
		if (this.logs.length > this.maxLogs) {
			this.logs = this.logs.slice(-this.maxLogs);
		}

		// Console output
		const logMessage = `[${entry.timestamp.toISOString()}] ${level.toUpperCase()} [${service}] ${message}`;
		const logData = {
			...data,
			correlationId: this.correlationId,
			userId: this.userId,
			requestId: this.requestId,
		};

		switch (level) {
			case "debug":
				console.debug(logMessage, logData);
				break;
			case "info":
				console.info(logMessage, logData);
				break;
			case "warn":
				console.warn(logMessage, logData);
				break;
			case "error":
				console.error(logMessage, error, logData);
				break;
			default:
				break;
		}
	}

	async getLogs(service?: string, level?: LogLevel, limit = 100): Promise<LogEntry[]> {
		let filtered = this.logs;

		if (service) {
			filtered = filtered.filter((log) => log.service === service);
		}

		if (level) {
			filtered = filtered.filter((log) => log.level === level);
		}

		return filtered.slice(-limit);
	}
}
