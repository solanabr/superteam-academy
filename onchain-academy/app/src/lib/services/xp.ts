import { PublicKey } from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { connection } from "@/lib/solana/connection";
import { XP_MINT_ADDRESS } from "@/lib/constants";
import { calculateLevel, xpForLevel } from "@/lib/constants";

export async function getXPBalance(walletAddress: string): Promise<number> {
  if (!XP_MINT_ADDRESS || !walletAddress) return 0;

  try {
    const owner = new PublicKey(walletAddress);
    const { value } = await connection.getParsedTokenAccountsByOwner(
      owner,
      { programId: TOKEN_2022_PROGRAM_ID },
      "confirmed",
    );
    const xpMint = XP_MINT_ADDRESS;
    let total = 0;
    for (const entry of value) {
      const info = entry.account.data.parsed?.info;
      if (info?.mint === xpMint) {
        // Use uiAmount for consistency with leaderboard (which also uses uiAmount)
        total += Number(info.tokenAmount?.uiAmount ?? info.tokenAmount?.amount ?? 0);
      }
    }
    return total;
  } catch (error) {
    console.error("[xp] Failed to fetch XP balance:", error);
  }

  return 0;
}

export { calculateLevel, xpForLevel };

export function xpForNextLevel(currentLevel: number): number {
  return xpForLevel(currentLevel + 1);
}

export function progressToNextLevel(xp: number): {
  current: number;
  required: number;
  percentage: number;
} {
  const level = calculateLevel(xp);
  const currentLevelXp = xpForLevel(level);
  const nextLevelXp = xpForLevel(level + 1);
  const current = xp - currentLevelXp;
  const required = nextLevelXp - currentLevelXp;
  return {
    current,
    required,
    percentage: required > 0 ? (current / required) * 100 : 100,
  };
}
