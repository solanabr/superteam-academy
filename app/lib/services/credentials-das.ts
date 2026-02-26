import type { CredentialInfo } from "./learning-progress";

const HELIUS_RPC = process.env.NEXT_PUBLIC_HELIUS_RPC ?? "";
const TRACK_COLLECTIONS = (process.env.NEXT_PUBLIC_CREDENTIAL_TRACK_COLLECTIONS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export function isCredentialsConfigAvailable(): boolean {
  return !!HELIUS_RPC && TRACK_COLLECTIONS.length > 0;
}

/** DAS API asset item (minimal shape we need) */
interface DasAsset {
  id: string;
  grouping?: Array<{ group_key: string; group_value: string }>;
  content?: {
    metadata?: {
      name?: string;
      uri?: string;
      attributes?: Array<{ key: string; value: string }> | Record<string, string>;
    };
    links?: { image?: string };
  };
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
  return {
    asset: asset.id,
    trackId: parseInt(attrs.track_id ?? "0", 10),
    level: parseInt(attrs.level ?? "0", 10),
    coursesCompleted: parseInt(attrs.courses_completed ?? "0", 10),
    totalXp: parseInt(attrs.total_xp ?? "0", 10),
  };
}

/**
 * Fetch credentials (Metaplex Core NFTs in track collections) for a wallet via Helius DAS getAssetsByOwner.
 */
export async function getCredentialsByOwner(walletAddress: string): Promise<CredentialInfo[]> {
  if (!HELIUS_RPC || TRACK_COLLECTIONS.length === 0) return [];

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
      (g) => g.group_key === "collection" && TRACK_COLLECTIONS.includes(g.group_value)
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
