/**
 * Reply CRUD — delete a reply (author only).
 *
 * DELETE → delete a reply and decrement thread reply_count
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/backend/auth/auth-options';
import { checkRateLimit } from '@/backend/auth/rate-limit';
import { getClientIp } from '@/backend/auth/ip';
import { isAdmin } from '@/backend/admin/auth';
import { prisma } from '@/backend/prisma';

interface RouteParams {
    params: Promise<{ replyId: string }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const { replyId } = await params;
    const ip = getClientIp(request);
    const { success, response } = await checkRateLimit(`reply-delete:${ip}`, 'strict');
    if (!success) return response!;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reply = await prisma.replies.findUnique({
        where: { id: replyId },
        select: { id: true, author_id: true, thread_id: true },
    });

    if (!reply) {
        return NextResponse.json({ error: 'Reply not found' }, { status: 404 });
    }

    // Author or admin can delete
    const admin = await isAdmin(session);
    if (reply.author_id !== session.user.id && !admin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.$transaction([
        prisma.replies.delete({ where: { id: replyId } }),
        prisma.threads.update({
            where: { id: reply.thread_id },
            data: { reply_count: { decrement: 1 } },
        }),
    ]);

    return NextResponse.json({ message: 'Reply deleted' });
}
