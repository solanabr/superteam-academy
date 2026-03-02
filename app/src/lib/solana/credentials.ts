import type { CredentialData } from "@/lib/services/types";

const HELIUS_RPC_URL =
  process.env.NEXT_PUBLIC_HELIUS_RPC_URL || "https://devnet.helius-rpc.com";

interface HeliusAsset {
  id: string;
  content?: {
    metadata?: {
      name?: string;
      attributes?: Array<{ trait_type: string; value: string | number }>;
    };
    links?: { image?: string };
    json_uri?: string;
  };
  grouping?: Array<{ group_key: string; group_value: string }>;
}

export async function fetchCredentialsByOwner(
  ownerAddress: string,
  collectionAddress?: string
): Promise<CredentialData[]> {
  const response = await fetch(HELIUS_RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "credentials",
      method: "getAssetsByOwner",
      params: { ownerAddress, page: 1, limit: 100 },
    }),
  });

  const data = await response.json();
  if (!data.result?.items) return [];

  let assets: HeliusAsset[] = data.result.items;

  if (collectionAddress) {
    assets = assets.filter((item: HeliusAsset) =>
      item.grouping?.some(
        (g) => g.group_key === "collection" && g.group_value === collectionAddress
      )
    );
  }

  return assets.map((asset: HeliusAsset) => {
    const attrs = asset.content?.metadata?.attributes || [];
    const getAttr = (key: string) =>
      attrs.find((a) => a.trait_type === key)?.value;

    return {
      address: asset.id,
      name: asset.content?.metadata?.name || "Unknown Credential",
      uri: asset.content?.json_uri || "",
      image: asset.content?.links?.image || "",
      trackId: Number(getAttr("track_id")) || 0,
      level: Number(getAttr("level")) || 0,
      coursesCompleted: Number(getAttr("courses_completed")) || 0,
      totalXp: Number(getAttr("total_xp")) || 0,
    };
  });
}

export async function fetchCredentialByAddress(
  address: string
): Promise<CredentialData | null> {
  const response = await fetch(HELIUS_RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "credential",
      method: "getAsset",
      params: { id: address },
    }),
  });

  const data = await response.json();
  if (!data.result) return null;

  const asset = data.result as HeliusAsset;
  const attrs = asset.content?.metadata?.attributes || [];
  const getAttr = (key: string) =>
    attrs.find((a) => a.trait_type === key)?.value;

  return {
    address: asset.id,
    name: asset.content?.metadata?.name || "Unknown Credential",
    uri: asset.content?.json_uri || "",
    image: asset.content?.links?.image || "",
    trackId: Number(getAttr("track_id")) || 0,
    level: Number(getAttr("level")) || 0,
    coursesCompleted: Number(getAttr("courses_completed")) || 0,
    totalXp: Number(getAttr("total_xp")) || 0,
  };
}
