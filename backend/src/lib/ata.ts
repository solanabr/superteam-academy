import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { connection, TOKEN_2022_PROGRAM_ID } from "./program.js";

/**
 * Get the Token-2022 ATA address and an instruction to create it if it doesn't exist.
 * Returns [ataAddress, createInstruction | null].
 */
export async function getOrCreateATA(
  mint: PublicKey,
  owner: PublicKey,
  payer: PublicKey,
): Promise<[PublicKey, TransactionInstruction | null]> {
  const ata = getAssociatedTokenAddressSync(
    mint,
    owner,
    true,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );

  const account = await connection.getAccountInfo(ata);
  if (account) {
    return [ata, null];
  }

  const ix = createAssociatedTokenAccountInstruction(
    payer,
    ata,
    owner,
    mint,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );

  return [ata, ix];
}
