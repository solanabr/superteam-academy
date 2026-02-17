import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

export interface AirdropResult {
  success: boolean;
  signature?: string;
  newBalance?: number;
  error?: string;
  rateLimited?: boolean;
}

/**
 * Request an airdrop with exponential backoff retry.
 * Returns a structured result (never throws).
 *
 * @param amount - SOL to request (default: 2, max reliable on devnet)
 */
export async function createAirdropRequest(
  connection: Connection,
  walletAddress: PublicKey,
  amount: number = 2
): Promise<AirdropResult> {
  const lamports = amount * LAMPORTS_PER_SOL;
  const maxRetries = 3;
  let lastError = "";

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const signature = await connection.requestAirdrop(
        walletAddress,
        lamports
      );

      // Wait for confirmation
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash("confirmed");
      await connection.confirmTransaction(
        { signature, blockhash, lastValidBlockHeight },
        "confirmed"
      );

      const newBalance = await connection.getBalance(
        walletAddress,
        "confirmed"
      );

      return {
        success: true,
        signature,
        newBalance: newBalance / LAMPORTS_PER_SOL,
      };
    } catch (err) {
      const message = (err as Error).message ?? String(err);
      lastError = message;

      // Detect rate limiting
      if (
        message.includes("429") ||
        message.includes("Too Many Requests") ||
        message.includes("airdrop request limit")
      ) {
        return {
          success: false,
          error:
            "Devnet faucet is busy. Please wait 30-60 seconds and try again.",
          rateLimited: true,
        };
      }

      // Exponential backoff for transient errors
      if (attempt < maxRetries - 1) {
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
      }
    }
  }

  return {
    success: false,
    error: `Airdrop failed after ${maxRetries} attempts: ${lastError}`,
    rateLimited: false,
  };
}
