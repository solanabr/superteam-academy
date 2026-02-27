import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { XPIndexingService } from '@/lib/services/xp-indexing.service';
import { getSolanaXPService } from '@/lib/services/solana-xp.service';

/**
 * GET /api/gamification/sync - Get sync status
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const solanaService = getSolanaXPService();
    const connectionStatus = await solanaService.getConnectionStatus();

    return NextResponse.json({
      configured: solanaService.isConfigured(),
      mintAddress: solanaService.getMintAddress(),
      solanaConnection: connectionStatus,
    });
  } catch (error) {
    console.error('Error getting sync status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/gamification/sync - Sync user XP from on-chain
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Index the current user's XP
    const indexedData = await XPIndexingService.indexUser(session.user.id);

    if (!indexedData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has wallet
    if (indexedData.walletAddress) {
      const solanaService = getSolanaXPService();

      if (solanaService.isConfigured()) {
        try {
          const onChainBalance = await solanaService.getXPBalance(indexedData.walletAddress);

          return NextResponse.json({
            success: true,
            indexed: indexedData,
            onChain: onChainBalance,
            inSync: onChainBalance
              ? Math.abs(onChainBalance.balance - indexedData.offChainXp) < 1
              : true,
          });
        } catch (solanaError) {
          console.error('Error fetching on-chain XP:', solanaError);
          return NextResponse.json({
            success: true,
            indexed: indexedData,
            onChain: null,
            inSync: null,
            warning: 'Could not fetch on-chain balance',
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      indexed: indexedData,
      onChain: null,
      inSync: null,
    });
  } catch (error) {
    console.error('Error syncing XP:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
