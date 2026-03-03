/**
 * Admin User Mutations API.
 *
 * PUT  /api/admin/users/[id] — update user role
 * DELETE /api/admin/users/[id] — soft-delete a user
 *
 * Protected by admin session check + CSRF + rate limiting.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/backend/auth/auth-options';
import { isAdmin } from '@/backend/admin/auth';
import { verifyOrigin } from '@/backend/admin/csrf';
import { prisma } from '@/backend/prisma';
import { checkRateLimit } from '@/backend/auth/rate-limit';
import { getClientIp } from '@/backend/auth/ip';
import { logAuditEvent } from '@/backend/auth/audit';

const VALID_ROLES = new Set(['student']);

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!(await isAdmin(session))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const csrfError = verifyOrigin(request);
    if (csrfError) return csrfError;

    const ip = getClientIp(request);
    const { success, response } = await checkRateLimit(`admin-user-mut:${ip}`, 'strict');
    if (!success) return response!;

    const { id } = await params;

    let body: Record<string, unknown>;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const role = typeof body.role === 'string' ? body.role : null;
    if (!role || !VALID_ROLES.has(role)) {
        return NextResponse.json({ error: 'Invalid role. Must be "student".' }, { status: 400 });
    }

    // Prevent self-role-change
    if (id === session!.user.id) {
        return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 });
    }

    try {
        const updated = await prisma.profiles.update({
            where: { id },
            data: {
                role,
                session_version: { increment: 1 }, // Force JWT refresh
            },
            select: { id: true, name: true, role: true },
        });

        logAuditEvent({
            userId: session!.user.id,
            action: 'admin_role_change',
            metadata: { target_user: id, new_role: role },
        });

        return NextResponse.json(updated);
    } catch {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!(await isAdmin(session))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const csrfError = verifyOrigin(request);
    if (csrfError) return csrfError;

    const ip = getClientIp(request);
    const { success, response } = await checkRateLimit(`admin-user-mut:${ip}`, 'strict');
    if (!success) return response!;

    const { id } = await params;

    // Prevent deleting self
    if (id === session!.user.id) {
        return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
    }

    // Prevent deleting another admin
    const targetUser = await prisma.profiles.findUnique({
        where: { id },
        select: { wallet_address: true, email: true },
    });

    if (!targetUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if target is admin via DB whitelist
    const isTargetWhitelisted = await prisma.admin_whitelist.findFirst({
        where: {
            removed_at: null,
            OR: [
                ...(targetUser.wallet_address ? [{ wallet: targetUser.wallet_address }] : []),
                ...(targetUser.email ? [{ email: targetUser.email }] : []),
            ],
        },
    });

    // Check if target is admin via env wallets
    const envAdminWallets = (process.env.ADMIN_WALLETS || '').split(',').map(w => w.trim()).filter(Boolean);
    const isTargetEnvAdmin = targetUser.wallet_address && envAdminWallets.includes(targetUser.wallet_address);

    if (isTargetWhitelisted || isTargetEnvAdmin) {
        return NextResponse.json(
            { error: 'Cannot delete an admin user. Remove admin privileges first.' },
            { status: 403 }
        );
    }

    try {
        // Delete related records first to avoid FK violations
        await prisma.$transaction([
            prisma.linked_accounts.deleteMany({ where: { user_id: id } }),
            prisma.streaks.deleteMany({ where: { user_id: id } }),
            prisma.daily_login_streaks.deleteMany({ where: { user_id: id } }),
            prisma.streak_activity.deleteMany({ where: { user_id: id } }),
            prisma.profiles.delete({ where: { id } }),
        ]);

        logAuditEvent({
            userId: session!.user.id,
            action: 'admin_user_hard_delete',
            metadata: { target_user: id },
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('[admin/users/delete]', err);
        return NextResponse.json({ error: 'User not found or delete failed' }, { status: 404 });
    }
}
