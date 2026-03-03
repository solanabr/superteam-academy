/**
 * Wallet Link API — links a wallet to an existing (email/OAuth) profile.
 *
 * POST — verify signature, create linked_account, set wallet_address
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/backend/auth/auth-options';
import { prisma } from '@/backend/prisma';
import { verifyWalletSignature } from '@/backend/auth/wallet';
import { getNonce, deleteNonce } from '@/backend/auth/nonce-store';
import { isValidSolanaAddress } from '@/backend/auth/validation';
import { checkRateLimit } from '@/backend/auth/rate-limit';
import { getClientIp } from '@/backend/auth/ip';
import { logAuditEvent } from '@/backend/auth/audit';

export async function POST(request: NextRequest) {
    try {
        // Rate limit
        const ip = getClientIp(request);
        const { success: rlOk, response: rlRes } = await checkRateLimit(`wallet-link:${ip}`);
        if (!rlOk) return rlRes!;

        // Must be authenticated
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Parse body
        let body: Record<string, unknown>;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
        }

        const { walletAddress, message, signature } = body as {
            walletAddress?: string;
            message?: string;
            signature?: string;
        };

        if (!walletAddress || !message || !signature) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (!isValidSolanaAddress(walletAddress)) {
            return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
        }

        // Verify stored nonce
        const storedMessage = await getNonce(`wallet:auth:${walletAddress}`);
        if (!storedMessage || message !== storedMessage) {
            return NextResponse.json({ error: 'Invalid or expired nonce' }, { status: 400 });
        }

        // Verify signature
        const isValid = verifyWalletSignature(walletAddress, message, signature);
        if (!isValid) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
        }

        // Consume nonce
        await deleteNonce(`wallet:auth:${walletAddress}`);

        // Check if wallet is already linked to any account
        const existingLink = await prisma.linked_accounts.findFirst({
            where: { provider: 'wallet', provider_id: walletAddress },
        });

        if (existingLink) {
            if (existingLink.user_id === session.user.id) {
                return NextResponse.json({ message: 'Wallet already linked to your account' });
            }
            return NextResponse.json({ error: 'Wallet is linked to a different account' }, { status: 409 });
        }

        // Check if profile already has a wallet_address
        const profile = await prisma.profiles.findUnique({
            where: { id: session.user.id },
            select: { wallet_address: true },
        });

        if (profile?.wallet_address && profile.wallet_address !== walletAddress) {
            return NextResponse.json({ error: 'A different wallet is already linked' }, { status: 409 });
        }

        // Atomic: create linked_account + set wallet_address
        await prisma.$transaction([
            prisma.linked_accounts.create({
                data: {
                    user_id: session.user.id,
                    provider: 'wallet',
                    provider_id: walletAddress,
                    last_used_at: new Date(),
                },
            }),
            prisma.profiles.update({
                where: { id: session.user.id },
                data: { wallet_address: walletAddress },
            }),
        ]);

        await logAuditEvent({ userId: session.user.id, action: 'wallet_linked' });

        return NextResponse.json({ success: true, walletAddress });
    } catch (error) {
        console.error('[api/auth/wallet/link] POST error:', error);
        return NextResponse.json({ error: 'Failed to link wallet' }, { status: 500 });
    }
}
