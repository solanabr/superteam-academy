import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/backend/auth/auth-options';
import { verifyWalletSignature } from '@/backend/auth/wallet';
import { prisma } from '@/backend/prisma';
import { getNonce, deleteNonce } from '@/backend/auth/nonce-store';
import { isValidSolanaAddress } from '@/backend/auth/validation';
import { checkRateLimit } from '@/backend/auth/rate-limit';
import { logAuditEvent } from '@/backend/auth/audit';

export async function POST(request: NextRequest) {
    try {
        const ip = request.headers.get('x-forwarded-for') || 'unknown';
        const { success, response } = await checkRateLimit(`link-wallet:${ip}`);
        if (!success) return response!;

        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { walletAddress, message, signature } = await request.json();

        if (!walletAddress || !isValidSolanaAddress(walletAddress)) {
            return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
        }

        // Verify nonce (async)
        const storedMessage = await getNonce(`wallet:auth:${walletAddress}`);
        if (!storedMessage || message !== storedMessage) {
            return NextResponse.json(
                { error: 'Invalid or expired message' },
                { status: 400 }
            );
        }

        // Verify signature
        const isValid = verifyWalletSignature(walletAddress, message, signature);
        if (!isValid) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        await deleteNonce(`wallet:auth:${walletAddress}`);

        // Check if wallet already linked to ANY account (including the current user's)
        const existing = await prisma.linked_accounts.findFirst({
            where: { provider: 'wallet', provider_id: walletAddress },
            select: { user_id: true },
        });

        if (existing) {
            const msg = existing.user_id === session.user.id
                ? 'Wallet already linked to your account'
                : 'Wallet already linked to another account';
            return NextResponse.json({ error: msg }, { status: 400 });
        }

        // Link wallet
        await prisma.linked_accounts.create({
            data: {
                user_id: session.user.id,
                provider: 'wallet',
                provider_id: walletAddress,
                last_used_at: new Date(),
            },
        });

        // Update profile wallet_address if not set
        await prisma.profiles.updateMany({
            where: { id: session.user.id, wallet_address: null },
            data: { wallet_address: walletAddress },
        });

        await logAuditEvent({
            userId: session.user.id,
            action: 'wallet_linked',
            ip,
            userAgent: request.headers.get('user-agent'),
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Link wallet error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
