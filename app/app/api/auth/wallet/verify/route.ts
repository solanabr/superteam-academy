import { NextRequest, NextResponse } from 'next/server';
import { verifyWalletSignature } from '@/backend/auth/wallet';
import { getNonce } from '@/backend/auth/nonce-store';
import { isValidSolanaAddress } from '@/backend/auth/validation';
import { checkRateLimit } from '@/backend/auth/rate-limit';

/**
 * Lightweight pre-check: verifies the wallet signature is valid before
 * the client calls signIn('wallet'). Does NOT consume the nonce —
 * that happens in auth-options.ts authorize().
 */
export async function POST(request: NextRequest) {
    try {
        const ip = request.headers.get('x-forwarded-for') || 'unknown';
        const { success, response } = await checkRateLimit(`wallet-verify:${ip}`);
        if (!success) return response!;

        const { walletAddress, message, signature } = await request.json();

        if (!walletAddress || !message || !signature) {
            return NextResponse.json(
                { error: 'Missing required fields', code: 'MISSING_FIELDS' },
                { status: 400 }
            );
        }

        if (!isValidSolanaAddress(walletAddress)) {
            return NextResponse.json(
                { error: 'Invalid wallet address', code: 'INVALID_ADDRESS' },
                { status: 400 }
            );
        }

        // Verify stored nonce exists and matches
        const storedMessage = await getNonce(`wallet:auth:${walletAddress}`);

        if (!storedMessage) {
            return NextResponse.json(
                { error: 'Auth message expired or not found', code: 'MESSAGE_EXPIRED' },
                { status: 400 }
            );
        }

        if (message !== storedMessage) {
            return NextResponse.json(
                { error: 'Invalid message', code: 'INVALID_MESSAGE' },
                { status: 400 }
            );
        }

        // Verify ed25519 signature
        const isValid = verifyWalletSignature(walletAddress, message, signature);

        if (!isValid) {
            return NextResponse.json(
                { error: 'Invalid signature', code: 'INVALID_SIGNATURE' },
                { status: 401 }
            );
        }

        // Pre-check passed — client should now call signIn('wallet')
        // which will re-verify and consume the nonce atomically
        return NextResponse.json({ verified: true });
    } catch (error) {
        console.error('Wallet verification error:', error);
        return NextResponse.json(
            { error: 'Internal server error', code: 'INTERNAL_ERROR' },
            { status: 500 }
        );
    }
}
