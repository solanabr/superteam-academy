import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/backend/auth/auth-options';
import { prisma } from '@/backend/prisma';
import { checkRateLimit } from '@/backend/auth/rate-limit';
import { logAuditEvent } from '@/backend/auth/audit';

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ provider: string }> }
) {
    try {
        const ip = request.headers.get('x-forwarded-for') || 'unknown';
        const { success, response } = await checkRateLimit(`unlink:${ip}`);
        if (!success) return response!;

        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { provider } = await params;

        // Count linked accounts
        const accountCount = await prisma.linked_accounts.count({
            where: { user_id: session.user.id },
        });

        if (accountCount <= 1) {
            return NextResponse.json(
                { error: 'Cannot unlink the only authentication method' },
                { status: 400 }
            );
        }

        // Delete the link
        await prisma.linked_accounts.deleteMany({
            where: { user_id: session.user.id, provider },
        });

        // Clear wallet_address if unlinking wallet
        if (provider === 'wallet') {
            await prisma.profiles.update({
                where: { id: session.user.id },
                data: { wallet_address: null },
            });
        }

        await logAuditEvent({
            userId: session.user.id,
            action: `${provider}_unlinked`,
            ip,
            userAgent: request.headers.get('user-agent'),
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Unlink error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
