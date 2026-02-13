import { NextResponse } from 'next/server';
import { clearSession } from '@/lib/auth/server-session';

export const runtime = 'nodejs';

export async function POST(): Promise<NextResponse> {
  const response = NextResponse.json({
    ok: true
  });
  clearSession(response);
  return response;
}
