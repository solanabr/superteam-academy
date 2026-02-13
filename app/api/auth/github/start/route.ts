import { NextRequest, NextResponse } from 'next/server';
import { startOAuth } from '@/lib/auth/server-oauth-handlers';

export const runtime = 'nodejs';

export async function GET(request: NextRequest): Promise<NextResponse> {
  return startOAuth(request, 'github');
}
