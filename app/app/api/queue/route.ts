/**
 * Queue & Webhook API — admin control and metrics.
 *
 * GET  → queue metrics + cron status
 * POST → control actions (start-cron, stop-cron, retry-dead-letter)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/backend/auth/auth-options';
import { isAdmin } from '@/backend/admin/auth';
import { checkRateLimit } from '@/backend/auth/rate-limit';
import { getClientIp } from '@/backend/auth/ip';
import { getQueueMetrics, getDeadLetterEntries, retryDeadLetter } from '@/backend/queue/queue-service';
import { startCronJobs, stopCronJobs, getCronStatus } from '@/backend/queue/cron';
import { getWebhooks } from '@/backend/queue/webhook';

export async function GET(request: NextRequest) {
    const ip = getClientIp(request);
    const { success, response } = await checkRateLimit(`queue-status:${ip}`);
    if (!success) return response!;

    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const admin = await isAdmin(session);
    if (!admin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
        queue: await getQueueMetrics(),
        cron: getCronStatus(),
        webhooks: getWebhooks().length,
        deadLetter: await getDeadLetterEntries(10),
    });
}

export async function POST(request: NextRequest) {
    const ip = getClientIp(request);
    const { success, response } = await checkRateLimit(`queue-control:${ip}`, 'strict');
    if (!success) return response!;

    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const admin = await isAdmin(session);
    if (!admin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let body: { action?: string; jobId?: string };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    switch (body.action) {
        case 'start-cron':
            startCronJobs();
            return NextResponse.json({ message: 'Cron jobs started', cron: getCronStatus() });

        case 'stop-cron':
            stopCronJobs();
            return NextResponse.json({ message: 'Cron jobs stopped', cron: getCronStatus() });

        case 'retry-dead-letter': {
            if (!body.jobId) {
                return NextResponse.json({ error: 'jobId required' }, { status: 400 });
            }
            const retried = await retryDeadLetter(body.jobId);
            return NextResponse.json({
                message: retried ? 'Job re-queued' : 'Job not found in dead letter queue',
                queue: await getQueueMetrics(),
            });
        }

        default:
            return NextResponse.json(
                { error: 'Invalid action. Use: start-cron, stop-cron, retry-dead-letter' },
                { status: 400 }
            );
    }
}
