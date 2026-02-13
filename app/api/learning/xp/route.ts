import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/server-session';
import { getStoredXP } from '@/lib/learning/server-progress-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function resolveUserId(queryUserId: string | null, sessionUserId: string | null): string | null {
  if (queryUserId && queryUserId.trim().length > 0) {
    return queryUserId.trim();
  }

  return sessionUserId;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionFromRequest(request);
  const userId = resolveUserId(request.nextUrl.searchParams.get('userId'), session?.user.id ?? null);

  if (!userId) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  const xp = await getStoredXP(userId);
  return NextResponse.json({ userId, xp });
}
