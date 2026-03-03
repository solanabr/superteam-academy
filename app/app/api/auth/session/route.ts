import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/backend/auth/auth-options';
import { prisma } from '@/backend/prisma';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ user: null, session: null });
        }

        const [profile, linkedAccounts] = await Promise.all([
            prisma.profiles.findUnique({
                where: { id: session.user.id },
            }),
            prisma.linked_accounts.findMany({
                where: { user_id: session.user.id },
                select: { provider: true, provider_id: true },
            }),
        ]);

        return NextResponse.json({
            user: profile
                ? {
                    ...profile,
                    linked_accounts: linkedAccounts || [],
                    // Forward admin flag from the signed JWT (via session callback).
                    // This is a read-only display hint; server-side routes independently
                    // verify admin access via isAdmin()/isAdminFromToken().
                    isAdmin: session.user.isAdmin === true,
                }
                : null,
            session: {
                expires: session.expires,
            },
        });
    } catch (error) {
        console.error('Session error:', error);
        return NextResponse.json({ user: null, session: null });
    }
}
