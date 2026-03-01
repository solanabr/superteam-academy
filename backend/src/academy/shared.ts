import type { Program } from "@coral-xyz/anchor";
import BN from "bn.js";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import {
  getAuthorityKeypair,
  getAuthorityProgram,
  getBackendProgram,
  getBackendSignerKeypair,
} from "@/program.js";
import {
  getAchievementTypePda,
  getConfigPda,
  getCoursePda,
} from "@/pdas.js";
import { badRequest, internalError } from "@/lib/errors.js";
import { withRpcRetry } from "@/lib/rpc.js";

export const MPL_CORE_PROGRAM_ID = new PublicKey(
  "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d"
);

type ConfigAccount = {
  xpMint: PublicKey;
};

type CourseAccount = {
  creator: PublicKey;
  lesson_count?: number;
  lessonCount?: number;
  xp_per_lesson?: number;
  xpPerLesson?: number;
  track_id?: number;
  trackId?: number;
  track_level?: number;
  trackLevel?: number;
};

type AchievementTypeAccount = {
  collection: PublicKey;
};

function accountNotFound(error: unknown): boolean {
  const message = String(error);
  return (
    message.includes("Account does not exist") ||
    message.includes("could not find account")
  );
}

export function requireAuthorityProgram(): Program {
  const program = getAuthorityProgram();
  if (!program) {
    throw internalError("ACADEMY_AUTHORITY_KEYPAIR not configured");
  }
  return program;
}

export function requireBackendProgram(): Program {
  const program = getBackendProgram();
  if (!program) {
    throw internalError("ACADEMY_BACKEND_SIGNER_KEYPAIR not configured");
  }
  return program;
}

export function requireAuthoritySigner(): Keypair {
  const signer = getAuthorityKeypair();
  if (!signer) {
    throw internalError("ACADEMY_AUTHORITY_KEYPAIR not configured");
  }
  return signer;
}

export function requireBackendSigner(): Keypair {
  const signer = getBackendSignerKeypair();
  if (!signer) {
    throw internalError("ACADEMY_BACKEND_SIGNER_KEYPAIR not configured");
  }
  return signer;
}

export function requireProviderPublicKey(program: Program): PublicKey {
  const pubkey = program.provider.publicKey;
  if (!pubkey) {
    throw internalError("Program provider wallet is missing public key");
  }
  return pubkey;
}

export async function fetchConfig(program: Program): Promise<{
  configPda: PublicKey;
  config: ConfigAccount;
}> {
  const configPda = getConfigPda(program.programId);
  const config = await withRpcRetry(
    () =>
      (
        program.account as {
          config: {
            fetch: (pda: PublicKey) => Promise<ConfigAccount>;
          };
        }
      ).config.fetch(configPda),
    { label: "fetchConfig" }
  );

  return { configPda, config };
}

export async function fetchCourseOrThrow(
  program: Program,
  courseId: string,
  notFoundHint: string
): Promise<{
  coursePda: PublicKey;
  course: CourseAccount;
}> {
  const coursePda = getCoursePda(courseId, program.programId);
  try {
    const course = await withRpcRetry(
      () =>
        (
          program.account as {
            course: {
              fetch: (pda: PublicKey) => Promise<CourseAccount>;
            };
          }
        ).course.fetch(coursePda),
      { label: "fetchCourse" }
    );
    return { coursePda, course };
  } catch (error) {
    if (accountNotFound(error)) {
      throw badRequest(notFoundHint);
    }
    throw error;
  }
}

export async function fetchAchievementType(
  program: Program,
  achievementId: string
): Promise<{
  achievementTypePda: PublicKey;
  achievementType: AchievementTypeAccount;
}> {
  const achievementTypePda = getAchievementTypePda(
    achievementId,
    program.programId
  );

  const achievementType = await withRpcRetry(
    () =>
      (
        program.account as {
          achievementType: {
            fetch: (pda: PublicKey) => Promise<AchievementTypeAccount>;
          };
        }
      ).achievementType.fetch(achievementTypePda),
    { label: "fetchAchievementType" }
  );

  return { achievementTypePda, achievementType };
}

export async function ensureToken2022Ata(
  program: Program,
  mint: PublicKey,
  owner: PublicKey
): Promise<PublicKey> {
  const ata = getAssociatedTokenAddressSync(
    mint,
    owner,
    false,
    TOKEN_2022_PROGRAM_ID
  );

  const accountInfo = await withRpcRetry(
    () => program.provider.connection.getAccountInfo(ata),
    { label: "getAccountInfo(ata)" }
  );
  if (accountInfo) {
    return ata;
  }

  const payer = requireProviderPublicKey(program);
  const createIx = createAssociatedTokenAccountInstruction(
    payer,
    ata,
    owner,
    mint,
    TOKEN_2022_PROGRAM_ID
  );

  const setupTx = new Transaction().add(createIx);
  const providerWithSendAndConfirm = program.provider as {
    sendAndConfirm?: (tx: Transaction) => Promise<string>;
  };

  if (!providerWithSendAndConfirm.sendAndConfirm) {
    throw internalError("Program provider cannot send setup transactions");
  }

  await providerWithSendAndConfirm.sendAndConfirm(setupTx);

  return ata;
}

export async function sendLegacyTransaction(
  program: Program,
  payer: Keypair,
  tx: Transaction,
  signers: Keypair[]
): Promise<string> {
  const latestBlockhash = await program.provider.connection.getLatestBlockhash();
  tx.recentBlockhash = latestBlockhash.blockhash;
  tx.feePayer = payer.publicKey;
  tx.partialSign(...signers, payer);

  const signature = await program.provider.connection.sendRawTransaction(
    tx.serialize()
  );
  await program.provider.connection.confirmTransaction(signature, "confirmed");

  return signature;
}

/** Lesson flags: BN[] or number[]. Returns count of completed lessons in [0, lessonCount). */
export function countCompletedLessonsInRange(
  flags: BN[] | number[],
  lessonCount: number
): number {
  let count = 0;
  for (let i = 0; i < lessonCount; i++) {
    if (isLessonCompleteInFlags(flags, i)) count++;
  }
  return count;
}

/** Lesson flags: BN[] or number[]. Returns true if bit at lessonIndex is set. */
export function isLessonCompleteInFlags(
  flags: BN[] | number[],
  lessonIndex: number
): boolean {
  const wordIndex = Math.floor(lessonIndex / 64);
  const bitIndex = lessonIndex % 64;
  const word = flags[wordIndex];
  if (word == null) return false;
  const w = typeof word === "number" ? new BN(word) : word;
  return !w.and(new BN(1).shln(bitIndex)).isZero();
}

export async function fetchEnrollment(
  program: Program,
  courseId: string,
  learner: PublicKey
): Promise<{ enrollmentPda: PublicKey; enrollment: Record<string, unknown> } | null> {
  const { getEnrollmentPda } = await import("@/pdas.js");
  const enrollmentPda = getEnrollmentPda(courseId, learner, program.programId);
  try {
    const enrollment = await withRpcRetry(
      () =>
        (
          program.account as {
            enrollment: { fetch: (pda: PublicKey) => Promise<Record<string, unknown>> };
          }
        ).enrollment.fetch(enrollmentPda),
      { label: "fetchEnrollment" }
    );
    return { enrollmentPda, enrollment };
  } catch {
    return null;
  }
}

export function getEnrollmentCredentialAsset(
  enrollment: Record<string, unknown>
): PublicKey | null {
  const asset =
    (enrollment.credential_asset as PublicKey | undefined) ??
    (enrollment.credentialAsset as PublicKey | undefined);
  if (!asset) return null;
  if (asset instanceof PublicKey) return asset;
  if (typeof asset === "string") {
    try {
      return new PublicKey(asset);
    } catch {
      return null;
    }
  }
  return null;
}

export async function getAllXpHolders(
  program: Program,
  xpMint: PublicKey
): Promise<{ wallet: string; balance: number }[]> {
  const conn = program.provider.connection;
  const accounts = await conn.getProgramAccounts(TOKEN_2022_PROGRAM_ID, {
    filters: [
      { dataSize: 165 },
      { memcmp: { offset: 0, bytes: xpMint.toBase58() } },
    ],
  });
  const holders: { wallet: string; balance: number }[] = [];
  for (const acc of accounts) {
    const data = acc.account.data;
    if (data.length < 72) continue;
    const owner = new PublicKey(data.subarray(32, 64));
    const amount = data.readBigUInt64LE(64);
    if (amount > 0n) {
      holders.push({ wallet: owner.toBase58(), balance: Number(amount) });
    }
  }
  return holders;
}
