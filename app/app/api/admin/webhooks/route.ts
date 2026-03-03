/**
 * Admin Webhook Management API
 *
 * GET    → list all webhook configs (admin only)
 * POST   → register a new webhook (admin only)
 * DELETE → remove a webhook by ID (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/backend/auth/auth-options';
import { checkRateLimit } from '@/backend/auth/rate-limit';
import { getClientIp } from '@/backend/auth/ip';
import { prisma } from '@/backend/prisma';

async function isAdmin(): Promise<string | null> {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return null;
    const profile = await prisma.profiles.findUnique({
        where: { id: session.user.id },
        select: { role: true },
    });
    return profile?.role === 'admin' ? session.user.id : null;
}

export async function GET(request: NextRequest) {
    const ip = getClientIp(request);
    const { success, response } = await checkRateLimit(`webhooks:${ip}`);
    if (!success) return response!;

    const adminId = await isAdmin();
    if (!adminId) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

    const webhooks = await prisma.webhook_configs.findMany({
        orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({ webhooks });
}

export async function POST(request: NextRequest) {
    const ip = getClientIp(request);
    const { success, response } = await checkRateLimit(`webhooks:${ip}`, 'strict');
    if (!success) return response!;

    const adminId = await isAdmin();
    if (!adminId) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

    const body = await request.json();
    const { url, secret, events } = body;

    if (!url || typeof url !== 'string') {
        return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }
    if (!secret || typeof secret !== 'string' || secret.length < 16) {
        return NextResponse.json({ error: 'Secret must be at least 16 characters' }, { status: 400 });
    }
    if (!Array.isArray(events) || events.length === 0) {
        return NextResponse.json({ error: 'At least one event type is required' }, { status: 400 });
    }

    const webhook = await prisma.webhook_configs.create({
        data: {
            url,
            secret,
            events,
            active: true,
            created_by: adminId,
        },
    });

    return NextResponse.json({ webhook }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
    const adminId = await isAdmin();
    if (!adminId) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

    const body = await request.json();
    const { id } = body;

    if (!id) return NextResponse.json({ error: 'Webhook ID required' }, { status: 400 });

    await prisma.webhook_configs.delete({ where: { id } });
    return NextResponse.json({ success: true });
}
