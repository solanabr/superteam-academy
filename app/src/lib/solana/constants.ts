import { clusterApiUrl, PublicKey } from "@solana/web3.js";

export const SOLANA_NETWORK = "devnet";
export const SOLANA_RPC_URL = clusterApiUrl(SOLANA_NETWORK);

export const ACADEMY_PROGRAM_ID = new PublicKey(
  "ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf",
);

export const XP_MINT = new PublicKey(
  "xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3",
);

export const ACADEMY_AUTHORITY = new PublicKey(
  "ACAd3USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn",
);

export const XP_PER_LESSON = 100;

export const levelFromXp = (totalXp: number): number => {
  return Math.floor(Math.sqrt(totalXp / 100));
};
