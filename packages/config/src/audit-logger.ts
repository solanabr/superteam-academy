import {
	type AuditLogEntry,
	type AuditLogger,
	type AuditQueryOptions,
	type AuditLoggerConfig,
	auditLogSchema,
	DEFAULT_AUDIT_CONFIG,
} from "./audit";
import { env } from "./env";

// Database client interface for audit logging (implement with Drizzle or other ORM)
interface AuditDbClient {
	auditLog: {
		findMany(args: {
			where: Record<string, unknown>;
			orderBy: Record<string, string>;
			take: number;
			skip: number;
		}): Promise<AuditLogEntry[]>;
		findUnique(args: { where: { id: string } }): Promise<AuditLogEntry | null>;
		createMany(args: { data: Record<string, unknown>[] }): Promise<{ count: number }>;
	};
	disconnect(): Promise<void>;
}

// Database audit logger implementation
export class DatabaseAuditLogger implements AuditLogger {
	private config: AuditLoggerConfig;
	private batch: AuditLogEntry[] = [];
	private batchTimeout: NodeJS.Timeout | null = null;
	private db: AuditDbClient | null = null;

	constructor(config: Partial<AuditLoggerConfig> = {}) {
		this.config = { ...DEFAULT_AUDIT_CONFIG, ...config };
	}

	async log(entry: Omit<AuditLogEntry, "id" | "timestamp">): Promise<void> {
		if (!this.config.enabled) return;

		const fullEntry: AuditLogEntry = {
			id: crypto.randomUUID(),
			timestamp: new Date(),
			...entry,
		};

		// Validate entry
		auditLogSchema.parse(fullEntry);

		// Add to batch for bulk insert
		this.batch.push(fullEntry);

		// If batch is full or this is a critical event, flush immediately
		if (this.batch.length >= this.config.maxBatchSize || entry.severity === "critical") {
			await this.flushBatch();
		} else {
			// Schedule batch flush
			this.scheduleBatchFlush();
		}
	}

	async query(options: AuditQueryOptions): Promise<AuditLogEntry[]> {
		if (!this.db) {
			console.warn("[AUDIT] Database query not available, database not initialized");
			return [];
		}

		try {
			const where: Record<string, unknown> = {};

			if (options.userId) where.userId = options.userId;
			if (options.eventType) where.eventType = options.eventType;
			if (options.severity) where.severity = options.severity;
			if (options.startDate || options.endDate) {
				const timestamp: Record<string, Date> = {};
				if (options.startDate) timestamp.gte = options.startDate;
				if (options.endDate) timestamp.lte = options.endDate;
				where.timestamp = timestamp;
			}
			if (options.resource) where.resource = { contains: options.resource };

			const result = await this.db.auditLog.findMany({
				where,
				orderBy: { timestamp: "desc" },
				take: options.limit || 100,
				skip: options.offset || 0,
			});

			return result;
		} catch (error) {
			console.error("[AUDIT] Failed to query audit logs:", error);
			return [];
		}
	}

	async getById(id: string): Promise<AuditLogEntry | null> {
		if (!this.db) {
			console.warn("[AUDIT] Database query not available, database not initialized");
			return null;
		}

		try {
			const result = await this.db.auditLog.findUnique({
				where: { id },
			});

			return result;
		} catch (error) {
			console.error("[AUDIT] Failed to get audit log by ID:", error);
			return null;
		}
	}

	private async flushBatch(): Promise<void> {
		if (this.batch.length === 0) return;

		try {
			if (this.db) {
				// Use database for bulk insertion
				const data = this.batch.map((entry) => ({
					id: entry.id,
					timestamp: entry.timestamp,
					eventType: entry.eventType,
					severity: entry.severity,
					userId: entry.userId,
					sessionId: entry.sessionId,
					ipAddress: entry.ipAddress,
					userAgent: entry.userAgent,
					resource: entry.resource,
					action: entry.action,
					details: entry.details,
					metadata: entry.metadata,
					success: entry.success,
					error: entry.error,
				}));

				await this.db.auditLog.createMany({ data });
			} else {
				// No database connection, entries discarded
			}

			// Clear batch
			this.batch = [];

			// Clear timeout
			if (this.batchTimeout) {
				clearTimeout(this.batchTimeout);
				this.batchTimeout = null;
			}
		} catch (error) {
			console.error("[AUDIT] Failed to flush audit batch:", error);
			// In production, you might want to retry or send to a dead letter queue
		}
	}

	private scheduleBatchFlush(): void {
		if (this.batchTimeout) return;

		this.batchTimeout = setTimeout(() => {
			this.flushBatch();
		}, 5000); // Flush every 5 seconds
	}

	// Cleanup method to flush remaining entries and close connections
	async cleanup(): Promise<void> {
		await this.flushBatch();

		if (this.db) {
			await this.db.disconnect();
		}
	}
}

// File-based audit logger for development/fallback
export class FileAuditLogger implements AuditLogger {
	private config: AuditLoggerConfig;
	private logStream: NodeJS.WritableStream | null = null;

	constructor(config: Partial<AuditLoggerConfig> = {}) {
		this.config = { ...DEFAULT_AUDIT_CONFIG, ...config, storage: "file" };
		this.initializeFileStream();
	}

	private initializeFileStream(): void {
		if (typeof window !== "undefined") return; // Skip in browser

		try {
			const fs = require("node:fs");
			const path = require("node:path");

			const logDir = path.dirname(this.config.filePath || "./logs");
			if (!fs.existsSync(logDir)) {
				fs.mkdirSync(logDir, { recursive: true });
			}

			this.logStream = fs.createWriteStream(this.config.filePath || "./logs/audit.log", {
				flags: "a",
			});
		} catch (error) {
			console.error("[AUDIT] Failed to initialize file stream:", error);
		}
	}

	async log(entry: Omit<AuditLogEntry, "id" | "timestamp">): Promise<void> {
		if (!this.config.enabled) return;

		const fullEntry: AuditLogEntry = {
			id: crypto.randomUUID(),
			timestamp: new Date(),
			...entry,
		};

		auditLogSchema.parse(fullEntry);

		const logLine = `${JSON.stringify(fullEntry)}\n`;

		if (this.logStream) {
			this.logStream.write(logLine);
		} else {
			// No file stream available, entry discarded
		}
	}

	async query(_options: AuditQueryOptions): Promise<AuditLogEntry[]> {
		// File-based querying would be complex and not recommended for production
		console.warn("File-based audit query not supported");
		return [];
	}

	async getById(_id: string): Promise<AuditLogEntry | null> {
		console.warn("File-based audit getById not supported");
		return null;
	}

	async cleanup(): Promise<void> {
		if (this.logStream) {
			this.logStream.end();
		}
	}
}

// Factory function to create audit logger based on configuration
export function createAuditLogger(config?: Partial<AuditLoggerConfig>): AuditLogger {
	const finalConfig = { ...DEFAULT_AUDIT_CONFIG, ...config };

	switch (finalConfig.storage) {
		case "database":
			return new DatabaseAuditLogger(finalConfig);
		case "file":
			return new FileAuditLogger(finalConfig);
		case "external":
			// Would implement external service logger (e.g., Datadog, LogRocket)
			console.warn("External audit logger not implemented, falling back to file");
			return new FileAuditLogger(finalConfig);
		default:
			return new FileAuditLogger(finalConfig);
	}
}

// Global audit logger instance
let globalAuditLogger: AuditLogger | null = null;

export function getAuditLogger(): AuditLogger {
	if (!globalAuditLogger) {
		globalAuditLogger = createAuditLogger({
			enabled: env.NODE_ENV !== "test", // Disable in tests by default
			storage: env.NODE_ENV === "production" ? "database" : "file",
		});
	}
	return globalAuditLogger;
}

export function setAuditLogger(logger: AuditLogger): void {
	globalAuditLogger = logger;
}

// Cleanup function for graceful shutdown
export async function cleanupAuditLogger(): Promise<void> {
	if (
		globalAuditLogger &&
		"cleanup" in globalAuditLogger &&
		typeof (globalAuditLogger as { cleanup: () => Promise<void> }).cleanup === "function"
	) {
		await (globalAuditLogger as { cleanup: () => Promise<void> }).cleanup();
	}
}
