import { NextRequest, NextResponse } from 'next/server';
import { decryptCallbackUrl } from '@/backend/auth/callback';

/**
 * Decrypts an encrypted callback URL token.
 * Used by the login page to resolve the intended redirect destination.
 */
export async function GET(request: NextRequest) {
    const token = request.nextUrl.searchParams.get('token');
    if (!token) {
        return NextResponse.json({ url: null });
    }

    const url = decryptCallbackUrl(token);
    return NextResponse.json({ url: url || '/dashboard' });
}
