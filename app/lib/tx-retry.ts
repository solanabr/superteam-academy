import {
  Connection,
  Transaction,
  Keypair,
  sendAndConfirmTransaction,
} from "@solana/web3.js";

export async function sendWithRetry(
  connection: Connection,
  tx: Transaction,
  signers: Keypair[],
  retries = 1
): Promise<string> {
  try {
    return await sendAndConfirmTransaction(connection, tx, signers, {
      commitment: "confirmed",
    });
  } catch (err) {
    if (
      retries > 0 &&
      err instanceof Error &&
      err.message.includes("Blockhash not found")
    ) {
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash("confirmed");
      tx.recentBlockhash = blockhash;
      tx.lastValidBlockHeight = lastValidBlockHeight;
      return sendWithRetry(connection, tx, signers, retries - 1);
    }
    throw err;
  }
}
