import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/backend/auth/auth-options';
import { prisma } from '@/backend/prisma';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const accounts = await prisma.linked_accounts.findMany({
            where: { user_id: session.user.id },
        });

        const linkedProviders = accounts.map((a) => a.provider);

        return NextResponse.json({
            accounts,
            hasWallet: linkedProviders.includes('wallet'),
            hasGoogle: linkedProviders.includes('google'),
            hasGitHub: linkedProviders.includes('github'),
        });
    } catch (error) {
        console.error('Linked accounts error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
