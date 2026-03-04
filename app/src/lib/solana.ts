import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";

export const devnetConnection = new Connection(
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? clusterApiUrl("devnet"),
  "confirmed",
);

export async function readXpTokenBalance(owner: string) {
  const mint = process.env.NEXT_PUBLIC_XP_TOKEN_MINT;
  if (!mint) return null;

  const ownerKey = new PublicKey(owner);
  const mintKey = new PublicKey(mint);

  const accounts = await devnetConnection.getParsedTokenAccountsByOwner(ownerKey, {
    mint: mintKey,
  });

  return accounts.value.reduce((total, account) => {
    const amount = Number(account.account.data.parsed.info.tokenAmount.uiAmount ?? 0);
    return total + amount;
  }, 0);
}

export async function readCnftCredentials(owner: string) {
  const payload = {
    jsonrpc: "2.0",
    id: "cnft-credentials",
    method: "getAssetsByOwner",
    params: {
      ownerAddress: owner,
      page: 1,
      limit: 10,
      sortBy: { sortBy: "created", sortDirection: "desc" },
    },
  };

  return {
    endpoint: process.env.NEXT_PUBLIC_DAS_API_URL ?? "https://example-das.devnet",
    payload,
    note: "DAS read is scaffolded; plug a real endpoint when available.",
  };
}

export type LeaderboardEntry = { wallet: string; xpBalance: number; rank: number };

export async function getDevnetLeaderboardStub(): Promise<LeaderboardEntry[]> {
  return [
    { wallet: "9xQeW...alpha", xpBalance: 6200, rank: 1 },
    { wallet: "4NnHg...beta", xpBalance: 5800, rank: 2 },
    { wallet: "8yRtV...gamma", xpBalance: 5400, rank: 3 },
  ];
}
