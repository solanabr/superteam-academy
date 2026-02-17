import { getAuditLogger } from "./audit-logger";
import { SecurityEvents, AuditEventType, AuditSeverity } from "./audit";

// Authentication audit logging utilities
export class AuthAuditLogger {
	private logger = getAuditLogger();

	async logLoginSuccess(
		userId: string,
		method: string,
		ipAddress?: string,
		userAgent?: string,
		metadata?: Record<string, unknown>
	) {
		await this.logger.log({
			eventType: AuditEventType.AUTH_LOGIN_SUCCESS,
			severity: AuditSeverity.LOW,
			userId,
			ipAddress,
			userAgent,
			details: { method, ...metadata },
			metadata,
			success: true,
		});
	}

	async logLoginFailure(
		identifier: string,
		reason: string,
		ipAddress?: string,
		_userAgent?: string,
		_metadata?: Record<string, unknown>
	) {
		await this.logger.log(SecurityEvents.authFailure(identifier, reason, ipAddress));
	}

	async logLogout(
		userId: string,
		ipAddress?: string,
		userAgent?: string,
		metadata?: Record<string, unknown>
	) {
		await this.logger.log({
			eventType: AuditEventType.AUTH_LOGOUT,
			severity: AuditSeverity.LOW,
			userId,
			ipAddress,
			userAgent,
			details: { ...metadata },
			metadata,
			success: true,
		});
	}

	async logTokenRefresh(
		userId: string,
		ipAddress?: string,
		userAgent?: string,
		metadata?: Record<string, unknown>
	) {
		await this.logger.log({
			eventType: AuditEventType.AUTH_TOKEN_REFRESH,
			severity: AuditSeverity.LOW,
			userId,
			ipAddress,
			userAgent,
			details: { ...metadata },
			metadata,
			success: true,
		});
	}

	async logOAuthLink(
		userId: string,
		provider: string,
		ipAddress?: string,
		userAgent?: string,
		metadata?: Record<string, unknown>
	) {
		await this.logger.log({
			eventType: AuditEventType.AUTH_OAUTH_LINK,
			severity: AuditSeverity.LOW,
			userId,
			ipAddress,
			userAgent,
			details: { provider, ...metadata },
			metadata,
			success: true,
		});
	}

	async logWalletConnect(
		userId: string,
		walletType: string,
		publicKey: string,
		ipAddress?: string,
		userAgent?: string,
		metadata?: Record<string, unknown>
	) {
		await this.logger.log({
			eventType: AuditEventType.AUTH_WALLET_CONNECT,
			severity: AuditSeverity.LOW,
			userId,
			ipAddress,
			userAgent,
			details: { walletType, publicKey, ...metadata },
			metadata,
			success: true,
		});
	}

	async logWalletDisconnect(
		userId: string,
		walletType: string,
		ipAddress?: string,
		userAgent?: string,
		metadata?: Record<string, unknown>
	) {
		await this.logger.log({
			eventType: AuditEventType.AUTH_WALLET_DISCONNECT,
			severity: AuditSeverity.LOW,
			userId,
			ipAddress,
			userAgent,
			details: { walletType, ...metadata },
			metadata,
			success: true,
		});
	}

	async logAccessDenied(
		userId: string,
		resource: string,
		action: string,
		ipAddress?: string,
		_userAgent?: string,
		_metadata?: Record<string, unknown>
	) {
		await this.logger.log(SecurityEvents.accessDenied(userId, resource, action, ipAddress));
	}

	async logPermissionGranted(
		userId: string,
		permission: string,
		grantedBy: string,
		ipAddress?: string,
		userAgent?: string,
		metadata?: Record<string, unknown>
	) {
		await this.logger.log({
			eventType: AuditEventType.AUTH_PERMISSION_GRANTED,
			severity: AuditSeverity.MEDIUM,
			userId,
			ipAddress,
			userAgent,
			details: { permission, grantedBy, ...metadata },
			metadata,
			success: true,
		});
	}

	async logPermissionRevoked(
		userId: string,
		permission: string,
		revokedBy: string,
		ipAddress?: string,
		userAgent?: string,
		metadata?: Record<string, unknown>
	) {
		await this.logger.log({
			eventType: AuditEventType.AUTH_PERMISSION_REVOKED,
			severity: AuditSeverity.MEDIUM,
			userId,
			ipAddress,
			userAgent,
			details: { permission, revokedBy, ...metadata },
			metadata,
			success: true,
		});
	}

	async logBruteForceDetected(
		ipAddress: string,
		attempts: number,
		timeframe: number,
		_metadata?: Record<string, unknown>
	) {
		await this.logger.log(SecurityEvents.bruteForceDetected(ipAddress, attempts, timeframe));
	}

	async logSuspiciousActivity(
		userId: string,
		activity: string,
		severity: AuditSeverity = AuditSeverity.HIGH,
		_ipAddress?: string,
		_userAgent?: string,
		metadata?: Record<string, unknown>
	) {
		await this.logger.log(
			SecurityEvents.suspiciousActivity(userId, activity, {
				severity,
				...metadata,
			})
		);
	}
}

// Global auth audit logger instance
let globalAuthAuditLogger: AuthAuditLogger | null = null;

export function getAuthAuditLogger(): AuthAuditLogger {
	if (!globalAuthAuditLogger) {
		globalAuthAuditLogger = new AuthAuditLogger();
	}
	return globalAuthAuditLogger;
}

// Helper functions for common auth events
export const authAudit = {
	loginSuccess: (userId: string, method: string, req?: Request) => {
		const ip = req?.headers?.get("x-forwarded-for") || req?.headers?.get("x-real-ip");
		const userAgent = req?.headers?.get("user-agent");
		return getAuthAuditLogger().logLoginSuccess(
			userId,
			method,
			ip ?? undefined,
			userAgent ?? undefined
		);
	},

	loginFailure: (identifier: string, reason: string, req?: Request) => {
		const ip = req?.headers?.get("x-forwarded-for") || req?.headers?.get("x-real-ip");
		const userAgent = req?.headers?.get("user-agent");
		return getAuthAuditLogger().logLoginFailure(
			identifier,
			reason,
			ip ?? undefined,
			userAgent ?? undefined
		);
	},

	logout: (userId: string, req?: Request) => {
		const ip = req?.headers?.get("x-forwarded-for") || req?.headers?.get("x-real-ip");
		const userAgent = req?.headers?.get("user-agent");
		return getAuthAuditLogger().logLogout(userId, ip ?? undefined, userAgent ?? undefined);
	},

	accessDenied: (userId: string, resource: string, action: string, req?: Request) => {
		const ip = req?.headers?.get("x-forwarded-for") || req?.headers?.get("x-real-ip");
		const userAgent = req?.headers?.get("user-agent");
		return getAuthAuditLogger().logAccessDenied(
			userId,
			resource,
			action,
			ip ?? undefined,
			userAgent ?? undefined
		);
	},
};
