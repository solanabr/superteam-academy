import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Get current session
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { provider } = body;

    if (!provider || !['google', 'github'].includes(provider)) {
      return NextResponse.json(
        { error: 'Invalid provider. Must be google or github' },
        { status: 400 }
      );
    }

    // Set linking cookies that will be read by the OAuth callback
    const cookieStore = await cookies();
    cookieStore.set('linking_user_id', session.user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
      path: '/',
    });
    cookieStore.set('linking_provider', provider, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
      path: '/',
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error starting linking process:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to start linking process' }, { status: 500 });
  }
}
