import { PublicKey, Connection, TransactionInstruction } from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import { XP_MINT, TOKEN_2022_PROGRAM_ID } from "./constants";

export function getXpAta(owner: PublicKey): PublicKey {
  return getAssociatedTokenAddressSync(
    XP_MINT,
    owner,
    false,
    TOKEN_2022_PROGRAM_ID
  );
}

export async function getXpBalance(
  connection: Connection,
  owner: PublicKey
): Promise<number> {
  try {
    const ata = getXpAta(owner);
    const balance = await connection.getTokenAccountBalance(ata);
    return Number(balance.value.amount);
  } catch {
    return 0;
  }
}

export function createXpAtaIx(
  payer: PublicKey,
  owner: PublicKey
): TransactionInstruction {
  return createAssociatedTokenAccountInstruction(
    payer,
    getXpAta(owner),
    owner,
    XP_MINT,
    TOKEN_2022_PROGRAM_ID
  );
}
