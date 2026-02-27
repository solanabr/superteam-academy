import { NextRequest, NextResponse } from 'next/server';
import { learningProgressService } from '@/lib/services/learning-progress';

/**
 * Get on-chain credentials (Metaplex Core NFTs, soulbound) for a wallet. Stub: returns [].
 * Production: Helius DAS or Metaplex Read API, filter by collection.
 */
export async function GET(request: NextRequest) {
  const wallet = request.nextUrl.searchParams.get('wallet');
  if (!wallet) {
    return NextResponse.json({ credentials: [] });
  }
  const credentials = await learningProgressService.getCredentials(wallet);
  return NextResponse.json({ credentials });
}
