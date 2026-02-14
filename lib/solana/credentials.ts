import { getSolanaEndpoint } from "@/lib/solana/wallet";

export type CredentialAsset = {
  id: string;
  name: string;
  image?: string;
  explorerUrl: string;
};

type DasAssetResponse = {
  items: Array<{
    id: string;
    content?: {
      metadata?: {
        name?: string;
      };
      links?: {
        image?: string;
      };
    };
  }>;
};

export async function getCredentialsByOwner(walletAddress: string): Promise<CredentialAsset[]> {
  const endpoint = process.env.NEXT_PUBLIC_DAS_RPC_URL ?? getSolanaEndpoint();
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "superteam-academy",
      method: "getAssetsByOwner",
      params: {
        ownerAddress: walletAddress,
        page: 1,
        limit: 20
      }
    })
  });

  if (!response.ok) {
    return [];
  }

  const json = (await response.json()) as { result?: DasAssetResponse };
  const assets = json.result?.items ?? [];

  return assets.map((asset) => ({
    id: asset.id,
    name: asset.content?.metadata?.name ?? "Credential",
    image: asset.content?.links?.image,
    explorerUrl: `https://explorer.solana.com/address/${encodeURIComponent(asset.id)}?cluster=devnet`
  }));
}
