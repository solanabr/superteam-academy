/**
 * Single Thread API — GET, PUT, DELETE.
 *
 * GET    → fetch thread by ID
 * PUT    → update thread (author only)
 * DELETE → delete thread (author or admin)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/backend/auth/auth-options';
import { checkRateLimit } from '@/backend/auth/rate-limit';
import { getClientIp } from '@/backend/auth/ip';
import { isAdmin } from '@/backend/admin/auth';
import { prisma } from '@/backend/prisma';

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    const { id } = await params;
    const ip = getClientIp(request);
    const { success, response } = await checkRateLimit(`thread-get:${ip}`);
    if (!success) return response!;

    const thread = await prisma.threads.findUnique({
        where: { id },
        include: {
            author: {
                select: { id: true, name: true, avatar_url: true, username: true, wallet_address: true },
            },
        },
    });

    if (!thread) {
        return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    return NextResponse.json(thread);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
    const { id } = await params;
    const ip = getClientIp(request);
    const { success, response } = await checkRateLimit(`thread-update:${ip}`, 'strict');
    if (!success) return response!;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const thread = await prisma.threads.findUnique({ where: { id } });
    if (!thread) {
        return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }
    if (thread.author_id !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (thread.is_locked) {
        return NextResponse.json({ error: 'Thread is locked' }, { status: 403 });
    }

    let body: { title?: string; content?: string };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const updated = await prisma.threads.update({
        where: { id },
        data: {
            ...(body.title ? { title: body.title.trim().slice(0, 255) } : {}),
            ...(body.content ? { content: body.content.trim().slice(0, 10000) } : {}),
        },
        include: {
            author: {
                select: { id: true, name: true, avatar_url: true, username: true },
            },
        },
    });

    return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const { id } = await params;
    const ip = getClientIp(request);
    const { success, response } = await checkRateLimit(`thread-delete:${ip}`, 'strict');
    if (!success) return response!;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const thread = await prisma.threads.findUnique({ where: { id } });
    if (!thread) {
        return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    // Author or admin can delete
    const admin = await isAdmin(session);
    if (thread.author_id !== session.user.id && !admin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.threads.delete({ where: { id } });
    return NextResponse.json({ message: 'Thread deleted' });
}
