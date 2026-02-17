import { z } from "zod";

// Audit log event types
export enum AuditEventType {
	// Authentication events
	AUTH_LOGIN_SUCCESS = "auth.login.success",
	AUTH_LOGIN_FAILURE = "auth.login.failure",
	AUTH_LOGOUT = "auth.logout",
	AUTH_TOKEN_REFRESH = "auth.token.refresh",
	AUTH_OAUTH_LINK = "auth.oauth.link",
	AUTH_WALLET_CONNECT = "auth.wallet.connect",
	AUTH_WALLET_DISCONNECT = "auth.wallet.disconnect",

	// Authorization events
	AUTH_ACCESS_DENIED = "auth.access.denied",
	AUTH_PERMISSION_GRANTED = "auth.permission.granted",
	AUTH_PERMISSION_REVOKED = "auth.permission.revoked",

	// Security events
	SECURITY_RATE_LIMIT_EXCEEDED = "security.rate_limit.exceeded",
	SECURITY_SUSPICIOUS_ACTIVITY = "security.suspicious.activity",
	SECURITY_BRUTE_FORCE_DETECTED = "security.brute_force.detected",
	SECURITY_SQL_INJECTION_ATTEMPT = "security.sql_injection.attempt",
	SECURITY_XSS_ATTEMPT = "security.xss.attempt",
	SECURITY_CSRF_ATTEMPT = "security.csrf.attempt",

	// Data access events
	DATA_ACCESS = "data.access",
	DATA_MODIFICATION = "data.modification",
	DATA_DELETION = "data.deletion",
	DATA_EXPORT = "data.export",

	// System events
	SYSTEM_CONFIG_CHANGE = "system.config.change",
	SYSTEM_MAINTENANCE_MODE = "system.maintenance.mode",
	SYSTEM_BACKUP_STARTED = "system.backup.started",
	SYSTEM_BACKUP_COMPLETED = "system.backup.completed",

	// User management events
	USER_CREATED = "user.created",
	USER_UPDATED = "user.updated",
	USER_DELETED = "user.deleted",
	USER_ROLE_CHANGED = "user.role.changed",
}

// Audit log severity levels
export enum AuditSeverity {
	LOW = "low",
	MEDIUM = "medium",
	HIGH = "high",
	CRITICAL = "critical",
}

// Audit log entry schema
export const auditLogSchema = z.object({
	id: z.string().uuid(),
	timestamp: z.date(),
	eventType: z.nativeEnum(AuditEventType),
	severity: z.nativeEnum(AuditSeverity),
	userId: z.string().optional(),
	sessionId: z.string().optional(),
	ipAddress: z.string().optional(),
	userAgent: z.string().optional(),
	resource: z.string().optional(), // e.g., "user:123", "course:456"
	action: z.string().optional(), // e.g., "read", "write", "delete"
	details: z.record(z.string(), z.unknown()).optional(),
	metadata: z.record(z.string(), z.unknown()).optional(),
	success: z.boolean(),
	error: z.string().optional(),
});

export type AuditLogEntry = z.infer<typeof auditLogSchema>;

// Audit logger interface
export interface AuditLogger {
	log(entry: Omit<AuditLogEntry, "id" | "timestamp">): Promise<void>;
	query(options: AuditQueryOptions): Promise<AuditLogEntry[]>;
	getById(id: string): Promise<AuditLogEntry | null>;
}

// Query options for audit logs
export interface AuditQueryOptions {
	userId?: string;
	eventType?: AuditEventType;
	severity?: AuditSeverity;
	startDate?: Date;
	endDate?: Date;
	limit?: number;
	offset?: number;
	resource?: string;
}

// Audit logger configuration
export interface AuditLoggerConfig {
	enabled: boolean;
	storage: "database" | "file" | "external";
	databaseTable?: string;
	filePath?: string;
	externalUrl?: string;
	externalApiKey?: string;
	retentionDays: number;
	maxBatchSize: number;
}

// Default audit logger configuration
export const DEFAULT_AUDIT_CONFIG: AuditLoggerConfig = {
	enabled: true,
	storage: "database",
	databaseTable: "audit_logs",
	retentionDays: 365, // 1 year
	maxBatchSize: 100,
};

// Create audit log entry helper
export function createAuditLogEntry(
	eventType: AuditEventType,
	severity: AuditSeverity,
	data: {
		userId?: string;
		sessionId?: string;
		ipAddress?: string;
		userAgent?: string;
		resource?: string;
		action?: string;
		details?: Record<string, unknown>;
		metadata?: Record<string, unknown>;
		success?: boolean;
		error?: string;
	}
): Omit<AuditLogEntry, "id" | "timestamp"> {
	return {
		eventType,
		severity,
		success: data.success ?? true,
		...data,
	};
}

// Security event helpers
export const SecurityEvents = {
	rateLimitExceeded: (ipAddress: string, endpoint: string, limit: number) =>
		createAuditLogEntry(AuditEventType.SECURITY_RATE_LIMIT_EXCEEDED, AuditSeverity.MEDIUM, {
			ipAddress,
			resource: endpoint,
			details: { limit },
		}),

	suspiciousActivity: (userId: string, activity: string, details: Record<string, unknown>) =>
		createAuditLogEntry(AuditEventType.SECURITY_SUSPICIOUS_ACTIVITY, AuditSeverity.HIGH, {
			userId,
			details: { activity, ...details },
		}),

	bruteForceDetected: (ipAddress: string, attempts: number, timeframe: number) =>
		createAuditLogEntry(AuditEventType.SECURITY_BRUTE_FORCE_DETECTED, AuditSeverity.CRITICAL, {
			ipAddress,
			details: { attempts, timeframe },
		}),

	authFailure: (identifier: string, reason: string, ipAddress?: string) =>
		createAuditLogEntry(AuditEventType.AUTH_LOGIN_FAILURE, AuditSeverity.MEDIUM, {
			userId: identifier,
			...(ipAddress !== undefined && { ipAddress }),
			details: { reason },
			success: false,
			error: reason,
		}),

	authSuccess: (userId: string, method: string, ipAddress?: string) =>
		createAuditLogEntry(AuditEventType.AUTH_LOGIN_SUCCESS, AuditSeverity.LOW, {
			userId,
			...(ipAddress !== undefined && { ipAddress }),
			details: { method },
		}),

	accessDenied: (userId: string, resource: string, action: string, ipAddress?: string) =>
		createAuditLogEntry(AuditEventType.AUTH_ACCESS_DENIED, AuditSeverity.MEDIUM, {
			userId,
			...(ipAddress !== undefined && { ipAddress }),
			resource,
			action,
			success: false,
		}),

	dataAccess: (userId: string, resource: string, action: string) =>
		createAuditLogEntry(AuditEventType.DATA_ACCESS, AuditSeverity.LOW, {
			userId,
			resource,
			action,
		}),
};
