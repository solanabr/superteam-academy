/**
 * Admin Users API route.
 *
 * Provides paginated, searchable user listing from Prisma profiles.
 * Protected by admin session check.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/backend/auth/auth-options';
import { isAdmin } from '@/backend/admin/auth';
import { prisma } from '@/backend/prisma';
import { ADMIN_PAGE_SIZE } from '@/backend/admin/utils';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!(await isAdmin(session))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const searchParams = request.nextUrl.searchParams;
        const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1);
        const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || String(ADMIN_PAGE_SIZE)) || ADMIN_PAGE_SIZE));
        const search = (searchParams.get('search') || '').trim();

        if (search.length > 100) {
            return NextResponse.json({ error: 'Search query too long' }, { status: 400 });
        }

        const where = search
            ? {
                deleted_at: null,
                OR: [
                    { name: { contains: search, mode: 'insensitive' as const } },
                    { email: { contains: search, mode: 'insensitive' as const } },
                    { wallet_address: { contains: search, mode: 'insensitive' as const } },
                    { username: { contains: search, mode: 'insensitive' as const } },
                ],
            }
            : { deleted_at: null };

        const [users, total] = await Promise.all([
            prisma.profiles.findMany({
                where,
                include: {
                    _count: { select: { linked_accounts: true } },
                    streaks: { select: { current_streak: true, longest_streak: true } },
                },
                skip: (page - 1) * pageSize,
                take: pageSize,
                orderBy: { created_at: 'desc' },
            }),
            prisma.profiles.count({ where }),
        ]);

        return NextResponse.json({
            users: users.map((u) => ({
                id: u.id,
                name: u.name,
                email: u.email,
                username: u.username,
                wallet_address: u.wallet_address,
                avatar_url: u.avatar_url,
                role: u.role,
                login_count: u.login_count,
                last_login_at: u.last_login_at?.toISOString() ?? null,
                created_at: u.created_at.toISOString(),
                linked_accounts_count: u._count.linked_accounts,
                streak: u.streaks ?? null,
            })),
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        });
    } catch (error) {
        console.error('[admin/users]', error);
        return NextResponse.json(
            { error: 'Failed to fetch users' },
            { status: 500 }
        );
    }
}
