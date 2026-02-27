/**
 * Helius DAS API Client
 * Used for Token-2022 XP balance indexing and NFT credential queries
 */
import { PublicKey } from '@solana/web3.js';
import { XP_MINT } from './program-config';
import type { LeaderboardEntry } from './idl-types';
import { calculateLevel } from './program-client';

// ==================== Types ====================

interface HeliusAsset {
  id: string;
  content: {
    json_uri: string;
    metadata: {
      name: string;
      symbol: string;
      description?: string;
      image?: string;
      attributes?: Array<{
        trait_type: string;
        value: string | number;
      }>;
    };
  };
  authorities: Array<{
    address: string;
    scopes: string[];
  }>;
  compression: {
    compressed: boolean;
  };
  grouping: Array<{
    group_key: string;
    group_value: string;
  }>;
  royalty: {
    royalty_model: string;
    target: string | null;
    percent: number;
    basis_points: number;
    primary_sale_happened: boolean;
    locked: boolean;
  };
  creators: Array<{
    address: string;
    share: number;
    verified: boolean;
  }>;
  ownership: {
    frozen: boolean;
    delegated: boolean;
    delegate: string | null;
    ownership_model: string;
    owner: string;
  };
  supply: {
    print_max_supply: number;
    print_current_supply: number;
    edition_nonce: number | null;
  } | null;
  mutable: boolean;
  burnt: boolean;
}

interface HeliusTokenHolder {
  owner: string;
  balance: number;
  mint: string;
}

interface HeliusResponse<T> {
  result: T;
  id: string;
}

interface DasSearchAssetsResponse {
  total: number;
  limit: number;
  page: number;
  items: HeliusAsset[];
}

interface TokenHoldersResponse {
  token_accounts: HeliusTokenHolder[];
  cursor?: string;
}

// ==================== API Configuration ====================

function getHeliusApiKey(): string {
  return process.env.NEXT_PUBLIC_HELIUS_API_KEY || '';
}

function getHeliusRpcUrl(): string {
  const apiKey = getHeliusApiKey();
  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';

  if (apiKey) {
    return `https://${network}.helius-rpc.com/?api-key=${apiKey}`;
  }

  // Fallback to standard RPC
  return process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';
}

// ==================== DAS API Methods ====================

/**
 * Fetch all NFT credentials owned by a wallet
 */
export async function fetchCredentialNfts(ownerAddress: string): Promise<HeliusAsset[]> {
  const apiKey = getHeliusApiKey();

  if (!apiKey) {
    console.warn('Helius API key not configured, returning empty credentials');
    return [];
  }

  try {
    const response = await fetch(getHeliusRpcUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'credential-query',
        method: 'searchAssets',
        params: {
          ownerAddress,
          tokenType: 'all',
          displayOptions: {
            showUnverifiedCollections: true,
            showCollectionMetadata: true,
            showFungible: false,
            showNativeBalance: false,
          },
        },
      }),
    });

    const data: HeliusResponse<DasSearchAssetsResponse> = await response.json();

    // Filter for Metaplex Core credentials (frozen = soulbound)
    return data.result.items.filter((asset) => asset.ownership.frozen && !asset.burnt);
  } catch (error) {
    console.error('Error fetching credential NFTs:', error);
    return [];
  }
}

/**
 * Fetch assets by collection (for achievement NFTs)
 */
export async function fetchAssetsByCollection(
  collectionAddress: string,
  page: number = 1,
  limit: number = 100
): Promise<HeliusAsset[]> {
  const apiKey = getHeliusApiKey();

  if (!apiKey) {
    return [];
  }

  try {
    const response = await fetch(getHeliusRpcUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'collection-query',
        method: 'getAssetsByGroup',
        params: {
          groupKey: 'collection',
          groupValue: collectionAddress,
          page,
          limit,
        },
      }),
    });

    const data: HeliusResponse<DasSearchAssetsResponse> = await response.json();
    return data.result.items;
  } catch (error) {
    console.error('Error fetching collection assets:', error);
    return [];
  }
}

/**
 * Fetch a single asset by ID
 */
export async function fetchAsset(assetId: string): Promise<HeliusAsset | null> {
  const apiKey = getHeliusApiKey();

  if (!apiKey) {
    return null;
  }

  try {
    const response = await fetch(getHeliusRpcUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'asset-query',
        method: 'getAsset',
        params: {
          id: assetId,
          displayOptions: {
            showUnverifiedCollections: true,
            showCollectionMetadata: true,
          },
        },
      }),
    });

    const data: HeliusResponse<HeliusAsset> = await response.json();
    return data.result;
  } catch (error) {
    console.error('Error fetching asset:', error);
    return null;
  }
}

// ==================== Token-2022 XP Leaderboard ====================

/**
 * Fetch XP token holders for leaderboard
 * Uses Helius getTokenHolders API
 */
export async function fetchXpLeaderboard(limit: number = 100): Promise<LeaderboardEntry[]> {
  const apiKey = getHeliusApiKey();

  if (!apiKey) {
    console.warn('Helius API key not configured, returning empty leaderboard');
    return [];
  }

  try {
    // Use Helius REST API for token holders
    const url = `https://api.helius.xyz/v0/token-holders?api-key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mint: XP_MINT.toBase58(),
        limit,
      }),
    });

    const data: TokenHoldersResponse = await response.json();

    // Transform to leaderboard entries
    const entries: LeaderboardEntry[] = data.token_accounts
      .map((holder, index) => ({
        rank: index + 1,
        wallet: new PublicKey(holder.owner),
        xpBalance: holder.balance,
        level: calculateLevel(holder.balance),
      }))
      .sort((a, b) => b.xpBalance - a.xpBalance)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));

    return entries;
  } catch (error) {
    console.error('Error fetching XP leaderboard:', error);
    return [];
  }
}

/**
 * Get rank and stats for a specific wallet
 */
export async function fetchWalletRankAndStats(wallet: PublicKey): Promise<{
  rank: number;
  xpBalance: number;
  level: number;
  totalParticipants: number;
} | null> {
  try {
    const leaderboard = await fetchXpLeaderboard(1000);
    const walletStr = wallet.toBase58();

    const entry = leaderboard.find((e) => e.wallet.toBase58() === walletStr);

    if (!entry) {
      return {
        rank: leaderboard.length + 1,
        xpBalance: 0,
        level: 0,
        totalParticipants: leaderboard.length,
      };
    }

    return {
      rank: entry.rank,
      xpBalance: entry.xpBalance,
      level: entry.level,
      totalParticipants: leaderboard.length,
    };
  } catch (error) {
    console.error('Error fetching wallet rank:', error);
    return null;
  }
}

// ==================== Credential Parsing ====================

export interface ParsedCredential {
  id: string;
  name: string;
  description?: string;
  image?: string;
  trackName?: string;
  coursesCompleted: number;
  totalXp: number;
  issuedAt?: string;
  metadataUri: string;
  owner: string;
  isFrozen: boolean;
}

/**
 * Parse a Helius asset into a credential format
 */
export function parseCredential(asset: HeliusAsset): ParsedCredential {
  const attributes = asset.content.metadata.attributes || [];

  const getAttribute = (traitType: string): string | number | undefined => {
    const attr = attributes.find((a) => a.trait_type === traitType);
    return attr?.value;
  };

  return {
    id: asset.id,
    name: asset.content.metadata.name,
    description: asset.content.metadata.description,
    image: asset.content.metadata.image,
    trackName: getAttribute('track') as string | undefined,
    coursesCompleted: (getAttribute('courses_completed') as number) || 0,
    totalXp: (getAttribute('total_xp') as number) || 0,
    issuedAt: getAttribute('issued_at') as string | undefined,
    metadataUri: asset.content.json_uri,
    owner: asset.ownership.owner,
    isFrozen: asset.ownership.frozen,
  };
}

/**
 * Fetch and parse all credentials for a wallet
 */
export async function fetchWalletCredentials(ownerAddress: string): Promise<ParsedCredential[]> {
  const assets = await fetchCredentialNfts(ownerAddress);
  return assets.map(parseCredential);
}

// ==================== Achievement NFTs ====================

export interface ParsedAchievement {
  id: string;
  achievementId: string;
  name: string;
  description?: string;
  image?: string;
  xpReward: number;
  rarity?: string;
  awardedAt?: string;
  owner: string;
}

/**
 * Parse a Helius asset into an achievement format
 */
export function parseAchievement(asset: HeliusAsset): ParsedAchievement {
  const attributes = asset.content.metadata.attributes || [];

  const getAttribute = (traitType: string): string | number | undefined => {
    const attr = attributes.find((a) => a.trait_type === traitType);
    return attr?.value;
  };

  return {
    id: asset.id,
    achievementId: (getAttribute('achievement_id') as string) || asset.id,
    name: asset.content.metadata.name,
    description: asset.content.metadata.description,
    image: asset.content.metadata.image,
    xpReward: (getAttribute('xp_reward') as number) || 0,
    rarity: getAttribute('rarity') as string | undefined,
    awardedAt: getAttribute('awarded_at') as string | undefined,
    owner: asset.ownership.owner,
  };
}

// Export types
export type { HeliusAsset, HeliusTokenHolder };
