import { HELIUS_RPC_URL } from "@/lib/solana";
import type { Credential, Achievement } from "@/types";

interface DasAsset {
  id: string;
  content?: {
    metadata?: {
      name?: string;
      image?: string;
      attributes?: Array<{ trait_type: string; value: string }>;
    };
    links?: { image?: string };
    json_uri?: string;
  };
  grouping?: Array<{ group_key: string; group_value: string }>;
  mutable?: boolean;
  burnt?: boolean;
  created_at?: string;
}

const TRACK_COLLECTIONS = (process.env.NEXT_PUBLIC_TRACK_COLLECTIONS ?? "")
  .split(",")
  .filter(Boolean);

const ACHIEVEMENT_COLLECTIONS = (process.env.NEXT_PUBLIC_ACHIEVEMENT_COLLECTIONS ?? "")
  .split(",")
  .filter(Boolean);

export async function getCredentials(walletAddress: string): Promise<Credential[]> {
  if (!HELIUS_RPC_URL || !walletAddress) return [];

  try {
    const res = await fetch(HELIUS_RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "get-credentials",
        method: "getAssetsByOwner",
        params: {
          ownerAddress: walletAddress,
          page: 1,
          limit: 100,
          displayOptions: { showCollectionMetadata: true },
        },
      }),
    });

    const data = await res.json() as { result?: { items?: DasAsset[] } };
    const items = data.result?.items ?? [];

    return items
      .filter((item) => {
        if (TRACK_COLLECTIONS.length === 0) {
          // If no collection filters configured, return all non-burnt Metaplex Core assets
          return !item.burnt;
        }
        return item.grouping?.some(
          (g) =>
            g.group_key === "collection" &&
            TRACK_COLLECTIONS.includes(g.group_value)
        );
      })
      .map((item): Credential => {
        const attrs: Record<string, string> = {};
        for (const attr of item.content?.metadata?.attributes ?? []) {
          attrs[attr.trait_type] = attr.value;
        }
        return {
          id: item.id,
          name: item.content?.metadata?.name ?? "Academy Credential",
          imageUrl: item.content?.links?.image ?? item.content?.metadata?.image,
          metadataUri: item.content?.json_uri,
          attributes: {
            trackId: attrs["track_id"],
            level: attrs["level"],
            coursesCompleted: attrs["courses_completed"],
            totalXp: attrs["total_xp"],
          },
          assetAddress: item.id,
          mintedAt: item.created_at,
        };
      });
  } catch {
    return [];
  }
}

export async function getAchievements(walletAddress: string): Promise<Achievement[]> {
  if (!HELIUS_RPC_URL || !walletAddress) return [];

  try {
    const res = await fetch(HELIUS_RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "get-achievements",
        method: "getAssetsByOwner",
        params: { ownerAddress: walletAddress, page: 1, limit: 100 },
      }),
    });

    const data = await res.json() as { result?: { items?: DasAsset[] } };
    const items = data.result?.items ?? [];

    return items
      .filter((item) => {
        if (ACHIEVEMENT_COLLECTIONS.length === 0) return false;
        return item.grouping?.some(
          (g) =>
            g.group_key === "collection" &&
            ACHIEVEMENT_COLLECTIONS.includes(g.group_value)
        );
      })
      .map((item): Achievement => {
        const attrs: Record<string, string> = {};
        for (const attr of item.content?.metadata?.attributes ?? []) {
          attrs[attr.trait_type] = attr.value;
        }
        return {
          id: item.id,
          achievementId: attrs["achievement_id"] ?? item.id,
          name: item.content?.metadata?.name ?? "Achievement",
          imageUrl: item.content?.links?.image ?? item.content?.metadata?.image,
          xpReward: Number(attrs["xp_reward"] ?? 0),
          awardedAt: item.created_at ?? new Date().toISOString(),
          assetAddress: item.id,
        };
      });
  } catch {
    return [];
  }
}
