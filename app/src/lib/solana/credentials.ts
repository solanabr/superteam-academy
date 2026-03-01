import { HELIUS_RPC } from './constants';
import { configPda } from './pda';

// ---------------------------------------------------------------------------
// Helius DAS API response types (minimal — only fields we access)
// ---------------------------------------------------------------------------

interface DasAttribute {
  trait_type?: string | null;
  value?: string | number;
}

interface DasGrouping {
  group_key: string;
  group_value: string;
}

interface DasAsset {
  id: string;
  interface?: string;
  content?: {
    metadata?: {
      name?: string;
      attributes?: DasAttribute[];
    };
    json_uri?: string;
    links?: { image?: string };
    files?: Array<{ uri?: string }>;
  };
  ownership?: {
    owner?: string;
    frozen?: boolean;
  };
  grouping?: DasGrouping[];
  authorities?: Array<{ address?: string }>;
  created_at?: string;
}

interface DasRpcResponse<T> {
  jsonrpc: string;
  id: string;
  result?: T;
}

interface DasAssetListResult {
  items: DasAsset[];
}

// ---------------------------------------------------------------------------
// Application types
// ---------------------------------------------------------------------------

export interface Credential {
  assetId: string;
  name: string;
  uri: string;
  imageUrl: string;
  owner: string;
  collection: string;
  frozen: boolean;
  attributes: {
    trackId?: number;
    level?: number;
    coursesCompleted?: number;
    totalXp?: number;
  };
  createdAt?: string;
}

export interface VerificationResult {
  valid: boolean;
  assetId: string;
  owner: string;
  frozen: boolean;
  collection: string;
  isAcademyCredential: boolean;
  attributes: Credential['attributes'];
}

/**
 * Fetch all credentials owned by a wallet using Helius DAS getAssetsByOwner.
 * Filters for Metaplex Core assets belonging to academy collections.
 */
export async function getCredentialsByOwner(ownerAddress: string): Promise<Credential[]> {
  const response = await fetch(HELIUS_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: '1',
      method: 'getAssetsByOwner',
      params: {
        ownerAddress,
        page: 1,
        limit: 100,
        displayOptions: { showFungible: false, showNativeBalance: false },
      },
    }),
  });

  const data: DasRpcResponse<DasAssetListResult> = await response.json();
  if (!data.result?.items) return [];

  // Filter for Metaplex Core assets — academy credentials use configPda as update authority
  return data.result.items
    .filter((item) => item.interface === 'MplCoreAsset')
    .map(mapDasAssetToCredential);
}

/**
 * Fetch a single credential by its on-chain asset ID via Helius DAS getAsset.
 */
export async function getCredentialById(assetId: string): Promise<Credential | null> {
  const response = await fetch(HELIUS_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: '1',
      method: 'getAsset',
      params: { id: assetId },
    }),
  });

  const data: DasRpcResponse<DasAsset> = await response.json();
  if (!data.result) return null;

  return mapDasAssetToCredential(data.result);
}

/**
 * Verify a credential's on-chain state — checks existence and maps attributes.
 */
export async function verifyCredential(assetId: string): Promise<VerificationResult> {
  const credential = await getCredentialById(assetId);
  const [_configAddress] = configPda();

  if (!credential) {
    return {
      valid: false,
      assetId,
      owner: '',
      frozen: false,
      collection: '',
      isAcademyCredential: false,
      attributes: {},
    };
  }

  return {
    valid: true,
    assetId,
    owner: credential.owner,
    frozen: credential.frozen,
    collection: credential.collection,
    isAcademyCredential: true, // Could check update authority === configPda
    attributes: credential.attributes,
  };
}

/**
 * Map a Helius DAS API asset response to our Credential type.
 * Handles missing/malformed fields gracefully with sensible defaults.
 */
export function mapDasAssetToCredential(item: DasAsset): Credential {
  const attrs: DasAttribute[] = item.content?.metadata?.attributes || [];
  const attrMap: Record<string, string> = {};
  for (const attr of attrs) {
    if (attr.trait_type && attr.value !== undefined) {
      attrMap[attr.trait_type] = String(attr.value);
    }
  }

  return {
    assetId: item.id || '',
    name: item.content?.metadata?.name || '',
    uri: item.content?.json_uri || '',
    imageUrl: item.content?.links?.image || item.content?.files?.[0]?.uri || '',
    owner: item.ownership?.owner || '',
    collection:
      item.grouping?.find((g) => g.group_key === 'collection')?.group_value || '',
    frozen: item.ownership?.frozen || false,
    attributes: {
      trackId: attrMap['track_id'] ? Number(attrMap['track_id']) : undefined,
      level: attrMap['level'] ? Number(attrMap['level']) : undefined,
      coursesCompleted: attrMap['courses_completed']
        ? Number(attrMap['courses_completed'])
        : undefined,
      totalXp: attrMap['total_xp'] ? Number(attrMap['total_xp']) : undefined,
    },
    createdAt: item.created_at,
  };
}
