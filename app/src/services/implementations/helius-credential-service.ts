import type { CredentialService } from "../credential-service";
import type { Credential } from "@/types";

const HELIUS_RPC =
  process.env.NEXT_PUBLIC_HELIUS_RPC ??
  "https://devnet.helius-rpc.com/?api-key=44daf6b7-435a-4124-95e4-f5eaa32ff810";

const COLLECTION =
  process.env.NEXT_PUBLIC_CREDENTIAL_COLLECTION ?? "";

interface DASAsset {
  id: string;
  content?: {
    metadata?: {
      name?: string;
      attributes?: Array<{ trait_type: string; value: string }>;
    };
    json_uri?: string;
    links?: { image?: string };
  };
  grouping?: { group_key: string; group_value: string }[];
  ownership?: { owner?: string };
  creators?: { address: string }[];
}

function assetToCredential(asset: DASAsset): Credential {
  const attrs = Object.fromEntries(
    (asset.content?.metadata?.attributes ?? []).map((a) => [a.trait_type, a.value]),
  );
  return {
    mintAddress: asset.id,
    name: asset.content?.metadata?.name ?? "Credential",
    metadataUri: asset.content?.json_uri ?? "",
    imageUrl: asset.content?.links?.image ?? "",
    trackId: parseInt(attrs["track"] ?? "0"),
    trackLevel: parseInt(attrs["level"] ?? "0"),
    coursesCompleted: parseInt(attrs["courses_completed"] ?? "0"),
    totalXp: parseInt(attrs["total_xp"] ?? "0"),
    owner: asset.ownership?.owner ?? "",
    collection: asset.grouping?.[0]?.group_value ?? COLLECTION,
  };
}

async function dasRpc(method: string, params: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(HELIUS_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "credential-service",
      method,
      params,
    }),
  });
  const json = await res.json();
  return json.result;
}

export const heliusCredentialService: CredentialService = {
  async getCredentials(walletAddress) {
    const result = (await dasRpc("getAssetsByOwner", {
      ownerAddress: walletAddress,
      page: 1,
      limit: 100,
    })) as { items?: DASAsset[] } | null;

    if (!result?.items) return [];

    return result.items
      .filter(
        (a) =>
          COLLECTION &&
          a.grouping?.some(
            (g) => g.group_key === "collection" && g.group_value === COLLECTION,
          ),
      )
      .map(assetToCredential);
  },

  async getCredentialByMint(mintAddress) {
    const result = (await dasRpc("getAsset", {
      id: mintAddress,
    })) as DASAsset | null;

    if (!result) return null;
    return assetToCredential(result);
  },

  async getCredentialsByUserId(_userId) {
    // Requires wallet_address lookup — use getCredentials with wallet instead
    return [];
  },

  async hasCredential(walletAddress, _courseId) {
    const creds = await this.getCredentials(walletAddress);
    return creds.length > 0;
  },
};
