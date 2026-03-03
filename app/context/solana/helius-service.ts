/**
 * Helius DAS (Digital Asset Standard) API integration.
 *
 * Provides access to:
 * - Credential NFTs (Metaplex Core assets) owned by a wallet
 * - XP token holder rankings (leaderboard)
 * - Achievement NFTs filtered by collection
 *
 * Uses the Helius Enhanced API for indexed asset queries,
 * which is significantly faster than raw RPC getAccountInfo.
 */

const HELIUS_RPC_URL = process.env.NEXT_PUBLIC_HELIUS_RPC_URL
    || process.env.HELIUS_RPC_URL
    || 'https://devnet.helius-rpc.com/?api-key=YOUR_KEY';

import { withRetry, isTransientError } from '@/backend/retry';
import { RpcError } from '@/backend/errors';

// ─── Types ───────────────────────────────────────────────────────────

export interface DasAsset {
    id: string;
    content: {
        json_uri: string;
        metadata: {
            name: string;
            symbol: string;
            description?: string;
            attributes?: Array<{
                trait_type: string;
                value: string | number;
            }>;
        };
    };
    grouping: Array<{
        group_key: string;
        group_value: string;
    }>;
    ownership: {
        owner: string;
        frozen: boolean;
    };
    authorities: Array<{
        address: string;
        scopes: string[];
    }>;
}

export interface CredentialInfo {
    assetId: string;
    name: string;
    metadataUri: string;
    collection: string | null;
    owner: string;
    attributes: {
        trackId?: number;
        level?: number;
        coursesCompleted?: number;
        totalXp?: number;
    };
}

export interface TokenHolder {
    owner: string;
    amount: number;
}

// ─── Core DAS API Calls ──────────────────────────────────────────────

/**
 * Make a Helius DAS JSON-RPC call.
 */
async function dasRpc<T>(method: string, params: Record<string, unknown>): Promise<T> {
    return withRetry(
        async () => {
            const response = await fetch(HELIUS_RPC_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: '1',
                    method,
                    params,
                }),
            });

            if (!response.ok) {
                throw new RpcError(`Helius DAS API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            if (data.error) {
                throw new RpcError(`Helius DAS RPC error: ${JSON.stringify(data.error)}`);
            }

            return data.result;
        },
        { maxRetries: 3, shouldRetry: isTransientError }
    );
}

// ─── Asset Queries ───────────────────────────────────────────────────

/**
 * Get all assets owned by a wallet (for credential display).
 *
 * Returns all Metaplex Core assets — filter by collection
 * to get only credentials for a specific track.
 */
export async function getAssetsByOwner(
    ownerAddress: string,
    page = 1,
    limit = 100
): Promise<{ items: DasAsset[]; total: number }> {
    return dasRpc('getAssetsByOwner', {
        ownerAddress,
        page,
        limit,
        displayOptions: {
            showUnverifiedCollections: false,
            showCollectionMetadata: true,
        },
    });
}

/**
 * Get all assets in a collection (e.g., all credentials for a track).
 */
export async function getAssetsByGroup(
    collectionAddress: string,
    page = 1,
    limit = 100
): Promise<{ items: DasAsset[]; total: number }> {
    return dasRpc('getAssetsByGroup', {
        groupKey: 'collection',
        groupValue: collectionAddress,
        page,
        limit,
    });
}

/**
 * Get a specific asset by its ID.
 */
export async function getAsset(assetId: string): Promise<DasAsset> {
    return dasRpc('getAsset', { id: assetId });
}

// ─── Credential Helpers ──────────────────────────────────────────────

/**
 * Parse a DAS asset into a CredentialInfo object.
 */
function parseCredential(asset: DasAsset): CredentialInfo {
    const attrs = asset.content?.metadata?.attributes ?? [];
    const collection = asset.grouping?.find(g => g.group_key === 'collection');

    return {
        assetId: asset.id,
        name: asset.content?.metadata?.name ?? 'Unknown Credential',
        metadataUri: asset.content?.json_uri ?? '',
        collection: collection?.group_value ?? null,
        owner: asset.ownership?.owner ?? '',
        attributes: {
            trackId: attrValue(attrs, 'track_id') as number | undefined,
            level: attrValue(attrs, 'level') as number | undefined,
            coursesCompleted: attrValue(attrs, 'courses_completed') as number | undefined,
            totalXp: attrValue(attrs, 'total_xp') as number | undefined,
        },
    };
}

function attrValue(
    attrs: Array<{ trait_type: string; value: string | number }>,
    key: string
): string | number | undefined {
    const attr = attrs.find(a => a.trait_type === key);
    return attr?.value;
}

/**
 * Get all credentials owned by a wallet.
 *
 * @param ownerAddress - The wallet public key (base58)
 * @param trackCollections - Optional: filter by track collection addresses
 */
export async function getCredentials(
    ownerAddress: string,
    trackCollections?: string[]
): Promise<CredentialInfo[]> {
    const { items } = await getAssetsByOwner(ownerAddress);

    let credentials = items.map(parseCredential);

    // Filter by track collections if provided
    if (trackCollections && trackCollections.length > 0) {
        credentials = credentials.filter(
            c => c.collection && trackCollections.includes(c.collection)
        );
    }

    return credentials;
}

/**
 * Get XP token holders (for leaderboard).
 *
 * Uses the Helius getTokenAccounts method to find all holders
 * of the XP SPL Token-2022 mint.
 */
export async function getXpTokenHolders(
    xpMintAddress: string,
    limit = 100
): Promise<TokenHolder[]> {
    const result = await dasRpc<{
        token_accounts: Array<{ owner: string; amount: number }>;
    }>('getTokenAccounts', {
        mint: xpMintAddress,
        limit,
    });

    return (result.token_accounts ?? [])
        .map(ta => ({
            owner: ta.owner,
            amount: ta.amount,
        }))
        .sort((a, b) => b.amount - a.amount);
}
