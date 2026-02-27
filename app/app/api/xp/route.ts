import { NextRequest, NextResponse } from 'next/server';
import { learningProgressService } from '@/lib/services/learning-progress';

/**
 * Get XP balance and level for a wallet. Stub: derived from progress API.
 * Production: read Token-2022 balance for XP mint. Level = floor(sqrt(xp/100)).
 */
export async function GET(request: NextRequest) {
  const wallet = request.nextUrl.searchParams.get('wallet');
  if (!wallet) {
    return NextResponse.json({ error: 'wallet required' }, { status: 400 });
  }
  const balance = await learningProgressService.getXPBalance(wallet);
  return NextResponse.json(balance);
}
