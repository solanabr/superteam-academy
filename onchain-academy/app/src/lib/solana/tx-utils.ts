import type { Connection } from "@solana/web3.js";
import { SOLANA_NETWORK } from "@/lib/constants";

/**
 * Poll for transaction confirmation with timeout.
 * Returns true if confirmed, false if timed out.
 */
export async function confirmTransaction(
  connection: Connection,
  signature: string,
  timeoutMs = 30_000,
): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const status = await connection.getSignatureStatus(signature);
    const value = status?.value;
    if (value?.confirmationStatus === "confirmed" || value?.confirmationStatus === "finalized") {
      if (value.err) return false;
      return true;
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  return false;
}

/**
 * Generate a Solana Explorer URL for a transaction signature.
 */
export function getExplorerUrl(signature: string): string {
  const cluster = SOLANA_NETWORK === "devnet" ? "?cluster=devnet" : "";
  return `https://explorer.solana.com/tx/${signature}${cluster}`;
}
