/**
 * On-chain credential and XP token queries via the Helius Digital Asset Standard (DAS) API.
 * Credentials are evolving compressed NFTs (Metaplex Bubblegum) — one per learning track
 * that upgrades as the learner progresses through courses in that track.
 */

import type { Credential } from "@/types";
import { HELIUS_RPC_URL } from "./constants";
import { prisma } from "@/lib/db";

async function getDbCredentials(walletAddress: string): Promise<Credential[]> {
  const user = await prisma.user.findUnique({
    where: { wallet: walletAddress },
    select: { id: true },
  });
  if (!user) return [];

  const creds = await prisma.userCredential.findMany({
    where: { userId: user.id },
  });

  return creds.map((c) => ({
    trackId: c.trackId,
    trackName: c.trackName,
    currentLevel: c.currentLevel,
    coursesCompleted: c.coursesCompleted,
    totalXpEarned: c.totalXpEarned,
    firstEarned: c.firstEarned.toISOString(),
    lastUpdated: c.lastUpdated.toISOString(),
    metadataUri: c.metadataUri ?? undefined,
    badgeImage: c.badgeImage ?? undefined,
  }));
}

/** Raw asset shape returned by the Helius DAS `getAssetsByOwner` endpoint. */
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
  grouping?: Array<{ group_key: string; group_value: string }>;
  ownership?: { owner: string };
}

/** Paginated response from Helius DAS RPC methods. */
interface DASResponse {
  result?: {
    items?: DASAsset[];
    total?: number;
  };
}

/**
 * Fetch all Superteam Academy credentials (evolving cNFTs) owned by a wallet.
 * Uses the Helius DAS `getAssetsByOwner` method to retrieve compressed NFTs,
 * then filters for assets with a `track_id` attribute (academy credentials).
 *
 * @param walletAddress - Solana wallet public key (base58)
 * @returns Array of parsed credentials with track, level, and XP data.
 *          Returns empty array if Helius DAS API is not configured.
 */
export async function getOnChainCredentials(
  walletAddress: string
): Promise<Credential[]> {
  const rpcUrl = HELIUS_RPC_URL;
  if (!rpcUrl || rpcUrl === "https://api.devnet.solana.com") {
    return getDbCredentials(walletAddress);
  }

  try {
    const response = await fetch(rpcUrl, {
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
        },
      }),
    });

    const data: DASResponse = await response.json();
    if (!data.result?.items) return [];

    const credentials: Credential[] = [];

    for (const asset of data.result.items) {
      const attrs = asset.content?.metadata?.attributes;
      if (!attrs) continue;

      const trackIdAttr = attrs.find(
        (a) => a.trait_type === "track_id"
      );
      if (!trackIdAttr) continue; // Not an academy credential

      const trackId = parseInt(trackIdAttr.value, 10);
      const level = parseInt(
        attrs.find((a) => a.trait_type === "level")?.value || "1",
        10
      );
      const coursesCompleted = parseInt(
        attrs.find((a) => a.trait_type === "courses_completed")?.value || "1",
        10
      );
      const totalXp = parseInt(
        attrs.find((a) => a.trait_type === "total_xp")?.value || "0",
        10
      );

      const trackNames: Record<number, string> = {
        0: "Standalone",
        1: "Anchor Framework",
        2: "Rust for Solana",
        3: "DeFi Development",
        4: "Program Security",
        5: "Frontend & dApps",
        6: "Token Engineering",
      };

      credentials.push({
        trackId,
        trackName: trackNames[trackId] || `Track ${trackId}`,
        currentLevel: level,
        coursesCompleted,
        totalXpEarned: totalXp,
        firstEarned: new Date().toISOString(), // DAS doesn't provide this directly
        lastUpdated: new Date().toISOString(),
        metadataUri: asset.content?.json_uri,
        badgeImage: asset.content?.links?.image,
      });
    }

    return credentials;
  } catch {
    return [];
  }
}

/**
 * Fetch all XP soulbound token holders for the leaderboard.
 * Uses the Helius DAS `getTokenAccounts` method to retrieve Token-2022
 * balances, sorted by balance descending.
 *
 * @param xpMint - Base58 address of the XP token mint (Token-2022, NonTransferable)
 * @returns Sorted array of holders with owner wallet and XP balance.
 *          Returns empty array if Helius DAS API is not configured.
 */
export async function getXpTokenHolders(
  xpMint: string
): Promise<Array<{ owner: string; balance: number }>> {
  const rpcUrl = HELIUS_RPC_URL;
  if (!rpcUrl || rpcUrl === "https://api.devnet.solana.com") {
    return [];
  }

  try {
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "get-xp-holders",
        method: "getTokenAccounts",
        params: { mint: xpMint, page: 1, limit: 1000 },
      }),
    });

    const data = await response.json();
    if (!data.result?.token_accounts) return [];

    return data.result.token_accounts
      .map(
        (account: { owner: string; amount: string | number }) => ({
          owner: account.owner,
          balance: Number(account.amount),
        })
      )
      .filter((h: { balance: number }) => h.balance > 0)
      .sort(
        (a: { balance: number }, b: { balance: number }) =>
          b.balance - a.balance
      );
  } catch {
    return [];
  }
}
