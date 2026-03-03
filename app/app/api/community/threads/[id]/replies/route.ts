/**
 * Thread Replies API — list and create replies.
 *
 * GET  → list replies for a thread (sorted: accepted first, then by upvotes)
 * POST → create a new reply
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/backend/auth/auth-options';
import { checkRateLimit } from '@/backend/auth/rate-limit';
import { getClientIp } from '@/backend/auth/ip';
import { prisma } from '@/backend/prisma';

const MAX_REPLY_LENGTH = 5000;

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    const { id: threadId } = await params;
    const ip = getClientIp(request);
    const { success, response } = await checkRateLimit(`replies-list:${ip}`);
    if (!success) return response!;

    const replies = await prisma.replies.findMany({
        where: { thread_id: threadId },
        include: {
            author: {
                select: { id: true, name: true, avatar_url: true, username: true },
            },
        },
        orderBy: [{ is_accepted: 'desc' }, { upvotes: 'desc' }, { created_at: 'asc' }],
    });

    return NextResponse.json(replies);
}

export async function POST(request: NextRequest, { params }: RouteParams) {
    const { id: threadId } = await params;
    const ip = getClientIp(request);
    const { success, response } = await checkRateLimit(`reply-create:${ip}`, 'strict');
    if (!success) return response!;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check thread exists and is not locked
    const thread = await prisma.threads.findUnique({
        where: { id: threadId },
        select: { id: true, is_locked: true },
    });
    if (!thread) {
        return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }
    if (thread.is_locked) {
        return NextResponse.json({ error: 'Thread is locked' }, { status: 403 });
    }

    let body: { content?: string };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { content } = body;
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }
    if (content.length > MAX_REPLY_LENGTH) {
        return NextResponse.json({ error: `Reply must be under ${MAX_REPLY_LENGTH} characters` }, { status: 400 });
    }

    // Create reply and increment thread reply_count atomically
    const [reply] = await prisma.$transaction([
        prisma.replies.create({
            data: {
                thread_id: threadId,
                content: content.trim(),
                author_id: session.user.id,
            },
            include: {
                author: {
                    select: { id: true, name: true, avatar_url: true, username: true },
                },
            },
        }),
        prisma.threads.update({
            where: { id: threadId },
            data: { reply_count: { increment: 1 } },
        }),
    ]);

    return NextResponse.json(reply, { status: 201 });
}
