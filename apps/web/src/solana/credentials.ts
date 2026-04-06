import { HELIUS_RPC_URL } from "./program";

export interface CredentialNFT {
    assetId: string;
    name: string;
    imageUri: string;
    collectionAddress: string;
    attributes: {
        trackId?: number;
        level?: number;
        coursesCompleted?: number;
        totalXp?: number;
    };
    explorerUrl: string;
}

interface DASAsset {
    id: string;
    content?: {
        metadata?: {
            name?: string;
            attributes?: Array<{ trait_type: string; value: string | number }>;
        };
        links?: {
            image?: string;
        };
        json_uri?: string;
    };
    grouping?: Array<{
        group_key: string;
        group_value: string;
    }>;
}

/**
 * Fetches all Metaplex Core NFTs owned by a wallet via Helius DAS API.
 * Filters by track collections to return only academy credentials.
 */
export async function getCredentialsByOwner(
    walletAddress: string,
    trackCollections?: string[]
): Promise<CredentialNFT[]> {
    try {
        const response = await fetch(HELIUS_RPC_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                jsonrpc: "2.0",
                id: "credentials-query",
                method: "getAssetsByOwner",
                params: {
                    ownerAddress: walletAddress,
                    page: 1,
                    limit: 100,
                    displayOptions: {
                        showCollectionMetadata: true,
                    },
                },
            }),
        });

        if (!response.ok) return [];

        const data = await response.json();
        const items: DASAsset[] = data.result?.items ?? [];

        let filtered = items;
        if (trackCollections && trackCollections.length > 0) {
            const collectionSet = new Set(trackCollections);
            filtered = items.filter((item) =>
                item.grouping?.some(
                    (g) =>
                        g.group_key === "collection" && collectionSet.has(g.group_value)
                )
            );
        }

        return filtered.map((asset) => {
            const attrs = asset.content?.metadata?.attributes ?? [];
            const attrMap: Record<string, string | number> = {};
            for (const a of attrs) {
                attrMap[a.trait_type] = a.value;
            }

            return {
                assetId: asset.id,
                name: asset.content?.metadata?.name ?? "Credential",
                imageUri: asset.content?.links?.image ?? "",
                collectionAddress:
                    asset.grouping?.find((g) => g.group_key === "collection")
                        ?.group_value ?? "",
                attributes: {
                    trackId: attrMap["track_id"]
                        ? Number(attrMap["track_id"])
                        : undefined,
                    level: attrMap["level"] ? Number(attrMap["level"]) : undefined,
                    coursesCompleted: attrMap["courses_completed"]
                        ? Number(attrMap["courses_completed"])
                        : undefined,
                    totalXp: attrMap["total_xp"]
                        ? Number(attrMap["total_xp"])
                        : undefined,
                },
                explorerUrl: `https://explorer.solana.com/address/${asset.id}?cluster=devnet`,
            };
        });
    } catch {
        console.warn("Failed to fetch credentials via DAS API");
        return [];
    }
}
