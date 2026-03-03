/**
 * Event Listener API — status and control endpoint.
 *
 * GET  → returns listener status + recent event counts
 * POST → start/stop listener, trigger recovery
 *
 * Protected: admin only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/backend/auth/auth-options';
import { isAdmin } from '@/backend/admin/auth';
import { checkRateLimit } from '@/backend/auth/rate-limit';
import { getClientIp } from '@/backend/auth/ip';
import {
    startEventListener,
    stopEventListener,
    getListenerStatus,
    recoverMissedEvents,
} from '@/backend/events/event-listener';
import { prisma } from '@/backend/prisma';

export async function GET(request: NextRequest) {
    const ip = getClientIp(request);
    const { success, response } = await checkRateLimit(`events-status:${ip}`);
    if (!success) return response!;

    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = await isAdmin(session);
    if (!admin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const status = await getListenerStatus();

    // Get recent event counts (last 24h)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentCounts = await prisma.event_logs.groupBy({
        by: ['event_type'],
        where: { created_at: { gte: oneDayAgo } },
        _count: { id: true },
    });

    const totalEvents = await prisma.event_logs.count();
    const failedEvents = await prisma.event_logs.count({ where: { processed: false } });

    return NextResponse.json({
        ...status,
        stats: {
            total: totalEvents,
            failed: failedEvents,
            last24h: recentCounts.map((r) => ({
                event: r.event_type,
                count: r._count.id,
            })),
        },
    });
}

export async function POST(request: NextRequest) {
    const ip = getClientIp(request);
    const { success, response } = await checkRateLimit(`events-control:${ip}`, 'strict');
    if (!success) return response!;

    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = await isAdmin(session);
    if (!admin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let body: { action?: string };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { action } = body;

    switch (action) {
        case 'start':
            startEventListener();
            return NextResponse.json({ message: 'Event listener started', status: await getListenerStatus() });

        case 'stop':
            await stopEventListener();
            return NextResponse.json({ message: 'Event listener stopped', status: await getListenerStatus() });

        case 'recover': {
            const recovered = await recoverMissedEvents();
            return NextResponse.json({ message: `Recovered ${recovered} events`, status: await getListenerStatus() });
        }

        default:
            return NextResponse.json(
                { error: 'Invalid action. Use: start, stop, recover' },
                { status: 400 }
            );
    }
}
