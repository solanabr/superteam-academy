/**
 * Reply Actions API — accept answer.
 *
 * POST → accept a reply as the answer (thread author only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/backend/auth/auth-options';
import { checkRateLimit } from '@/backend/auth/rate-limit';
import { getClientIp } from '@/backend/auth/ip';
import { prisma } from '@/backend/prisma';

interface RouteParams {
    params: Promise<{ replyId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
    const { replyId } = await params;
    const ip = getClientIp(request);
    const { success, response } = await checkRateLimit(`reply-accept:${ip}`, 'strict');
    if (!success) return response!;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get reply and its thread
    const reply = await prisma.replies.findUnique({
        where: { id: replyId },
        include: { thread: { select: { author_id: true } } },
    });

    if (!reply) {
        return NextResponse.json({ error: 'Reply not found' }, { status: 404 });
    }

    // Only thread author can accept
    if (reply.thread.author_id !== session.user.id) {
        return NextResponse.json({ error: 'Only thread author can accept answers' }, { status: 403 });
    }

    // Unaccept previous accepted reply, accept this one
    await prisma.$transaction([
        prisma.replies.updateMany({
            where: { thread_id: reply.thread_id, is_accepted: true },
            data: { is_accepted: false },
        }),
        prisma.replies.update({
            where: { id: replyId },
            data: { is_accepted: true },
        }),
    ]);

    return NextResponse.json({ accepted: true });
}
