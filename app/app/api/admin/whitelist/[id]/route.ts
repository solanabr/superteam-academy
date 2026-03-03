import { getServerSession } from 'next-auth';
import { NextResponse, NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { authOptions } from '@/backend/auth/auth-options';
import { isAdmin } from '@/backend/admin/auth';
import { verifyOrigin } from '@/backend/admin/csrf';
import { prisma } from '@/backend/prisma';
import { checkRateLimit } from '@/backend/auth/rate-limit';
import { getClientIp } from '@/backend/auth/ip';
import { logAuditEvent } from '@/backend/auth/audit';

const MAX_SERIALIZATION_RETRIES = 3;

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

    // Rate limit — double-gate: IP + admin userId
    const ip = getClientIp(request);
    const { success: rl1, response: r1 } = await checkRateLimit(`admin-wl:${ip}`, 'strict');
    if (!rl1) return r1!;
    const { success: rl2, response: r2 } = await checkRateLimit(`admin-wl:${session!.user.id}`, 'strict');
    if (!rl2) return r2!;

    const { id } = await params;

    // Retry wrapper for Postgres serialization failures (P2034)
    for (let attempt = 0; attempt < MAX_SERIALIZATION_RETRIES; attempt++) {
        try {
            await prisma.$transaction(
                async (tx) => {
                    // Lock the row being deleted
                    const entries = await tx.$queryRaw<
                        { id: string; email: string | null; wallet: string | null }[]
                    >`
                        SELECT id, email, wallet FROM admin_whitelist
                        WHERE id = ${id}::uuid AND removed_at IS NULL
                        FOR UPDATE
                    `;
                    if (!entries.length) throw new Error('Entry not found');
                    const entry = entries[0];

                    // Prevent self-removal
                    if (
                        (entry.email && entry.email === session!.user.email) ||
                        (entry.wallet && entry.wallet === session!.walletAddress)
                    ) {
                        throw new Error('Cannot remove your own admin access');
                    }

                    // At least 1 DB admin must remain.
                    // ADMIN_WALLETS env entries are intentionally excluded from this count.
                    // The check is conservative: prevents removing the last DB-managed admin
                    // even if an env backdoor exists (env vars can be removed without warning).
                    const remaining = await tx.admin_whitelist.count({
                        where: { removed_at: null, id: { not: id } },
                    });
                    if (remaining === 0) {
                        throw new Error('Cannot remove last admin — at least 1 must remain');
                    }

                    // Soft-delete
                    await tx.admin_whitelist.update({
                        where: { id },
                        data: { removed_at: new Date() },
                    });

                    // Bump session_version — REQUIRED on revocation
                    // (stale "still admin" JWT is a security risk)
                    const profileConditions: Prisma.profilesWhereInput[] = [];
                    if (entry.email) profileConditions.push({ email: entry.email });
                    if (entry.wallet) profileConditions.push({ wallet_address: entry.wallet });

                    if (profileConditions.length > 0) {
                        const affected = await tx.profiles.findFirst({
                            where: { OR: profileConditions },
                            select: { id: true },
                        });
                        if (affected) {
                            await tx.profiles.update({
                                where: { id: affected.id },
                                data: { session_version: { increment: 1 } },
                            });
                        }
                    }
                },
                { isolationLevel: 'Serializable' }
            );

            // Success — log and return
            logAuditEvent({
                userId: session!.user.id,
                action: 'admin_whitelist_remove',
                metadata: { entry_id: id },
            });
            return NextResponse.json({ success: true });
        } catch (error: unknown) {
            // Retry on Prisma serialization failure (concurrent transaction conflict)
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2034'
            ) {
                if (attempt < MAX_SERIALIZATION_RETRIES - 1) continue;
                return NextResponse.json(
                    { error: 'Transaction conflict — please retry' },
                    { status: 409 }
                );
            }
            const msg = error instanceof Error ? error.message : 'Unknown error';
            return NextResponse.json({ error: msg }, { status: 400 });
        }
    }

    return NextResponse.json({ error: 'Transaction failed after retries' }, { status: 500 });
}
