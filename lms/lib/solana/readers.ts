import { PublicKey } from "@solana/web3.js";
import { getAccount, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { getConnection } from "./connection";
import { getReadonlyProgram } from "./program";
import { PROGRAM_ID } from "./constants";
import {
  getConfigPDA,
  getCoursePDA,
  getLearnerPDA,
  getEnrollmentPDA,
  getLearnerTokenAccount,
} from "./pda";
import { BN } from "@coral-xyz/anchor";

function toBN(val: any): BN {
  if (val instanceof BN) return val;
  return new BN(String(val));
}

// Cache config result to avoid repeated RPC calls when program isn't deployed
let configCache: { value: any; ts: number } | null = null;
const CONFIG_TTL = 60_000; // 60 seconds

export async function fetchConfig() {
  const program = getReadonlyProgram();
  const [configPda] = getConfigPDA();
  try {
    return await (program.account as any).config.fetch(configPda);
  } catch {
    return null;
  }
}

export async function fetchConfigCached() {
  if (configCache && Date.now() - configCache.ts < CONFIG_TTL) {
    return configCache.value;
  }
  const value = await fetchConfig();
  configCache = { value, ts: Date.now() };
  return value;
}

export async function fetchLearnerProfile(wallet: PublicKey) {
  const program = getReadonlyProgram();
  const [learnerPda] = getLearnerPDA(wallet);
  try {
    return await (program.account as any).learnerProfile.fetch(learnerPda);
  } catch {
    return null;
  }
}

export async function fetchEnrollment(courseId: string, wallet: PublicKey) {
  const program = getReadonlyProgram();
  const [enrollmentPda] = getEnrollmentPDA(courseId, wallet);
  try {
    return await (program.account as any).enrollment.fetch(enrollmentPda);
  } catch {
    return null;
  }
}

export async function fetchCourse(courseId: string) {
  const program = getReadonlyProgram();
  const [coursePda] = getCoursePDA(courseId);
  try {
    return await (program.account as any).course.fetch(coursePda);
  } catch {
    return null;
  }
}

export async function fetchXPBalance(
  wallet: PublicKey,
  mint: PublicKey
): Promise<number> {
  const connection = getConnection();
  const ata = getLearnerTokenAccount(wallet, mint);
  try {
    const account = await getAccount(connection, ata, "confirmed", TOKEN_2022_PROGRAM_ID);
    return Number(account.amount);
  } catch {
    return 0;
  }
}

/**
 * Convert a [u64; 4] bitmap to an array of set bit indices.
 * Uses BN to avoid BigInt literal requirements.
 */
export function bitmapToLessonIndices(flags: any[]): number[] {
  const indices: number[] = [];
  const ZERO = new BN(0);
  const ONE = new BN(1);
  for (let word = 0; word < 4; word++) {
    const val = toBN(flags[word]);
    for (let bit = 0; bit < 64; bit++) {
      if (!val.shrn(bit).and(ONE).eq(ZERO)) {
        indices.push(word * 64 + bit);
      }
    }
  }
  return indices;
}

export function isBitSet(flags: any[], index: number): boolean {
  const word = Math.floor(index / 64);
  const bit = index % 64;
  if (word >= 4) return false;
  const val = toBN(flags[word]);
  const ONE = new BN(1);
  const ZERO = new BN(0);
  return !val.shrn(bit).and(ONE).eq(ZERO);
}

export function popcountBitmap(flags: any[]): number {
  let count = 0;
  const ZERO = new BN(0);
  const ONE = new BN(1);
  for (let word = 0; word < 4; word++) {
    let val = toBN(flags[word]);
    while (val.gt(ZERO)) {
      val = val.and(val.sub(ONE));
      count++;
    }
  }
  return count;
}

/**
 * Fetch all LearnerProfile PDAs via getProgramAccounts.
 * Returns array of { wallet, profile } objects.
 */
export async function fetchAllLearnerProfiles(): Promise<
  { wallet: PublicKey; profile: any }[]
> {
  const program = getReadonlyProgram();
  try {
    const accounts = await (program.account as any).learnerProfile.all();
    return accounts.map((a: any) => ({
      wallet: a.account.authority as PublicKey,
      profile: a.account,
    }));
  } catch {
    return [];
  }
}

/**
 * Fetch all Course PDAs via getProgramAccounts.
 */
export async function fetchAllCourses(): Promise<
  { publicKey: PublicKey; course: any }[]
> {
  const program = getReadonlyProgram();
  try {
    const accounts = await (program.account as any).course.all();
    return accounts.map((a: any) => ({
      publicKey: a.publicKey as PublicKey,
      course: a.account,
    }));
  } catch {
    return [];
  }
}
