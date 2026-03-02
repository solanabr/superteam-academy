import { Connection, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { TOKEN_2022_PROGRAM_ID, DEVNET_RPC_URL } from "./constants";

export async function fetchXpBalance(
  walletAddress: string,
  xpMintAddress: string,
  rpcUrl?: string
): Promise<number> {
  const connection = new Connection(rpcUrl || DEVNET_RPC_URL, "confirmed");
  const wallet = new PublicKey(walletAddress);
  const xpMint = new PublicKey(xpMintAddress);

  const ata = getAssociatedTokenAddressSync(
    xpMint,
    wallet,
    false,
    TOKEN_2022_PROGRAM_ID
  );

  try {
    const balance = await connection.getTokenAccountBalance(ata);
    return Number(balance.value.amount);
  } catch {
    // ATA doesn't exist yet — learner has 0 XP
    return 0;
  }
}

export async function fetchXpLeaderboard(
  xpMintAddress: string,
  limit: number = 50,
  rpcUrl?: string
): Promise<Array<{ wallet: string; xp: number }>> {
  const connection = new Connection(rpcUrl || DEVNET_RPC_URL, "confirmed");
  const xpMint = new PublicKey(xpMintAddress);

  try {
    const accounts = await connection.getProgramAccounts(TOKEN_2022_PROGRAM_ID, {
      filters: [
        { dataSize: 165 },
        { memcmp: { offset: 0, bytes: xpMint.toBase58() } },
      ],
    });

    const balances = accounts
      .map((acc) => {
        const data = acc.account.data;
        // Token account layout: mint (32) + owner (32) + amount (u64 at offset 64)
        const owner = new PublicKey(data.subarray(32, 64));
        const amount = data.readBigUInt64LE(64);
        return { wallet: owner.toBase58(), xp: Number(amount) };
      })
      .filter((e) => e.xp > 0)
      .sort((a, b) => b.xp - a.xp)
      .slice(0, limit);

    return balances;
  } catch {
    return [];
  }
}
