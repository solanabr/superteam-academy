/**
 * Test Indexer Connection
 *
 * POST /api/admin/indexer-settings/test
 *
 * Accepts { provider, apiKey?, rpcUrl? } and attempts a small
 * leaderboard fetch to validate the configuration.
 */
import { NextRequest, NextResponse } from 'next/server';
import { buildIndexer } from '@/lib/solana/indexer';
import type { IndexerProvider, IndexerSettings } from '@/lib/solana/indexer';

interface TestBody {
  provider: IndexerProvider;
  apiKey?: string;
  rpcUrl?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: TestBody = await request.json();

    if (!body.provider) {
      return NextResponse.json({ error: 'provider is required' }, { status: 400 });
    }

    // Build a temporary settings object
    const settings: IndexerSettings = {
      activeProvider: body.provider,
      helius: {
        apiKey: body.provider === 'helius' ? (body.apiKey || '') : '',
        rpcUrl: body.provider === 'helius' ? (body.rpcUrl || '') : '',
      },
      alchemy: {
        apiKey: body.provider === 'alchemy' ? (body.apiKey || '') : '',
        rpcUrl: body.provider === 'alchemy' ? (body.rpcUrl || '') : '',
      },
      custom: {
        rpcUrl: body.provider === 'custom' ? (body.rpcUrl || '') : '',
      },
    };

    const indexer = buildIndexer(settings);

    const start = Date.now();
    const entries = await indexer.fetchLeaderboard(5);
    const elapsed = Date.now() - start;

    return NextResponse.json({
      success: true,
      provider: body.provider,
      entriesReturned: entries.length,
      responseTimeMs: elapsed,
      message: entries.length > 0
        ? `Connected successfully — found ${entries.length} holder(s) in ${elapsed}ms`
        : `Connected but no XP token holders found (mint may not have holders yet). Response: ${elapsed}ms`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 200 } // 200 so the UI can read the body
    );
  }
}
