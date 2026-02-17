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
  PROGRAM_ID,
} from "./pda";

const coder = new BorshCoder(IDL as unknown as Idl);

export async function fetchConfig(
  connection: Connection,
  programId: PublicKey = PROGRAM_ID
) {
  const [pda] = findConfigPDA(programId);
  const accountInfo = await connection.getAccountInfo(pda);
  if (!accountInfo) return null;
  return coder.accounts.decode("Config", accountInfo.data);
}

export async function fetchCourse(
  courseId: string,
  connection: Connection,
  programId: PublicKey = PROGRAM_ID
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
  programId: PublicKey = PROGRAM_ID
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
): Promise<number> {
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
    return Number(account.amount);
  } catch {
    return 0;
  }
}

export async function fetchAchievementReceipt(
  achievementId: string,
  recipient: PublicKey,
  connection: Connection,
  programId: PublicKey = PROGRAM_ID
) {
  const [pda] = findAchievementReceiptPDA(achievementId, recipient, programId);
  const accountInfo = await connection.getAccountInfo(pda);
  if (!accountInfo) return null;
  return coder.accounts.decode("AchievementReceipt", accountInfo.data);
}
