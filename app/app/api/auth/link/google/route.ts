import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/backend/auth/auth-options';
import { checkRateLimit } from '@/backend/auth/rate-limit';
import { createOAuthState } from '@/backend/auth/oauth-state';
import { prisma } from '@/backend/prisma';

export async function POST(request: NextRequest) {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const { success, response } = await checkRateLimit(`link-google:${ip}`);
    if (!success) return response!;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Prevent re-linking if Google is already linked to this account
    const existingLink = await prisma.linked_accounts.findFirst({
        where: { user_id: session.user.id, provider: 'google' },
    });
    if (existingLink) {
        return NextResponse.json(
            { error: 'Google account already linked' },
            { status: 400 }
        );
    }

    // CSRF protection: OAuth state includes HMAC signature, nonce, and expiration.
    // NOTE: This state is passed to Google but the callback goes to NextAuth's
    // built-in handler (/api/auth/callback/google), which manages its own CSRF
    // protection via NextAuth's internal state mechanism. The custom state serves
    // as a secondary defense layer but is NOT verified on callback since NextAuth
    // handles the return flow. To fully implement custom state verification,
    // a dedicated callback route would be needed (future improvement).
    const state = createOAuthState(session.user.id, 'link');

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID!);
    authUrl.searchParams.set(
        'redirect_uri',
        `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
    );
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'openid email profile');
    authUrl.searchParams.set('state', state);

    return NextResponse.json({ url: authUrl.toString() });
}
