import { NextRequest, NextResponse } from 'next/server';
import { setSession } from '@/lib/auth/server-session';
import { signInWithCredentials } from '@/lib/auth/server-store';

export const runtime = 'nodejs';

interface CredentialsSignInBody {
  email?: string;
  password?: string;
  callbackUrl?: string;
}

function safeRedirect(path: string | undefined): string {
  if (!path || !path.startsWith('/')) {
    return '/dashboard';
  }
  return path;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json()) as CredentialsSignInBody;

  if (!body.email || !body.password) {
    return NextResponse.json({ error: 'missing_credentials' }, { status: 400 });
  }

  try {
    const user = await signInWithCredentials({
      email: body.email,
      password: body.password
    });

    const response = NextResponse.json({
      ok: true,
      redirectUrl: safeRedirect(body.callbackUrl),
      user
    });
    setSession(response, user.id);
    return response;
  } catch {
    return NextResponse.json({ error: 'invalid_credentials' }, { status: 401 });
  }
}
