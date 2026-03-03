import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/backend/auth/auth-options';
import { checkRateLimit } from '@/backend/auth/rate-limit';
import { createOAuthState } from '@/backend/auth/oauth-state';
import { prisma } from '@/backend/prisma';

export async function POST(request: NextRequest) {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const { success, response } = await checkRateLimit(`link-github:${ip}`);
    if (!success) return response!;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Prevent re-linking if GitHub is already linked to this account
    const existingLink = await prisma.linked_accounts.findFirst({
        where: { user_id: session.user.id, provider: 'github' },
    });
    if (existingLink) {
        return NextResponse.json(
            { error: 'GitHub account already linked' },
            { status: 400 }
        );
    }

    // CSRF protection: OAuth state includes HMAC signature, nonce, and expiration.
    // NOTE: This state is passed to GitHub but the callback goes to NextAuth's
    // built-in handler (/api/auth/callback/github), which manages its own CSRF
    // protection via NextAuth's internal state mechanism. The custom state serves
    // as a secondary defense layer but is NOT verified on callback since NextAuth
    // handles the return flow. To fully implement custom state verification,
    // a dedicated callback route would be needed (future improvement).
    const state = createOAuthState(session.user.id, 'link');

    const authUrl = new URL('https://github.com/login/oauth/authorize');
    authUrl.searchParams.set('client_id', process.env.GITHUB_CLIENT_ID!);
    authUrl.searchParams.set(
        'redirect_uri',
        `${process.env.NEXTAUTH_URL}/api/auth/callback/github`
    );
    authUrl.searchParams.set('scope', 'read:user user:email');
    authUrl.searchParams.set('state', state);

    return NextResponse.json({ url: authUrl.toString() });
}
