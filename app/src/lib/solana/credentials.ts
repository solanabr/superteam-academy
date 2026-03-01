import { HELIUS_RPC_URL } from './constants';
import type { Credential } from '@/types';

interface HeliusAsset {
  id: string;
  content?: {
    metadata?: {
      name?: string;
      attributes?: Array<{ trait_type: string; value: string }>;
    };
    links?: {
      image?: string;
    };
    json_uri?: string;
  };
  grouping?: Array<{ group_key: string; group_value: string }>;
  ownership?: {
    owner: string;
  };
}

/** Fetch credentials (Metaplex Core NFTs) for a wallet via Helius DAS API */
export async function fetchCredentials(
  walletAddress: string,
  trackCollectionAddress?: string
): Promise<Credential[]> {
  try {
    const response = await fetch(HELIUS_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: '1',
        method: 'getAssetsByOwner',
        params: {
          ownerAddress: walletAddress,
          page: 1,
          limit: 100,
        },
      }),
    });

    const data = await response.json();
    const items: HeliusAsset[] = data?.result?.items || [];

    // Filter by collection if specified
    const filtered = trackCollectionAddress
      ? items.filter((item) =>
          item.grouping?.some(
            (g) =>
              g.group_key === 'collection' &&
              g.group_value === trackCollectionAddress
          )
        )
      : items;

    return filtered.map((item) => {
      const attrs = item.content?.metadata?.attributes || [];
      const getAttr = (name: string): string =>
        attrs.find((a) => a.trait_type === name)?.value || '0';

      return {
        assetAddress: item.id,
        name: item.content?.metadata?.name || 'Credential',
        imageUrl: item.content?.links?.image || '/images/credential-placeholder.svg',
        trackId: parseInt(getAttr('track_id'), 10),
        coursesCompleted: parseInt(getAttr('courses_completed'), 10),
        totalXp: parseInt(getAttr('total_xp'), 10),
        awardedAt: Date.now(),
      };
    });
  } catch (error) {
    console.error('Failed to fetch credentials:', error);
    return [];
  }
}

/** Fetch XP leaderboard via Helius token holder indexing */
export async function fetchLeaderboard(
  xpMintAddress: string,
  limit: number = 50
): Promise<Array<{ wallet: string; xp: number }>> {
  try {
    const response = await fetch(HELIUS_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: '1',
        method: 'getTokenAccounts',
        params: {
          mint: xpMintAddress,
          page: 1,
          limit,
        },
      }),
    });

    const data = await response.json();
    const accounts = data?.result?.token_accounts || [];

    return accounts
      .map((acc: { owner: string; amount: string }) => ({
        wallet: acc.owner,
        xp: parseInt(acc.amount, 10),
      }))
      .sort((a: { xp: number }, b: { xp: number }) => b.xp - a.xp);
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error);
    return [];
  }
}
