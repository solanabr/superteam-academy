import { PublicKey } from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  getAccount,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { connection } from "@/lib/solana/connection";
import { XP_MINT_ADDRESS } from "@/lib/constants";
import { calculateLevel, xpForLevel } from "@/lib/constants";

export async function getXPBalance(walletAddress: string): Promise<number> {
  if (!XP_MINT_ADDRESS || !walletAddress) return 0;

  try {
    const mint = new PublicKey(XP_MINT_ADDRESS);
    const owner = new PublicKey(walletAddress);
    const ata = getAssociatedTokenAddressSync(
      mint,
      owner,
      false,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID,
    );
    const account = await getAccount(
      connection,
      ata,
      "confirmed",
      TOKEN_2022_PROGRAM_ID,
    );
    return Number(account.amount);
  } catch {
    // ATA doesn't exist or RPC error — user has 0 XP
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
