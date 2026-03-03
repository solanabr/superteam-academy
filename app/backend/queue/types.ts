/**
 * Webhook & Queue — Job Types and Interfaces.
 *
 * Defines all async job types processed by the queue system.
 */

// ── Job Types ────────────────────────────────────────────────────────

export type JobType =
    | 'transaction.submit'
    | 'notification.send'
    | 'notification.push'
    | 'analytics.track'
    | 'webhook.deliver'
    | 'leaderboard.refresh'
    | 'report.daily';

export interface QueueJob<T = unknown> {
    id: string;
    type: JobType;
    payload: T;
    attempts: number;
    maxAttempts: number;
    createdAt: number;
    scheduledAt?: number;
    lastError?: string;
}

// ── Payload Types ────────────────────────────────────────────────────

export interface TransactionSubmitPayload {
    serializedTx: string;
    description: string;
    userId?: string;
}

export interface NotificationSendPayload {
    userId: string;
    type: string;
    title: string;
    message: string;
    data?: Record<string, unknown>;
}

export interface NotificationPushPayload {
    userId: string;
    title: string;
    body: string;
    url?: string;
}

export interface AnalyticsTrackPayload {
    event: string;
    userId?: string;
    properties: Record<string, unknown>;
}

export interface WebhookDeliverPayload {
    url: string;
    event: string;
    data: Record<string, unknown>;
    secret: string;
}

// ── Webhook Config ───────────────────────────────────────────────────

export interface WebhookConfig {
    id: string;
    url: string;
    secret: string;
    events: string[];
    isActive: boolean;
}

// ── Dead Letter Entry ────────────────────────────────────────────────

export interface DeadLetterEntry {
    job: QueueJob;
    failedAt: number;
    error: string;
}
