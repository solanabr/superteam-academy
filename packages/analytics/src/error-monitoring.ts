/**
 * Error monitoring via the official Sentry SDK.
 *
 * Re-exports `@sentry/nextjs` and provides academy-specific helpers
 * for categorized error reporting.
 */

import * as Sentry from "@sentry/nextjs";

export { Sentry };

export enum ErrorSeverity {
	LOW = "low",
	MEDIUM = "medium",
	HIGH = "high",
	CRITICAL = "critical",
}

export enum ErrorCategory {
	NETWORK = "network",
	AUTHENTICATION = "authentication",
	AUTHORIZATION = "authorization",
	VALIDATION = "validation",
	BUSINESS_LOGIC = "business_logic",
	EXTERNAL_SERVICE = "external_service",
	PERFORMANCE = "performance",
	UNKNOWN = "unknown",
}

const sentryLevelMap: Record<ErrorSeverity, Sentry.SeverityLevel> = {
	[ErrorSeverity.LOW]: "info",
	[ErrorSeverity.MEDIUM]: "warning",
	[ErrorSeverity.HIGH]: "error",
	[ErrorSeverity.CRITICAL]: "fatal",
};

export function captureError(
	error: unknown,
	options?: {
		severity?: ErrorSeverity;
		category?: ErrorCategory;
		tags?: Record<string, string>;
		extra?: Record<string, unknown>;
		userId?: string;
	}
): string {
	const eventId = Sentry.captureException(error, (scope) => {
		if (options?.severity) {
			scope.setLevel(sentryLevelMap[options.severity]);
		}
		if (options?.category) {
			scope.setTag("error.category", options.category);
		}
		if (options?.userId) {
			scope.setUser({ id: options.userId });
		}
		if (options?.tags) {
			for (const [key, value] of Object.entries(options.tags)) {
				scope.setTag(key, value);
			}
		}
		if (options?.extra) {
			scope.setExtras(options.extra);
		}
		return scope;
	});
	return eventId;
}

export function captureMessage(
	message: string,
	severity: ErrorSeverity = ErrorSeverity.MEDIUM,
	extra?: Record<string, unknown>
): void {
	Sentry.captureMessage(message, (scope) => {
		scope.setLevel(sentryLevelMap[severity]);
		if (extra) {
			scope.setExtras(extra);
		}
		return scope;
	});
}

export function setErrorUser(userId: string, email?: string, username?: string): void {
	Sentry.setUser({ id: userId, email, username });
}

export function clearErrorUser(): void {
	Sentry.setUser(null);
}

export function addBreadcrumb(
	message: string,
	category: string,
	data?: Record<string, unknown>
): void {
	Sentry.addBreadcrumb({
		message,
		category,
		data,
		level: "info",
	});
}
