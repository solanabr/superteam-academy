import { Connection, Keypair, Transaction } from "@solana/web3.js";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1500;

export async function sendWithRetry(
  connection: Connection,
  tx: Transaction,
  signers: Keypair[]
): Promise<string> {
  tx.recentBlockhash = (await connection.getLatestBlockhash("confirmed")).blockhash;
  tx.feePayer = signers[0].publicKey;
  tx.sign(...signers);

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const sig = await connection.sendRawTransaction(tx.serialize(), {
        skipPreflight: false,
        preflightCommitment: "confirmed",
      });
      await connection.confirmTransaction(sig, "confirmed");
      return sig;
    } catch (err) {
      if (attempt === MAX_RETRIES - 1) throw err;
      await new Promise((r) => setTimeout(r, RETRY_DELAY * (attempt + 1)));
    }
  }
  throw new Error("Transaction failed after retries");
}
