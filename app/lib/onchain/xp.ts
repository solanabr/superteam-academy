import { Connection, PublicKey } from "@solana/web3.js";

void Connection;
void PublicKey;

const HELIUS_RPC = "https://devnet.helius-rpc.com/?api-key=" + process.env.NEXT_PUBLIC_HELIUS_API_KEY;

void HELIUS_RPC; // Used for future RPC calls

export async function getXPBalance(walletAddress: string): Promise<number> {
  try {
    const res = await fetch("https://api-devnet.helius.xyz/v0/addresses/" + walletAddress + "/balances?api-key=" + process.env.NEXT_PUBLIC_HELIUS_API_KEY);
    const data = await res.json();
    // XP is a Token-2022 NonTransferable token — find it by checking tokens
    const tokens = data.tokens || [];
    // For now return mock XP until real mint address is known
    return tokens.length > 0 ? tokens[0].amount : 0;
  } catch {
    return 0;
  }
}

export async function getLeaderboard(): Promise<{address: string, xp: number, rank: number}[]> {
  try {
    const res = await fetch("https://api-devnet.helius.xyz/v0/token-accounts?api-key=" + process.env.NEXT_PUBLIC_HELIUS_API_KEY, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ programId: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb" })
    });
    const data = await res.json();
    return (data.result || []).slice(0, 10).map((item: { owner: string; amount?: number }, i: number) => ({
      address: item.owner,
      xp: item.amount || 0,
      rank: i + 1
    }));
  } catch {
    return [];
  }
}