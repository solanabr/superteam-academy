/**
 * Admin Authority API.
 *
 * GET /api/admin/authority — returns authorized wallet addresses for on-chain operations.
 * Protected by admin session check.
 *
 * Used by client-side course forms to validate the connected wallet
 * matches an authorized admin wallet before signing transactions.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/backend/auth/auth-options';
import { isAdmin } from '@/backend/admin/auth';
import { prisma } from '@/backend/prisma';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || !(await isAdmin(session))) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Collect all authorized wallets from both env and DB whitelist
        const envWallets: string[] = (process.env.ADMIN_WALLETS || '')
            .split(',').map(w => w.trim()).filter(Boolean);

        const dbEntries = await prisma.admin_whitelist.findMany({
            where: { removed_at: null, wallet: { not: null } },
            select: { wallet: true },
        });

        const dbWallets = dbEntries
            .map(e => e.wallet)
            .filter((w): w is string => !!w);

        // Combine and deduplicate
        const authorizedWallets = [...new Set([...envWallets, ...dbWallets])];

        return NextResponse.json({
            authorizedWallets,
            sessionWallet: session.walletAddress || null,
        });
    } catch (error) {
        console.error('[admin/authority]', error);
        return NextResponse.json(
            { error: 'Failed to fetch authority data' },
            { status: 500 }
        );
    }
}
