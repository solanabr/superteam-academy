import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { getConnection } from "@/lib/solana/connection";
import { XP_MINT, TOKEN_2022_PROGRAM_ID, LeaderboardEntry } from "@/types/academy";
import { getRpcUrl } from "@/lib/solana/connection";

export async function getXpBalance(wallet: PublicKey): Promise<number> {
  try {
    const connection = getConnection();
    const ata = getAssociatedTokenAddressSync(
      XP_MINT,
      wallet,
      false,
      TOKEN_2022_PROGRAM_ID
    );
    const balance = await connection.getTokenAccountBalance(ata);
    return Number(balance.value.amount);
  } catch {
    // ATA doesn't exist yet = 0 XP
    return 0;
  }
}

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  // In production: use Helius DAS getTokenHolders for the XP mint
  // For demo: return mock leaderboard data
  const mockLeaderboard: LeaderboardEntry[] = [
    { wallet: "7xKX...8mPq", xpBalance: 15200, rank: 1, displayName: "solanista.sol" },
    { wallet: "3bFR...2kNx", xpBalance: 12800, rank: 2, displayName: "anchor_dev" },
    { wallet: "9pQM...5jVz", xpBalance: 11500, rank: 3, displayName: "defi_wizard" },
    { wallet: "2nRT...8hWm", xpBalance: 9800, rank: 4 },
    { wallet: "6kYL...4pBs", xpBalance: 8400, rank: 5, displayName: "nft_builder" },
    { wallet: "1mZX...7qFn", xpBalance: 7200, rank: 6 },
    { wallet: "8jDN...3rCw", xpBalance: 6100, rank: 7, displayName: "security_guru" },
    { wallet: "4tGH...9sPv", xpBalance: 5500, rank: 8 },
    { wallet: "5wBK...6mQr", xpBalance: 4800, rank: 9 },
    { wallet: "0cFL...1nTy", xpBalance: 3200, rank: 10 },
  ];
  return mockLeaderboard;
}

// Production implementation using Helius DAS
export async function fetchLeaderboardFromHelius(): Promise<LeaderboardEntry[]> {
  const rpcUrl = getRpcUrl();
  
  try {
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "leaderboard",
        method: "getTokenAccounts",
        params: {
          mint: XP_MINT.toBase58(),
          limit: 100,
          options: { showZeroBalance: false },
        },
      }),
    });

    const data = await response.json();
    if (!data.result?.token_accounts) return [];

    const entries: LeaderboardEntry[] = data.result.token_accounts
      .map((account: { owner: string; amount: string }, index: number) => ({
        wallet: account.owner,
        xpBalance: Number(account.amount),
        rank: index + 1,
      }))
      .sort((a: LeaderboardEntry, b: LeaderboardEntry) => b.xpBalance - a.xpBalance)
      .map((entry: LeaderboardEntry, index: number) => ({ ...entry, rank: index + 1 }));

    return entries;
  } catch (error) {
    console.error("Failed to fetch leaderboard from Helius:", error);
    return [];
  }
}
