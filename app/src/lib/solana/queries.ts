import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { getProgram, getConnection } from "./program";
import { getConfigPda, getCoursePda, getEnrollmentPda } from "./pdas";
import { getTypedAccounts, getTypedCoder } from "./typed-program";
import { TOKEN_2022_PROGRAM_ID } from "./constants";
import logger from "@/lib/logger";
import type {
  ConfigAccount,
  CourseAccount,
  EnrollmentAccount,
} from "@/types/program";

export async function fetchConfig(): Promise<ConfigAccount | null> {
  try {
    const program = await getProgram();
    const [pda] = getConfigPda();

    return (await getTypedAccounts(program).config.fetch(
      pda
    )) as ConfigAccount;
  } catch (error) {
    logger.error("[fetchConfig] failed:", error);
    return null;
  }
}

export async function fetchAllCourses(): Promise<
  { publicKey: PublicKey; account: CourseAccount }[]
> {
  try {
    const program = await getProgram();

    const all = await getTypedAccounts(program).course.all();
    return all as { publicKey: PublicKey; account: CourseAccount }[];
  } catch (error) {
    logger.error("[fetchAllCourses] failed:", error);
    return [];
  }
}

export async function fetchCourse(
  courseId: string
): Promise<CourseAccount | null> {
  try {
    const program = await getProgram();
    const [pda] = getCoursePda(courseId);

    return (await getTypedAccounts(program).course.fetch(
      pda
    )) as CourseAccount;
  } catch (error) {
    logger.error("[fetchCourse] failed:", error);
    return null;
  }
}

export async function fetchEnrollment(
  courseId: string,
  learner: PublicKey
): Promise<EnrollmentAccount | null> {
  try {
    const program = await getProgram();
    const [pda] = getEnrollmentPda(courseId, learner);

    return (await getTypedAccounts(program).enrollment.fetchNullable(
      pda
    )) as EnrollmentAccount | null;
  } catch (error) {
    logger.error("[fetchEnrollment] failed:", error);
    return null;
  }
}

export async function fetchXpBalance(
  wallet: PublicKey,
  xpMint: PublicKey
): Promise<number> {
  try {
    const connection = getConnection();
    const ata = getAssociatedTokenAddressSync(
      xpMint,
      wallet,
      false,
      TOKEN_2022_PROGRAM_ID
    );
    const balance = await connection.getTokenAccountBalance(ata);
    // XP uses Token-2022 with 0 decimals — `uiAmount` can be null for
    // 0-decimal tokens on some RPCs. `amount` (string) is always reliable.
    return Number(balance.value.amount);
  } catch (error) {
    logger.error("[fetchXpBalance] failed:", error);
    return 0;
  }
}

/**
 * Fetch all enrollments for a given learner by deriving the enrollment PDA
 * for each known course and batch-fetching them. The learner pubkey is part
 * of the PDA seeds (not stored in account data), so memcmp is not possible.
 */
export async function fetchAllEnrollmentsForLearner(
  learner: PublicKey
): Promise<{ publicKey: PublicKey; account: EnrollmentAccount }[]> {
  const program = await getProgram();
  const courses = await fetchAllCourses();

  const pdas = courses.map((c) => {
    const [pda] = getEnrollmentPda(c.account.courseId, learner);
    return pda;
  });

  const connection = getConnection();
  const infos = await connection.getMultipleAccountsInfo(pdas);

  const results: { publicKey: PublicKey; account: EnrollmentAccount }[] = [];
  for (let i = 0; i < pdas.length; i++) {
    if (infos[i]) {
      try {

        const decoded = getTypedCoder(program).accounts.decode<EnrollmentAccount>(
          "enrollment",
          infos[i]!.data
        );
        results.push({ publicKey: pdas[i]!, account: decoded });
      } catch (error) {
        logger.error("[fetchAllEnrollmentsForLearner] decode failed for PDA", pdas[i]!.toBase58(), error);
      }
    }
  }

  return results;
}
