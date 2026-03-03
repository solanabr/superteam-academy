/**
 * Webhook Delivery Service.
 *
 * Sends HMAC-signed webhook payloads to configured endpoints.
 * Payloads are signed with SHA-256 HMAC using the webhook secret.
 */

import crypto from 'crypto';
import type { WebhookConfig, WebhookDeliverPayload } from './types';
import { prisma } from '@/backend/prisma';

// ── In-memory webhook config (production: from DB) ───────────────────

const webhookConfigs: WebhookConfig[] = [];

/**
 * Register a webhook endpoint.
 */
export function registerWebhook(config: WebhookConfig): void {
    const existing = webhookConfigs.findIndex((w) => w.id === config.id);
    if (existing >= 0) {
        webhookConfigs[existing] = config;
    } else {
        webhookConfigs.push(config);
    }
}

/**
 * Remove a webhook endpoint.
 */
export function removeWebhook(id: string): boolean {
    const idx = webhookConfigs.findIndex((w) => w.id === id);
    if (idx === -1) return false;
    webhookConfigs.splice(idx, 1);
    return true;
}

/**
 * Get all configured webhooks.
 */
export function getWebhooks(): WebhookConfig[] {
    return [...webhookConfigs];
}

/**
 * Deliver a webhook payload to all matching endpoints.
 * Called by the queue processor.
 */
export async function deliverWebhook(payload: WebhookDeliverPayload): Promise<void> {
    const { url, event, data, secret } = payload;

    const body = JSON.stringify({
        event,
        data,
        timestamp: Date.now(),
    });

    const signature = signPayload(body, secret);

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': signature,
            'X-Webhook-Event': event,
        },
        body,
        signal: AbortSignal.timeout(10_000), // 10s timeout
    });

    if (!response.ok) {
        throw new Error(`Webhook delivery failed: ${response.status} ${response.statusText}`);
    }
}

/**
 * Broadcast an event to all webhooks subscribed to that event type.
 * Loads active webhook configs from the database.
 */
export async function broadcastEvent(
    event: string,
    data: Record<string, unknown>
): Promise<{ sent: number; failed: number }> {
    // Load from DB first, fall back to in-memory
    let targets: { url: string; secret: string; events: string[] }[] = [];

    try {
        targets = await prisma.webhook_configs.findMany({
            where: { active: true },
            select: { url: true, secret: true, events: true },
        });
    } catch {
        // DB unavailable — fall back to in-memory configs
        targets = webhookConfigs
            .filter((w) => w.isActive)
            .map((w) => ({ url: w.url, secret: w.secret, events: w.events }));
    }

    // Filter to webhooks subscribed to this event
    const matching = targets.filter(
        (w) => w.events.includes(event) || w.events.includes('*')
    );

    let sent = 0;
    let failed = 0;

    for (const target of matching) {
        try {
            await deliverWebhook({
                url: target.url,
                event,
                data,
                secret: target.secret,
            });
            sent++;
        } catch (error) {
            console.error(`[Webhook] Failed to deliver to ${target.url}:`, error);
            failed++;
        }
    }

    return { sent, failed };
}

// ── HMAC Signing ─────────────────────────────────────────────────────

function signPayload(payload: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Verify a webhook signature (for incoming webhooks).
 */
export function verifySignature(
    payload: string,
    signature: string,
    secret: string
): boolean {
    const expected = signPayload(payload, secret);
    return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expected, 'hex')
    );
}
