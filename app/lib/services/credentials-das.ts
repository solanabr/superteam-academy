import type { CredentialInfo } from "./learning-progress";

const HELIUS_RPC = process.env.NEXT_PUBLIC_HELIUS_RPC ?? "";
const TRACK_COLLECTIONS_ENV = (process.env.NEXT_PUBLIC_CREDENTIAL_TRACK_COLLECTIONS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

let collectionsCache: string[] | null = null;

/** Returns track collection addresses: from env if set, otherwise from /api/credential-collections. */
async function getTrackCollectionAddresses(): Promise<string[]> {
  if (TRACK_COLLECTIONS_ENV.length > 0) return TRACK_COLLECTIONS_ENV;
  if (collectionsCache) return collectionsCache;
  try {
    const r = await fetch("/api/credential-collections", { cache: "no-store" });
    const d = (await r.json()) as { collections?: Record<string, string> };
    const addrs = d.collections ? Object.values(d.collections).filter(Boolean) : [];
    collectionsCache = addrs;
    return addrs;
  } catch {
    return [];
  }
}

export function isCredentialsConfigAvailable(): boolean {
  return !!HELIUS_RPC;
}

/** DAS API asset item (minimal shape we need) */
interface DasAsset {
  id: string;
  uri?: string;
  grouping?: Array<{ group_key: string; group_value: string }>;
  content?: {
    metadata?: {
      name?: string;
      uri?: string;
      attributes?: Array<{ key: string; value: string }> | Record<string, string>;
    };
    json_uri?: string;
    links?: { image?: string };
  };
}

function getMetadataUri(asset: DasAsset): string | undefined {
  return (
    asset.content?.metadata?.uri ??
    asset.content?.json_uri ??
    asset.uri
  );
}

interface GetAssetsByOwnerResponse {
  result?: { items?: DasAsset[]; total?: number };
  error?: { message?: string };
}

function parseAttributes(
  attrs: Array<{ key: string; value: string }> | Record<string, string> | undefined
): Record<string, string> {
  if (!attrs) return {};
  if (Array.isArray(attrs)) {
    return Object.fromEntries(attrs.map((a) => [a.key, a.value]));
  }
  return attrs as Record<string, string>;
}

function assetToCredentialInfo(asset: DasAsset): CredentialInfo {
  const attrs = parseAttributes(asset.content?.metadata?.attributes);
  const uri = getMetadataUri(asset);
  const imageUrl = asset.content?.links?.image ?? null;
  const name = asset.content?.metadata?.name ?? null;
  return {
    asset: asset.id,
    trackId: parseInt(attrs.track_id ?? "0", 10),
    level: parseInt(attrs.level ?? "0", 10),
    coursesCompleted: parseInt(attrs.courses_completed ?? "0", 10),
    totalXp: parseInt(attrs.total_xp ?? "0", 10),
    imageUrl: imageUrl ?? undefined,
    name: name ?? undefined,
    metadataUri: uri ?? undefined,
  };
}

/**
 * Fetch credentials (Metaplex Core NFTs in track collections) for a wallet via Helius DAS getAssetsByOwner.
 * Uses NEXT_PUBLIC_CREDENTIAL_TRACK_COLLECTIONS if set; otherwise fetches from /api/credential-collections.
 */
export async function getCredentialsByOwner(walletAddress: string): Promise<CredentialInfo[]> {
  if (!HELIUS_RPC) return [];
  const trackCollections = await getTrackCollectionAddresses();
  if (trackCollections.length === 0) return [];

  const response = await fetch(HELIUS_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "1",
      method: "getAssetsByOwner",
      params: {
        ownerAddress: walletAddress,
        page: 1,
        limit: 100,
      },
    }),
  });

  const data = (await response.json()) as GetAssetsByOwnerResponse;
  if (data.error || !data.result?.items) return [];

  const credentials = data.result.items.filter((item) =>
    item.grouping?.some(
      (g) => g.group_key === "collection" && trackCollections.includes(g.group_value)
    )
  );

  return credentials.map(assetToCredentialInfo);
}

/**
 * Fetch a single asset by ID for certificate detail (Helius getAsset).
 */
export async function getAssetById(assetId: string): Promise<DasAsset | null> {
  if (!HELIUS_RPC) return null;

  const response = await fetch(HELIUS_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "1",
      method: "getAsset",
      params: { id: assetId },
    }),
  });

  const data = (await response.json()) as { result?: DasAsset; error?: { message?: string } };
  if (data.error || !data.result) return null;
  return data.result;
}
