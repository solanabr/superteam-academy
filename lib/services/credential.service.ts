import { PublicKey } from '@solana/web3.js';
import type { ICredentialService } from '@/lib/types/service-interfaces';

/**
 * Credential Query Service
 * Queries Metaplex Core credentials via Helius DAS API
 */

interface DasAsset {
  id: string;
  created_at?: number;
  content?: {
    json_uri?: string;
    metadata?: {
      name: string;
      symbol: string;
      attributes?: Array<{
        trait_type: string;
        value: string;
      }>;
    };
  };
  grouping?: Array<{
    group_key: string;
    group_value: string;
  }>;
}

export interface Credential {
  assetId: string;
  name: string;
  trackId: string;
  level: number;
  coursesCompleted: number;
  totalXp: number;
  mintedAt: string;
}

export class CredentialService implements ICredentialService {
  constructor(private heliusRpcUrl: string) {}

  /**
   * Fetch all credentials for a wallet
   * Filters by track collection if provided
   */
  async getCredentials(
    walletAddress: PublicKey,
    trackCollectionAddress?: PublicKey
  ): Promise<Credential[]> {
    try {
      const response = await fetch(this.heliusRpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: '1',
          method: 'getAssetsByOwner',
          params: {
            ownerAddress: walletAddress.toString(),
            page: 1,
            limit: 100,
          },
        }),
      });

      const data = await response.json();

      if (!data.result?.items) {
        return [];
      }

      let credentials = data.result.items as DasAsset[];

      // Filter by collection if provided
      if (trackCollectionAddress) {
        credentials = credentials.filter((item) =>
          item.grouping?.some(
            (g) =>
              g.group_key === 'collection' &&
              g.group_value === trackCollectionAddress.toString()
          )
        );
      }

      credentials = credentials.filter((asset) => this.isCredentialAsset(asset));

      // Transform to Credential format
      return credentials.map((asset) => this.parseCredential(asset));
    } catch (error) {
      console.error('Error fetching credentials:', error);
      return [];
    }
  }

  /**
   * Get credential for a specific track
   */
  async getCredentialByTrack(
    walletAddress: PublicKey,
    trackId: string,
    trackCollectionAddress: PublicKey
  ): Promise<Credential | null> {
    const credentials = await this.getCredentials(walletAddress, trackCollectionAddress);
    return credentials.find((c) => c.trackId === trackId) || null;
  }

  /**
   * Get highest level credential in a track
   */
  async getHighestLevelCredential(
    walletAddress: PublicKey,
    trackId: string,
    trackCollectionAddress: PublicKey
  ): Promise<Credential | null> {
    const credentials = await this.getCredentials(walletAddress, trackCollectionAddress);
    const trackCredentials = credentials.filter((c) => c.trackId === trackId);

    if (trackCredentials.length === 0) return null;

    return trackCredentials.reduce((highest, current) =>
      current.level > highest.level ? current : highest
    );
  }

  /**
   * Parse DAS asset into Credential format
   */
  private parseCredential(asset: DasAsset): Credential {
    const attrs = asset.content?.metadata?.attributes || [];
    const attrMap = new Map(
      attrs.map((a) => [a.trait_type.toLowerCase(), String(a.value)])
    );
    const mintedAt = asset.created_at
      ? new Date(asset.created_at * 1000).toISOString()
      : new Date().toISOString();

    return {
      assetId: asset.id,
      name: asset.content?.metadata?.name || 'Unnamed Credential',
      trackId: this.readAttribute(attrMap, ['track_id', 'track', 'trackid']) || 'unknown',
      level: parseInt(this.readAttribute(attrMap, ['level']) || '0'),
      coursesCompleted: parseInt(
        this.readAttribute(attrMap, ['courses_completed', 'coursescompleted']) || '0'
      ),
      totalXp: parseInt(this.readAttribute(attrMap, ['total_xp', 'xp', 'totalxp']) || '0'),
      mintedAt,
    };
  }

  private readAttribute(map: Map<string, string>, keys: string[]): string | undefined {
    for (const key of keys) {
      const value = map.get(key.toLowerCase());
      if (value) return value;
    }
    return undefined;
  }

  private isCredentialAsset(asset: DasAsset): boolean {
    const attributes = asset.content?.metadata?.attributes || [];
    const keys = new Set(attributes.map((a) => a.trait_type.toLowerCase()));
    const name = asset.content?.metadata?.name?.toLowerCase() || '';
    const symbol = asset.content?.metadata?.symbol?.toLowerCase() || '';

    const hasCredentialAttributes =
      keys.has('track_id') ||
      keys.has('track') ||
      keys.has('level') ||
      keys.has('courses_completed') ||
      keys.has('total_xp');

    if (hasCredentialAttributes) {
      return true;
    }

    return symbol.includes('cred') || name.includes('credential') || name.includes('certificate');
  }

  /**
   * Check if wallet has credential in track
   */
  async hasCredential(
    walletAddress: PublicKey,
    trackCollectionAddress: PublicKey
  ): Promise<boolean> {
    const credentials = await this.getCredentials(walletAddress, trackCollectionAddress);
    return credentials.length > 0;
  }
}

/**
 * Factory function to create CredentialService
 */
export function createCredentialService(heliusRpcUrl?: string): CredentialService {
  const rpc =
    heliusRpcUrl ||
    process.env.NEXT_PUBLIC_HELIUS_RPC_URL ||
    process.env.HELIUS_RPC_URL ||
    (process.env.NEXT_PUBLIC_HELIUS_API_KEY
      ? `https://devnet.helius-rpc.com/?api-key=${process.env.NEXT_PUBLIC_HELIUS_API_KEY}`
      : '');
  return new CredentialService(rpc);
}
