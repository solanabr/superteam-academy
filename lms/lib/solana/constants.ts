import { PublicKey } from "@solana/web3.js";

export const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID || "8M2cmZPb3grNi479qCDVwx3DjZMWCk8UEyH3H7x95Cxs"
);

export const RPC_ENDPOINT = process.env.NEXT_PUBLIC_RPC_ENDPOINT || "https://api.devnet.solana.com";

export const TRACKS: Record<number, { name: string; display: string; color: string }> = {
  0: { name: "standalone", display: "Standalone", color: "#71717a" },
  1: { name: "anchor", display: "Anchor Framework", color: "#9945FF" },
  2: { name: "rust", display: "Rust for Solana", color: "#FF6B35" },
  3: { name: "defi", display: "DeFi Development", color: "#14F195" },
  4: { name: "security", display: "Program Security", color: "#ef4444" },
};

export const MAX_DAILY_XP = 2000;
export const XP_DECIMALS = 0;
