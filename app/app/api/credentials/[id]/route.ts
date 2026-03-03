/**
 * Credential details API route.
 *
 * GET — fetch credential NFT details by asset ID via Helius DAS.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCredentialDetails } from '@/context/solana/credential-service';
import { checkRateLimit } from '@/backend/auth/rate-limit';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Rate limit
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
        const { success: rlOk, response: rlRes } = await checkRateLimit(`credential:${ip}`);
        if (!rlOk) return rlRes!;

        const { id: assetId } = await params;

        if (!assetId || assetId.length < 32 || assetId.length > 88) {
            return NextResponse.json({ error: 'Invalid asset ID' }, { status: 400 });
        }

        const credential = await getCredentialDetails(assetId);

        return NextResponse.json(credential);
    } catch (error) {
        console.error('[api/credentials/[id]] GET error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch credential details' },
            { status: 500 }
        );
    }
}
