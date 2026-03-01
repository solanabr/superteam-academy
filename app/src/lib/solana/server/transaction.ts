import {
  Connection,
  PublicKey,
  Signer,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';

/**
 * Builds, signs, sends, and confirms a versioned transaction.
 *
 * Handles the full lifecycle: fetch recent blockhash, compile a V0 message,
 * sign with all provided signers, send raw, and confirm at 'confirmed'
 * commitment.
 *
 * @returns The transaction signature string.
 */
export async function signAndConfirmTransaction(
  connection: Connection,
  instructions: TransactionInstruction[],
  signers: Signer[],
  feePayer: PublicKey,
): Promise<string> {
  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash();

  const messageV0 = new TransactionMessage({
    payerKey: feePayer,
    recentBlockhash: blockhash,
    instructions,
  }).compileToV0Message();

  const tx = new VersionedTransaction(messageV0);
  tx.sign(signers);

  const signature = await connection.sendRawTransaction(tx.serialize());
  await connection.confirmTransaction(
    { signature, blockhash, lastValidBlockHeight },
    'confirmed',
  );

  return signature;
}

/**
 * Safely extracts the Anchor error code from a caught error.
 *
 * Anchor program errors follow the shape:
 *   { error: { errorCode: { code: string } } }
 *
 * Returns the code string if present, or null otherwise.
 */
export function parseAnchorErrorCode(err: unknown): string | null {
  if (
    typeof err === 'object' &&
    err !== null &&
    'error' in err &&
    typeof (err as Record<string, unknown>).error === 'object' &&
    (err as Record<string, unknown>).error !== null
  ) {
    const errorObj = (err as { error: Record<string, unknown> }).error;
    if (
      'errorCode' in errorObj &&
      typeof errorObj.errorCode === 'object' &&
      errorObj.errorCode !== null
    ) {
      const errorCode = (errorObj.errorCode as Record<string, unknown>).code;
      if (typeof errorCode === 'string') {
        return errorCode;
      }
    }
  }
  return null;
}
