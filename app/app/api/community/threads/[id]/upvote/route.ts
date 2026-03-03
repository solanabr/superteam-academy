/**
 * Thread Upvote API — toggle upvote on a thread.
 *
 * POST   → upvote (or remove upvote if already upvoted)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/backend/auth/auth-options';
import { checkRateLimit } from '@/backend/auth/rate-limit';
import { getClientIp } from '@/backend/auth/ip';
import { prisma } from '@/backend/prisma';

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
    const { id: threadId } = await params;
    const ip = getClientIp(request);
    const { success, response } = await checkRateLimit(`thread-upvote:${ip}`, 'strict');
    if (!success) return response!;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if already upvoted
    const existing = await prisma.thread_upvotes.findUnique({
        where: {
            thread_id_user_id: { thread_id: threadId, user_id: session.user.id },
        },
    });

    if (existing) {
        // Remove upvote
        const [, updated] = await prisma.$transaction([
            prisma.thread_upvotes.delete({ where: { id: existing.id } }),
            prisma.threads.update({
                where: { id: threadId },
                data: { upvotes: { decrement: 1 } },
                select: { upvotes: true },
            }),
        ]);
        return NextResponse.json({ upvoted: false, upvotes: updated.upvotes });
    }

    // Add upvote
    const [, updated] = await prisma.$transaction([
        prisma.thread_upvotes.create({
            data: { thread_id: threadId, user_id: session.user.id },
        }),
        prisma.threads.update({
            where: { id: threadId },
            data: { upvotes: { increment: 1 } },
            select: { upvotes: true },
        }),
    ]);
    return NextResponse.json({ upvoted: true, upvotes: updated.upvotes });
}
