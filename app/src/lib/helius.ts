const HELIUS_API_KEY = process.env.NEXT_PUBLIC_HELIUS_API_KEY ?? "demo";
const HELIUS_RPC = `https://devnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

export interface CredentialNFT {
    id: string;
    name: string;
    uri: string;
    image?: string;
    attributes: {
        track_id?: string;
        level?: string;
        courses_completed?: string;
        total_xp?: string;
    };
    collectionAddress?: string;
}

export async function getCredentialsByOwner(
    ownerAddress: string,
    trackCollectionAddress?: string
): Promise<CredentialNFT[]> {
    try {
        const response = await fetch(HELIUS_RPC, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                jsonrpc: "2.0",
                id: "1",
                method: "getAssetsByOwner",
                params: { ownerAddress, page: 1, limit: 100 },
            }),
        });

        const data = await response.json();
        if (!data.result?.items) return [];

        let items = data.result.items;

        // Filter by track collection if specified
        if (trackCollectionAddress) {
            items = items.filter((item: HeliusAsset) =>
                item.grouping?.find(
                    (g) =>
                        g.group_key === "collection" &&
                        g.group_value === trackCollectionAddress
                )
            );
        }

        return items.map((item: HeliusAsset): CredentialNFT => {
            const attrs: Record<string, string> = {};
            for (const attr of item.content?.metadata?.attributes ?? []) {
                attrs[attr.trait_type] = attr.value;
            }
            return {
                id: item.id,
                name: item.content?.metadata?.name ?? "Credential",
                uri: item.content?.json_uri ?? "",
                image: item.content?.links?.image,
                attributes: attrs,
                collectionAddress: item.grouping?.find((g) => g.group_key === "collection")
                    ?.group_value,
            };
        });
    } catch {
        return [];
    }
}

interface HeliusAsset {
    id: string;
    grouping?: { group_key: string; group_value: string }[];
    content?: {
        json_uri?: string;
        links?: { image?: string };
        metadata?: {
            name?: string;
            attributes?: { trait_type: string; value: string }[];
        };
    };
}
