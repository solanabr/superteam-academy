import { Connection, PublicKey } from "@solana/web3.js";
import type { Idl } from "@coral-xyz/anchor";
import { BorshCoder } from "@coral-xyz/anchor";
import {
  getAssociatedTokenAddressSync,
  getAccount,
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import IDL from "./idl/superteam_academy.json";
import {
  findConfigPDA,
  findCoursePDA,
  findEnrollmentPDA,
  findAchievementReceiptPDA,
  getProgramId,
} from "./pda";

const coder = new BorshCoder(IDL as unknown as Idl);

export async function fetchConfig(
  connection: Connection,
  programId: PublicKey = getProgramId()
) {
  const [pda] = findConfigPDA(programId);
  const accountInfo = await connection.getAccountInfo(pda);
  if (!accountInfo) return null;
  return coder.accounts.decode("Config", accountInfo.data);
}

export async function fetchCourse(
  courseId: string,
  connection: Connection,
  programId: PublicKey = getProgramId()
) {
  const [pda] = findCoursePDA(courseId, programId);
  const accountInfo = await connection.getAccountInfo(pda);
  if (!accountInfo) return null;
  return coder.accounts.decode("Course", accountInfo.data);
}

export async function fetchEnrollment(
  courseId: string,
  user: PublicKey,
  connection: Connection,
  programId: PublicKey = getProgramId()
) {
  const [pda] = findEnrollmentPDA(courseId, user, programId);
  const accountInfo = await connection.getAccountInfo(pda);
  if (!accountInfo) return null;
  return coder.accounts.decode("Enrollment", accountInfo.data);
}

export async function fetchXpBalance(
  user: PublicKey,
  xpMint: PublicKey,
  connection: Connection
): Promise<{ balance: number; error?: string }> {
  const ata = getAssociatedTokenAddressSync(
    xpMint,
    user,
    false,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  try {
    const account = await getAccount(
      connection,
      ata,
      "confirmed",
      TOKEN_2022_PROGRAM_ID
    );
    return { balance: Number(account.amount) };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    // TokenAccountNotFoundError means the ATA doesn't exist yet (legitimate 0 balance)
    if (
      message.includes("could not find account") ||
      message.includes("TokenAccountNotFound")
    ) {
      return { balance: 0 };
    }
    // Any other error is an RPC/network failure — surface it
    return { balance: 0, error: message };
  }
}

export async function fetchAchievementReceipt(
  achievementId: string,
  recipientAddress: string,
  connection: Connection,
  programId: PublicKey = getProgramId()
): Promise<boolean> {
  try {
    const recipient = new PublicKey(recipientAddress);
    const [receiptPda] = findAchievementReceiptPDA(
      achievementId,
      recipient,
      programId
    );
    const accountInfo = await connection.getAccountInfo(receiptPda);
    return accountInfo !== null;
  } catch {
    return false;
  }
}
