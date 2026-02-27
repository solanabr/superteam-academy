/**
 * Admin Indexer Settings API
 *
 * GET  /api/admin/indexer-settings  — read current settings
 * POST /api/admin/indexer-settings  — save settings & flush cache
 */
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { IndexerSettingsModel } from '@/models/IndexerSettings';
import { invalidateIndexerCache } from '@/lib/solana/indexer';

// ---------- GET ----------

export async function GET() {
  try {
    await connectToDatabase();

    const doc = await IndexerSettingsModel.findOne({ key: 'indexer' }).lean();

    if (!doc) {
      return NextResponse.json({
        activeProvider: 'custom',
        heliusApiKey: '',
        heliusRpcUrl: '',
        alchemyApiKey: '',
        alchemyRpcUrl: '',
        customRpcUrl: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
      });
    }

    return NextResponse.json({
      activeProvider: doc.activeProvider,
      heliusApiKey: doc.heliusApiKey,
      heliusRpcUrl: doc.heliusRpcUrl,
      alchemyApiKey: doc.alchemyApiKey,
      alchemyRpcUrl: doc.alchemyRpcUrl,
      customRpcUrl: doc.customRpcUrl,
    });
  } catch (error) {
    console.error('GET /api/admin/indexer-settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------- POST ----------

interface SaveBody {
  activeProvider?: string;
  heliusApiKey?: string;
  heliusRpcUrl?: string;
  alchemyApiKey?: string;
  alchemyRpcUrl?: string;
  customRpcUrl?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SaveBody = await request.json();

    // Validate provider value
    const validProviders = ['custom', 'helius', 'alchemy'];
    if (body.activeProvider && !validProviders.includes(body.activeProvider)) {
      return NextResponse.json(
        { error: `Invalid provider. Use one of: ${validProviders.join(', ')}` },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const update: Record<string, unknown> = {};
    if (body.activeProvider !== undefined) update.activeProvider = body.activeProvider;
    if (body.heliusApiKey !== undefined) update.heliusApiKey = body.heliusApiKey;
    if (body.heliusRpcUrl !== undefined) update.heliusRpcUrl = body.heliusRpcUrl;
    if (body.alchemyApiKey !== undefined) update.alchemyApiKey = body.alchemyApiKey;
    if (body.alchemyRpcUrl !== undefined) update.alchemyRpcUrl = body.alchemyRpcUrl;
    if (body.customRpcUrl !== undefined) update.customRpcUrl = body.customRpcUrl;

    await IndexerSettingsModel.findOneAndUpdate(
      { key: 'indexer' },
      { $set: update },
      { upsert: true, returnDocument: 'after' }
    );

    // Flush cached provider so subsequent requests pick up new settings
    invalidateIndexerCache();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/admin/indexer-settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
