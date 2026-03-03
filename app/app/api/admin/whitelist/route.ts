import { getServerSession } from 'next-auth';
import { NextResponse, NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { authOptions } from '@/backend/auth/auth-options';
import { isAdmin } from '@/backend/admin/auth';
import { verifyOrigin } from '@/backend/admin/csrf';
import { prisma } from '@/backend/prisma';
import { checkRateLimit } from '@/backend/auth/rate-limit';
import { getClientIp } from '@/backend/auth/ip';
import { isValidSolanaAddress } from '@/backend/auth/validation';
import { logAuditEvent } from '@/backend/auth/audit';

export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!(await isAdmin(session))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const ip = getClientIp(request);
    const { success, response } = await checkRateLimit(`admin-wl-get:${ip}`, 'default');
    if (!success) return response!;

    const entries = await prisma.admin_whitelist.findMany({
        where: { removed_at: null },
        orderBy: { added_at: 'desc' },
        include: { adder: { select: { name: true, email: true } } },
    });

    return NextResponse.json(entries);
}

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!(await isAdmin(session))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const csrfError = verifyOrigin(request);
    if (csrfError) return csrfError;

    // Rate limit — double-gate: IP + admin userId
    const ip = getClientIp(request);
    const { success: rl1, response: r1 } = await checkRateLimit(`admin-wl:${ip}`, 'strict');
    if (!rl1) return r1!;
    const { success: rl2, response: r2 } = await checkRateLimit(`admin-wl:${session!.user.id}`, 'strict');
    if (!rl2) return r2!;

    // Safe JSON parse
    let body: Record<string, unknown>;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : null;
    const wallet = typeof body.wallet === 'string' ? body.wallet.trim() : null;

    if (!email && !wallet) {
        return NextResponse.json({ error: 'email or wallet required' }, { status: 400 });
    }

    // Validate formats
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }
    if (wallet && !isValidSolanaAddress(wallet)) {
        return NextResponse.json({ error: 'Invalid Solana wallet address' }, { status: 400 });
    }

    try {
        const entry = await prisma.admin_whitelist.create({
            data: { email, wallet, added_by: session!.user.id },
        });

        // session_version intentionally NOT bumped on grant.
        // Stale "not admin yet" is safe — user gains access within 5min JWT recheck.

        // logAuditEvent is fire-and-forget (try/catch inside) — never blocks
        logAuditEvent({
            userId: session!.user.id,
            action: 'admin_whitelist_add',
            metadata: { entry_id: entry.id, email, wallet },
        });

        return NextResponse.json(entry);
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            return NextResponse.json({ error: 'This email or wallet is already whitelisted' }, { status: 409 });
        }
        throw error;
    }
}
