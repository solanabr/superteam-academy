export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
	timestamp: Date;
	level: LogLevel;
	service: string;
	message: string;
	data?: Record<string, unknown>;
	error?: Error;
	correlationId?: string;
	userId?: string;
	requestId?: string;
}

export interface ServiceLogger {
	debug(service: string, message: string, data?: Record<string, unknown>): void;
	info(service: string, message: string, data?: Record<string, unknown>): void;
	warn(service: string, message: string, data?: Record<string, unknown>): void;
	error(service: string, message: string, error?: Error, data?: Record<string, unknown>): void;
	setCorrelationId(id: string): void;
	setUserId(id: string): void;
	setRequestId(id: string): void;
	getLogs(service?: string, level?: LogLevel, limit?: number): Promise<LogEntry[]>;
}
