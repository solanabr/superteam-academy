import { NextRequest, NextResponse } from 'next/server';
import { generateAuthMessage } from '@/backend/auth/wallet';
import { setNonce } from '@/backend/auth/nonce-store';
import { isValidSolanaAddress } from '@/backend/auth/validation';
import { checkRateLimit } from '@/backend/auth/rate-limit';

export async function POST(request: NextRequest) {
    try {
        const ip = request.headers.get('x-forwarded-for') || 'unknown';
        const { success, response } = await checkRateLimit(`sign-message:${ip}`);
        if (!success) return response!;

        const { walletAddress } = await request.json();

        if (!walletAddress || !isValidSolanaAddress(walletAddress)) {
            return NextResponse.json(
                { error: 'Invalid wallet address' },
                { status: 400 }
            );
        }

        const message = generateAuthMessage(walletAddress);
        await setNonce(`wallet:auth:${walletAddress}`, message);

        return NextResponse.json({ message });
    } catch {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
