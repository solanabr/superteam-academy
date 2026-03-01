import { clusterApiUrl, PublicKey } from "@solana/web3.js";

export const SOLANA_NETWORK = "devnet";
export const SOLANA_RPC_URL =
  process.env.NEXT_PUBLIC_HELIUS_RPC_URL ?? clusterApiUrl(SOLANA_NETWORK);

export const ACADEMY_PROGRAM_ID = new PublicKey(
  "5bzKJ9GdnR6FmnF4Udcza64Hgdiz5vtsX35szuKzXp7c",
);

export const XP_MINT = new PublicKey(
  "54krq8wnx2LvLsChiUccfsatLmusCXymhR2Qq2dcZ8NC",
);

export const ACADEMY_AUTHORITY = new PublicKey(
  "BtLBuhbS5TrvLLLwwRRLHdbXnxkCKHaDEq7v9T2ok4n4",
);

export const XP_PER_LESSON = 100;
export const XP_DECIMALS = 6;

export const levelFromXp = (totalXp: number): number => {
  return Math.floor(Math.sqrt(totalXp / 100));
};
