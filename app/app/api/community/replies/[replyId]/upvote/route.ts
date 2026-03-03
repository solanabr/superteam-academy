/**
 * Reply Upvote API — toggle upvote on a reply.
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
    params: Promise<{ replyId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
    const { replyId } = await params;
    const ip = getClientIp(request);
    const { success, response } = await checkRateLimit(`reply-upvote:${ip}`, 'strict');
    if (!success) return response!;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if already upvoted
    const existing = await prisma.reply_upvotes.findUnique({
        where: {
            reply_id_user_id: { reply_id: replyId, user_id: session.user.id },
        },
    });

    if (existing) {
        // Remove upvote
        const [, updated] = await prisma.$transaction([
            prisma.reply_upvotes.delete({ where: { id: existing.id } }),
            prisma.replies.update({
                where: { id: replyId },
                data: { upvotes: { decrement: 1 } },
                select: { upvotes: true },
            }),
        ]);
        return NextResponse.json({ upvoted: false, upvotes: updated.upvotes });
    }

    // Add upvote
    const [, updated] = await prisma.$transaction([
        prisma.reply_upvotes.create({
            data: { reply_id: replyId, user_id: session.user.id },
        }),
        prisma.replies.update({
            where: { id: replyId },
            data: { upvotes: { increment: 1 } },
            select: { upvotes: true },
        }),
    ]);
    return NextResponse.json({ upvoted: true, upvotes: updated.upvotes });
}
