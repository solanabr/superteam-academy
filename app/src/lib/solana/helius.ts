import { HELIUS_API_KEY, SOLANA_RPC_URL, SOLANA_NETWORK } from "./constants";
import logger from "@/lib/logger";

export interface HeliusAsset {
  id: string;
  content: {
    metadata: {
      name: string;
      attributes?: { trait_type: string; value: string }[];
    };
    json_uri: string;
    links?: {
      image?: string;
      [key: string]: string | undefined;
    };
  };
  grouping: { group_key: string; group_value: string }[];
  ownership: { owner: string };
}

export interface TokenHolder {
  owner: string;
  amount: number;
}

export function getHeliusRpcUrl(): string {
  if (HELIUS_API_KEY) {
    const subdomain = SOLANA_NETWORK === "mainnet-beta" ? "mainnet" : "devnet";
    return `https://${subdomain}.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
  }
  logger.warn("[helius] HELIUS_API_KEY not set — falling back to SOLANA_RPC_URL. DAS methods (getAssetsByOwner, getTokenAccounts) may not work.");
  return SOLANA_RPC_URL;
}

export async function getCredentialsByOwner(ownerAddress: string): Promise<HeliusAsset[]> {
  const response = await fetch(getHeliusRpcUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "credentials",
      method: "getAssetsByOwner",
      params: {
        ownerAddress,
        page: 1,
        limit: 100,
        displayOptions: { showCollectionMetadata: true },
      },
    }),
  });
  if (!response.ok) return [];
  const data = await response.json() as { result?: { items?: HeliusAsset[] }; error?: unknown };
  if (data.error) return [];
  return data.result?.items ?? [];
}

export async function getXpLeaderboard(xpMintAddress: string, limit = 100): Promise<TokenHolder[]> {
  const response = await fetch(getHeliusRpcUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "leaderboard",
      method: "getTokenAccounts",
      params: {
        mint: xpMintAddress,
        limit,
        page: 1,
      },
    }),
  });
  if (!response.ok) return [];
  const data = await response.json() as { result?: { token_accounts?: Array<{ owner: string; amount: string }> }; error?: unknown };
  if (data.error) return [];
  const accounts = data.result?.token_accounts ?? [];
  return accounts
    .map((a: { owner: string; amount: string }) => ({
      owner: a.owner,
      amount: Number(a.amount),
    }))
    .sort((a: TokenHolder, b: TokenHolder) => b.amount - a.amount);
}
