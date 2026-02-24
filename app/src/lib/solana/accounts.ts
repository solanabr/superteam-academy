import { Connection, PublicKey } from '@solana/web3.js';
import { PROGRAM_ID } from './constants';
import {
  configPda,
  coursePda,
  enrollmentPda,
  minterRolePda,
  achievementTypePda,
  achievementReceiptPda,
} from './pda';
import type {
  Config,
  Course,
  Enrollment,
  MinterRole,
  AchievementType,
  AchievementReceipt,
} from './idl/onchain-academy-types';

/**
 * Account readers for the Superteam Academy on-chain program.
 *
 * Without a compiled Anchor IDL, we cannot deserialize account data directly.
 * Each function fetches the raw AccountInfo via the derived PDA address.
 * Once the IDL is available, these will use `program.account.<Type>.fetch()`
 * for proper Borsh deserialization.
 *
 * Current behavior:
 * - Returns `null` when the account does not exist on-chain
 * - Returns `null` for existing accounts until IDL deserialization is wired in
 * - The frontend gracefully handles null responses (empty states, loading, etc.)
 */

// 8-byte Anchor account discriminator offset
const DISCRIMINATOR_SIZE = 8;

/**
 * Fetches the singleton Config account.
 */
export async function fetchConfig(connection: Connection): Promise<Config | null> {
  const [pda] = configPda();
  const accountInfo = await connection.getAccountInfo(pda);
  if (!accountInfo || !accountInfo.owner.equals(PROGRAM_ID)) return null;
  // Deserialization pending IDL integration
  return null;
}

/**
 * Fetches a Course account by course ID.
 */
export async function fetchCourse(
  connection: Connection,
  courseId: string,
): Promise<Course | null> {
  const [pda] = coursePda(courseId);
  const accountInfo = await connection.getAccountInfo(pda);
  if (!accountInfo || !accountInfo.owner.equals(PROGRAM_ID)) return null;
  return null;
}

/**
 * Fetches an Enrollment account for a specific learner and course.
 */
export async function fetchEnrollment(
  connection: Connection,
  courseId: string,
  learner: PublicKey,
): Promise<Enrollment | null> {
  const [pda] = enrollmentPda(courseId, learner);
  const accountInfo = await connection.getAccountInfo(pda);
  if (!accountInfo || !accountInfo.owner.equals(PROGRAM_ID)) return null;
  return null;
}

/**
 * Fetches all Course accounts owned by the program.
 * Uses getProgramAccounts with a discriminator filter for Course accounts.
 *
 * Note: The 8-byte discriminator is the first 8 bytes of
 * sha256("account:Course"). Until the IDL is available, we filter
 * by data length as an approximation (Course = 192 bytes + 8 discriminator).
 */
export async function fetchAllCourses(connection: Connection): Promise<Course[]> {
  const COURSE_ACCOUNT_SIZE = DISCRIMINATOR_SIZE + 192;

  const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
    filters: [{ dataSize: COURSE_ACCOUNT_SIZE }],
  });

  if (accounts.length === 0) return [];

  // Deserialization pending IDL integration — return empty for now
  return [];
}

/**
 * Fetches all Enrollment accounts for a specific learner.
 *
 * Uses `getProgramAccounts` filtered by data size to locate Enrollment
 * accounts. Currently returns an empty array because:
 *
 * 1. Borsh deserialization requires a compiled Anchor IDL which is not yet
 *    integrated. Without it we cannot decode account data into `Enrollment`.
 * 2. A `memcmp` filter on the learner pubkey field requires knowing the
 *    exact byte offset within the serialized Enrollment layout. That offset
 *    will be derived from the IDL once available, enabling server-side
 *    filtering so only the target learner's enrollments are returned.
 *
 * When IDL integration lands, this function will:
 * - Add a `memcmp` filter for `_learner` at the correct byte offset
 * - Deserialize each account via `program.account.Enrollment.fetch()`
 * - Return the fully typed `Enrollment[]`
 *
 * @param connection - Solana RPC connection
 * @param _learner  - Public key of the learner (unused until IDL integration)
 * @returns Empty array pending IDL deserialization support
 */
export async function fetchUserEnrollments(
  connection: Connection,
  _learner: PublicKey,
): Promise<Enrollment[]> {
  const ENROLLMENT_ACCOUNT_SIZE = DISCRIMINATOR_SIZE + 127;

  const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
    filters: [{ dataSize: ENROLLMENT_ACCOUNT_SIZE }],
  });

  if (accounts.length === 0) return [];

  return [];
}

/**
 * Fetches a MinterRole account by minter pubkey.
 */
export async function fetchMinterRole(
  connection: Connection,
  minter: PublicKey,
): Promise<MinterRole | null> {
  const [pda] = minterRolePda(minter);
  const accountInfo = await connection.getAccountInfo(pda);
  if (!accountInfo || !accountInfo.owner.equals(PROGRAM_ID)) return null;
  return null;
}

/**
 * Fetches an AchievementType account by achievement ID.
 */
export async function fetchAchievementType(
  connection: Connection,
  achievementId: string,
): Promise<AchievementType | null> {
  const [pda] = achievementTypePda(achievementId);
  const accountInfo = await connection.getAccountInfo(pda);
  if (!accountInfo || !accountInfo.owner.equals(PROGRAM_ID)) return null;
  return null;
}

/**
 * Fetches an AchievementReceipt account for a specific recipient and achievement.
 */
export async function fetchAchievementReceipt(
  connection: Connection,
  achievementId: string,
  recipient: PublicKey,
): Promise<AchievementReceipt | null> {
  const [pda] = achievementReceiptPda(achievementId, recipient);
  const accountInfo = await connection.getAccountInfo(pda);
  if (!accountInfo || !accountInfo.owner.equals(PROGRAM_ID)) return null;
  return null;
}
