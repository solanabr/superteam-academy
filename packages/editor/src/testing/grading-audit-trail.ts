import type { GradingResult, ExecutionResult } from "./challenge-types";
import type { CheatDetectionResult } from "./anti-cheat-system";

export interface AuditEntry {
	id: string;
	timestamp: Date;
	userId: string;
	challengeId: string;
	action: AuditAction;
	details: AuditDetails;
	metadata: AuditMetadata;
}

export type AuditAction =
	| "submission_received"
	| "execution_started"
	| "execution_completed"
	| "grading_started"
	| "grading_completed"
	| "cheat_detection_ran"
	| "score_calculated"
	| "feedback_generated"
	| "result_finalized"
	| "manual_review_requested"
	| "score_adjusted"
	| "appeal_submitted"
	| "appeal_resolved";

export interface AuditDetails {
	executionResult?: ExecutionResult;
	gradingResult?: GradingResult;
	cheatDetectionResult?: CheatDetectionResult;
	codeSnippet?: string;
	errorMessage?: string;
	adjustmentReason?: string;
	appealReason?: string;
	reviewerNotes?: string;
}

export interface AuditMetadata {
	ipAddress?: string;
	userAgent?: string;
	sessionId?: string;
	executionEnvironment: string;
	codeLength: number;
	executionTime: number;
	memoryUsed: number;
	testCasesRun: number;
	testCasesPassed: number;
}

export interface AuditTrail {
	submissionId: string;
	userId: string;
	challengeId: string;
	entries: AuditEntry[];
	finalResult: GradingResult;
	status: "completed" | "under_review" | "appealed" | "adjusted";
	createdAt: Date;
	updatedAt: Date;
}

export interface AuditQuery {
	userId?: string;
	challengeId?: string;
	action?: AuditAction;
	dateRange?: { start: Date; end: Date };
	status?: AuditTrail["status"];
	limit?: number;
	offset?: number;
}

export interface AuditSummary {
	totalEntries: number;
	actionsBreakdown: { [key in AuditAction]: number };
	averageExecutionTime: number;
	commonErrors: { error: string; count: number }[];
	gradingDistribution: { grade: string; count: number }[];
	cheatDetectionStats: {
		totalChecked: number;
		suspiciousFound: number;
		criticalFlags: number;
	};
}

export class GradingAuditTrail {
	private auditTrails: Map<string, AuditTrail> = new Map();
	private auditEntries: AuditEntry[] = [];

	createAuditTrail(submissionId: string, userId: string, challengeId: string): AuditTrail {
		const trail: AuditTrail = {
			submissionId,
			userId,
			challengeId,
			entries: [],
			finalResult: {} as GradingResult, // Will be updated later
			status: "completed",
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		this.auditTrails.set(submissionId, trail);
		return trail;
	}

	addEntry(
		submissionId: string,
		action: AuditAction,
		details: AuditDetails,
		metadata: AuditMetadata
	): AuditEntry {
		const entry: AuditEntry = {
			id: this.generateEntryId(),
			timestamp: new Date(),
			userId: "", // Will be set from trail
			challengeId: "", // Will be set from trail
			action,
			details,
			metadata,
		};

		const trail = this.auditTrails.get(submissionId);
		if (trail) {
			entry.userId = trail.userId;
			entry.challengeId = trail.challengeId;
			trail.entries.push(entry);
			trail.updatedAt = new Date();
			this.auditEntries.push(entry);
		}

		return entry;
	}

	updateFinalResult(submissionId: string, result: GradingResult): void {
		const trail = this.auditTrails.get(submissionId);
		if (trail) {
			trail.finalResult = result;
			trail.updatedAt = new Date();
		}
	}

	updateStatus(submissionId: string, status: AuditTrail["status"]): void {
		const trail = this.auditTrails.get(submissionId);
		if (trail) {
			trail.status = status;
			trail.updatedAt = new Date();
		}
	}

	getAuditTrail(submissionId: string): AuditTrail | null {
		return this.auditTrails.get(submissionId) || null;
	}

	queryAuditEntries(query: AuditQuery): AuditEntry[] {
		let results = [...this.auditEntries];

		if (query.userId) {
			results = results.filter((entry) => entry.userId === query.userId);
		}

		if (query.challengeId) {
			results = results.filter((entry) => entry.challengeId === query.challengeId);
		}

		if (query.action) {
			results = results.filter((entry) => entry.action === query.action);
		}

		if (query.dateRange) {
			const { start, end } = query.dateRange;
			results = results.filter((entry) => entry.timestamp >= start && entry.timestamp <= end);
		}

		if (query.status) {
			const trailIds = Array.from(this.auditTrails.values())
				.filter((trail) => trail.status === query.status)
				.map((trail) => trail.submissionId);

			results = results.filter((entry) =>
				trailIds.includes(entry.details.executionResult?.testResults[0]?.testCaseId || "")
			);
		}

		// Sort by timestamp descending
		results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

		// Apply pagination
		const offset = query.offset || 0;
		const limit = query.limit || 50;
		return results.slice(offset, offset + limit);
	}

	getAuditSummary(query?: AuditQuery): AuditSummary {
		const entries = query ? this.queryAuditEntries(query) : this.auditEntries;

		const actionsBreakdown = entries.reduce(
			(acc, entry) => {
				acc[entry.action] = (acc[entry.action] || 0) + 1;
				return acc;
			},
			{} as { [key in AuditAction]: number }
		);

		const executionTimes = entries
			.filter((entry) => entry.metadata.executionTime > 0)
			.map((entry) => entry.metadata.executionTime);

		const averageExecutionTime =
			executionTimes.length > 0
				? executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length
				: 0;

		const errorEntries = entries.filter((entry) => entry.details.errorMessage);
		const errorCounts = new Map<string, number>();
		errorEntries.forEach((entry) => {
			const error = entry.details.errorMessage || "Unknown Error";
			errorCounts.set(error, (errorCounts.get(error) || 0) + 1);
		});

		const commonErrors = Array.from(errorCounts.entries())
			.sort((a, b) => b[1] - a[1])
			.slice(0, 10)
			.map(([error, count]) => ({ error, count }));

		const gradingEntries = entries.filter((entry) => entry.action === "grading_completed");
		const gradeCounts = new Map<string, number>();
		gradingEntries.forEach((entry) => {
			if (entry.details.gradingResult?.grade) {
				const grade = entry.details.gradingResult.grade;
				gradeCounts.set(grade, (gradeCounts.get(grade) || 0) + 1);
			}
		});

		const gradingDistribution = Array.from(gradeCounts.entries())
			.sort((a, b) => b[1] - a[1])
			.map(([grade, count]) => ({ grade, count }));

		const cheatDetectionEntries = entries.filter(
			(entry) => entry.action === "cheat_detection_ran"
		);
		const suspiciousEntries = cheatDetectionEntries.filter(
			(entry) => entry.details.cheatDetectionResult?.isSuspicious
		);
		const criticalEntries = cheatDetectionEntries.filter((entry) =>
			entry.details.cheatDetectionResult?.flags.some((flag) => flag.severity === "critical")
		);

		const cheatDetectionStats = {
			totalChecked: cheatDetectionEntries.length,
			suspiciousFound: suspiciousEntries.length,
			criticalFlags: criticalEntries.length,
		};

		return {
			totalEntries: entries.length,
			actionsBreakdown,
			averageExecutionTime,
			commonErrors,
			gradingDistribution,
			cheatDetectionStats,
		};
	}

	exportAuditTrail(submissionId: string): string {
		const trail = this.getAuditTrail(submissionId);
		if (!trail) {
			throw new Error(`Audit trail not found for submission: ${submissionId}`);
		}

		const exportData = {
			submissionId: trail.submissionId,
			userId: trail.userId,
			challengeId: trail.challengeId,
			status: trail.status,
			createdAt: trail.createdAt.toISOString(),
			updatedAt: trail.updatedAt.toISOString(),
			finalResult: trail.finalResult,
			entries: trail.entries.map((entry) => ({
				id: entry.id,
				timestamp: entry.timestamp.toISOString(),
				action: entry.action,
				details: this.sanitizeDetails(entry.details),
				metadata: entry.metadata,
			})),
		};

		return JSON.stringify(exportData, null, 2);
	}

	getComplianceReport(dateRange: { start: Date; end: Date }): {
		totalSubmissions: number;
		auditCoverage: number;
		averageAuditEntriesPerSubmission: number;
		suspiciousActivities: number;
		manualReviews: number;
		appealsProcessed: number;
	} {
		const entries = this.auditEntries.filter(
			(entry) => entry.timestamp >= dateRange.start && entry.timestamp <= dateRange.end
		);

		const submissionIds = new Set(
			entries.map((entry) => {
				// Find submission ID from entry (this would need proper mapping in real implementation)
				return entry.details.executionResult?.testResults[0]?.testCaseId || "";
			})
		).size;

		const suspiciousActivities = entries.filter(
			(entry) =>
				entry.action === "cheat_detection_ran" &&
				entry.details.cheatDetectionResult?.isSuspicious
		).length;

		const manualReviews = entries.filter(
			(entry) => entry.action === "manual_review_requested"
		).length;

		const appealsProcessed = entries.filter(
			(entry) => entry.action === "appeal_resolved"
		).length;

		return {
			totalSubmissions: submissionIds,
			auditCoverage: submissionIds > 0 ? entries.length / submissionIds : 0,
			averageAuditEntriesPerSubmission:
				submissionIds > 0 ? entries.length / submissionIds : 0,
			suspiciousActivities,
			manualReviews,
			appealsProcessed,
		};
	}

	private generateEntryId(): string {
		return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	private sanitizeDetails(details: AuditDetails): AuditDetails {
		// Remove sensitive information from audit details
		const sanitized = { ...details };

		// Truncate code snippets for privacy
		if (sanitized.codeSnippet && sanitized.codeSnippet.length > 200) {
			sanitized.codeSnippet = `${sanitized.codeSnippet.substring(0, 200)}...`;
		}

		// Remove potential PII from error messages
		if (sanitized.errorMessage) {
			sanitized.errorMessage = sanitized.errorMessage.replace(
				/\/Users\/[^/]+/g,
				"/Users/[REDACTED]"
			);
		}

		return sanitized;
	}
}
