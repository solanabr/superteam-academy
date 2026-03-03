import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/backend/auth/auth-options';
import { prisma } from '@/backend/prisma';
import { checkRateLimit } from '@/backend/auth/rate-limit';
import { logAuditEvent } from '@/backend/auth/audit';

export async function DELETE(request: NextRequest) {
    try {
        const ip = request.headers.get('x-forwarded-for') || 'unknown';
        const { success, response } = await checkRateLimit(`delete-account:${ip}`);
        if (!success) return response!;

        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Soft delete with timestamp (30-day grace period before hard delete)
        await prisma.profiles.update({
            where: { id: session.user.id },
            data: { deleted_at: new Date() },
        });

        await logAuditEvent({
            userId: session.user.id,
            action: 'account_deleted',
            ip,
            userAgent: request.headers.get('user-agent'),
        });

        return NextResponse.json({
            success: true,
            message: 'Account scheduled for deletion. You have 30 days to recover it.',
        });
    } catch (error) {
        console.error('Delete account error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
