/**
 * Admin Community Moderation API.
 *
 * POST → moderate a thread (pin/unpin/lock/unlock/delete)
 *
 * Admin-only endpoint for forum moderation actions.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/backend/auth/auth-options';
import { checkRateLimit } from '@/backend/auth/rate-limit';
import { getClientIp } from '@/backend/auth/ip';
import { isAdmin } from '@/backend/admin/auth';
import { prisma } from '@/backend/prisma';

type ModerationAction = 'pin' | 'unpin' | 'lock' | 'unlock' | 'delete';
const VALID_ACTIONS: ModerationAction[] = ['pin', 'unpin', 'lock', 'unlock', 'delete'];

export async function POST(request: NextRequest) {
    const ip = getClientIp(request);
    const { success, response } = await checkRateLimit(`mod:${ip}`, 'strict');
    if (!success) return response!;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = await isAdmin(session);
    if (!admin) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    let body: { threadId?: string; action?: string; reason?: string };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { threadId, action, reason } = body;

    if (!threadId || typeof threadId !== 'string') {
        return NextResponse.json({ error: 'threadId is required' }, { status: 400 });
    }
    if (!action || !VALID_ACTIONS.includes(action as ModerationAction)) {
        return NextResponse.json(
            { error: `Invalid action. Must be one of: ${VALID_ACTIONS.join(', ')}` },
            { status: 400 }
        );
    }

    // Verify thread exists
    const thread = await prisma.threads.findUnique({ where: { id: threadId } });
    if (!thread) {
        return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    // Execute moderation action
    switch (action as ModerationAction) {
        case 'pin':
            await prisma.threads.update({ where: { id: threadId }, data: { is_pinned: true } });
            break;
        case 'unpin':
            await prisma.threads.update({ where: { id: threadId }, data: { is_pinned: false } });
            break;
        case 'lock':
            await prisma.threads.update({ where: { id: threadId }, data: { is_locked: true } });
            break;
        case 'unlock':
            await prisma.threads.update({ where: { id: threadId }, data: { is_locked: false } });
            break;
        case 'delete':
            await prisma.threads.delete({ where: { id: threadId } });
            break;
    }

    // Log moderation action
    await prisma.audit_logs.create({
        data: {
            user_id: session.user.id,
            action: `thread_${action}`,
            metadata: {
                threadId,
                threadTitle: thread.title,
                reason: reason || null,
            },
        },
    });

    console.log(`[Moderation] ${action} thread ${threadId} by admin ${session.user.id}${reason ? ` reason: ${reason}` : ''}`);

    return NextResponse.json({
        success: true,
        action,
        threadId,
        message: `Thread ${action === 'delete' ? 'deleted' : action + (action.endsWith('e') ? 'd' : 'ed')}`,
    });
}
