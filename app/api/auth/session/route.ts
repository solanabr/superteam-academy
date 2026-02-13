import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/server-session';

export const runtime = 'nodejs';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionFromRequest(request);

  if (!session) {
    return NextResponse.json({
      authenticated: false,
      user: null
    });
  }

  return NextResponse.json({
    authenticated: true,
    user: session.user,
    expiresAt: session.expiresAt
  });
}
