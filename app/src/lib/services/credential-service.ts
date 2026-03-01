import { SOLANA_RPC_URL } from "@/lib/solana/constants";
import type { Credential } from "@/types";

export interface CredentialService {
  getCredentialsByWallet(walletAddress: string): Promise<Credential[]>;
}

async function fetchHeliusAssets(wallet: string): Promise<Credential[]> {
  const res = await fetch(SOLANA_RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "cred-query",
      method: "getAssetsByOwner",
      params: { ownerAddress: wallet, page: 1, limit: 50 },
    }),
  });

  if (!res.ok) return [];

  const data = await res.json();
  const items = data?.result?.items;
  if (!Array.isArray(items)) return [];

  return items
    .filter(
      (item: Record<string, unknown>) =>
        (item as { interface?: string }).interface === "MplCoreAsset",
    )
    .map((item: Record<string, unknown>) => {
      const content = item.content as
        | { metadata?: { name?: string }; json_uri?: string }
        | undefined;
      const attrs = (
        content?.metadata as { attributes?: Array<{ trait_type: string; value: string }> } | undefined
      )?.attributes;
      const coursesCompleted = attrs?.find(
        (a: { trait_type: string }) => a.trait_type === "courses_completed",
      )?.value;

      return {
        id: item.id as string,
        courseId: coursesCompleted ?? "unknown",
        title: content?.metadata?.name ?? "Academy Credential",
        issuedAt: new Date().toISOString(),
        issuer: "Superteam Academy",
        imageUri: content?.json_uri ?? "",
        txSignature: item.id as string,
      } satisfies Credential;
    });
}

class OnChainCredentialService implements CredentialService {
  async getCredentialsByWallet(walletAddress: string): Promise<Credential[]> {
    try {
      return await fetchHeliusAssets(walletAddress);
    } catch {
      return [];
    }
  }
}

export const credentialService: CredentialService =
  new OnChainCredentialService();
