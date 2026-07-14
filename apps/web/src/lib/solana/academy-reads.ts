import { Connection, PublicKey } from "@solana/web3.js";
import type { Idl } from "@coral-xyz/anchor";
import { BorshCoder } from "@coral-xyz/anchor";
import type BN from "bn.js";
import {
  getAssociatedTokenAddressSync,
  getAccount,
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import IDL from "./idl/superteam_academy.json";
import VNEXT_IDL from "./idl/superteam_academy_vnext.json";
import {
  findConfigPDA,
  findCoursePDA,
  findEnrollmentPDA,
  findAchievementTypePDA,
  findAchievementReceiptPDA,
  getProgramId,
} from "./pda";

// Config, Enrollment, AchievementType, AchievementReceipt layouts are
// unchanged across program versions — only `Course` has multiple on-chain
// byte layouts (see coderV1/coderVNext below), so everything except Course
// keeps using this single v1 coder.
const coder = new BorshCoder(IDL as unknown as Idl);

// -----------------------------------------------------------------------------
// Course: length-dispatched, normalising decode
// -----------------------------------------------------------------------------
//
// The on-chain `Course` account has had multiple byte layouts. Anchor's account
// discriminator is derived from the struct name alone, so it is IDENTICAL
// across every layout — and `Course.version` is a content-revision counter,
// not a schema version. The only reliable signal for which layout an account
// holds is the account's raw byte length (`data.length`), which always equals
// the account's allocated `space` (== `Course::SIZE`, zero-padded), regardless
// of how short the variable-length `course_id` string inside it is.
//
//   224 bytes = v1     — `lesson_count: u8` + `min_completions_for_reward: u16`,
//                        no `active_lessons`. This is the layout in
//                        `superteam_academy.json` (coderV1) and is what's live
//                        on devnet today.
//   253 bytes = v-next — `active_lessons: [u64; 4]`, no `lesson_count` / no
//                        `min_completions_for_reward`. This is the layout in
//                        `superteam_academy_vnext.json` (coderVNext).
//
// Any other length (e.g. 255, the never-deployed v2) is an unknown layout and
// must never be silently decoded — decodeCourseBuffer throws.
const coderV1 = coder;
const coderVNext = new BorshCoder(VNEXT_IDL as unknown as Idl);

export const COURSE_SIZE_V1 = 224;
export const COURSE_SIZE_VNEXT = 253;

/** Raw (snake_case) BorshCoder decode of a 224-byte v1 Course account. */
interface RawCourseV1 {
  course_id: string;
  creator: PublicKey;
  content_tx_id: number[];
  version: number;
  lesson_count: number;
  difficulty: number;
  xp_per_lesson: number;
  track_id: number;
  track_level: number;
  prerequisite: PublicKey | null;
  creator_reward_xp: number;
  min_completions_for_reward: number;
  total_completions: number;
  total_enrollments: number;
  is_active: boolean;
  created_at: BN;
  updated_at: BN;
  collection: PublicKey;
  _reserved: number[];
  bump: number;
}

/** Raw (snake_case) BorshCoder decode of a 253-byte v-next Course account. */
interface RawCourseVNext {
  course_id: string;
  creator: PublicKey;
  content_tx_id: number[];
  version: number;
  active_lessons: BN[];
  difficulty: number;
  xp_per_lesson: number;
  track_id: number;
  track_level: number;
  prerequisite: PublicKey | null;
  creator_reward_xp: number;
  total_completions: number;
  total_enrollments: number;
  is_active: boolean;
  created_at: BN;
  updated_at: BN;
  collection: PublicKey;
  _reserved: number[];
  bump: number;
}

/**
 * Normalised Course shape returned by `fetchCourse`/`decodeCourse`, regardless
 * of which on-chain layout (v1 or v-next) the account was actually decoded
 * from. All pre-existing snake_case fields are unchanged; `activeLessons` and
 * `liveLessonCount` replace the version-specific `lesson_count` /
 * `active_lessons` / `min_completions_for_reward` fields so callers stop
 * asking version-specific questions.
 */
export interface DecodedCourse {
  course_id: string;
  creator: PublicKey;
  content_tx_id: number[];
  version: number;
  difficulty: number;
  xp_per_lesson: number;
  track_id: number;
  track_level: number;
  prerequisite: PublicKey | null;
  creator_reward_xp: number;
  total_completions: number;
  total_enrollments: number;
  is_active: boolean;
  created_at: BN;
  updated_at: BN;
  collection: PublicKey;
  _reserved: number[];
  bump: number;
  /** 256-bit live-lesson mask (4 u64 words), always populated, both versions. */
  activeLessons: bigint[];
  /** popcount(activeLessons); for v1 this equals the old `lesson_count`. */
  liveLessonCount: number;
}

/** Popcount of a single 64-bit word via Brian Kernighan's algorithm. */
function popcountWord(word: bigint): number {
  let count = 0;
  let w = word;
  while (w !== 0n) {
    w &= w - 1n;
    count++;
  }
  return count;
}

function popcountMask(mask: bigint[]): number {
  return mask.reduce((sum, word) => sum + popcountWord(word), 0);
}

/**
 * Dense mask for a v1 course's `lesson_count` lessons: bits `0..lessonCount-1`
 * set across the four 64-bit words. Mirrors the on-chain `Course::dense_mask`
 * (onchain-academy/programs/onchain-academy/src/state/course.rs). Exact
 * because v1 courses are always dense — no v1 course ever retired a lesson
 * slot (that capability only exists post-migration, via `active_lessons`).
 */
function denseMask(lessonCount: number): bigint[] {
  const mask: [bigint, bigint, bigint, bigint] = [0n, 0n, 0n, 0n];
  for (let i = 0; i < lessonCount; i++) {
    // lessonCount is u8 (<= 255), so i < 255 and word is always 0..3 — a
    // statically-known-valid tuple index, not an unchecked array access.
    const word = Math.floor(i / 64) as 0 | 1 | 2 | 3;
    const bit = BigInt(i % 64);
    mask[word] |= 1n << bit;
  }
  return mask;
}

function normalizeCourseV1(raw: RawCourseV1): DecodedCourse {
  const activeLessons = denseMask(raw.lesson_count);
  return {
    course_id: raw.course_id,
    creator: raw.creator,
    content_tx_id: raw.content_tx_id,
    version: raw.version,
    difficulty: raw.difficulty,
    xp_per_lesson: raw.xp_per_lesson,
    track_id: raw.track_id,
    track_level: raw.track_level,
    prerequisite: raw.prerequisite,
    creator_reward_xp: raw.creator_reward_xp,
    total_completions: raw.total_completions,
    total_enrollments: raw.total_enrollments,
    is_active: raw.is_active,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
    collection: raw.collection,
    _reserved: raw._reserved,
    bump: raw.bump,
    activeLessons,
    // Behaviour-neutrality: read `lesson_count` directly rather than
    // popcount-ing the mask we just synthesised from it. They ARE equal for a
    // dense mask (every v1 course is dense), but this way every existing
    // caller of the old `lesson_count` keeps getting the *exact* same number
    // unconditionally — not contingent on `denseMask` being bug-free.
    liveLessonCount: raw.lesson_count,
  };
}

function normalizeCourseVNext(raw: RawCourseVNext): DecodedCourse {
  const activeLessons = raw.active_lessons.map((word) =>
    BigInt(word.toString())
  );
  return {
    course_id: raw.course_id,
    creator: raw.creator,
    content_tx_id: raw.content_tx_id,
    version: raw.version,
    difficulty: raw.difficulty,
    xp_per_lesson: raw.xp_per_lesson,
    track_id: raw.track_id,
    track_level: raw.track_level,
    prerequisite: raw.prerequisite,
    creator_reward_xp: raw.creator_reward_xp,
    total_completions: raw.total_completions,
    total_enrollments: raw.total_enrollments,
    is_active: raw.is_active,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
    collection: raw.collection,
    _reserved: raw._reserved,
    bump: raw.bump,
    activeLessons,
    liveLessonCount: popcountMask(activeLessons),
  };
}

/**
 * Length-dispatched, normalising Course decode — the ONLY place that should
 * ever call `coderV1`/`coderVNext .accounts.decode("Course", ...)` directly.
 * Both `fetchCourse` and `decodeCourse` route through this.
 */
function decodeCourseBuffer(data: Buffer): DecodedCourse {
  if (data.length === COURSE_SIZE_V1) {
    const raw = coderV1.accounts.decode<RawCourseV1>("Course", data);
    return normalizeCourseV1(raw);
  }
  if (data.length === COURSE_SIZE_VNEXT) {
    const raw = coderVNext.accounts.decode<RawCourseVNext>("Course", data);
    return normalizeCourseVNext(raw);
  }
  throw new Error(
    `decodeCourse: unexpected Course account length ${data.length} bytes ` +
      `(expected ${COURSE_SIZE_V1} [v1] or ${COURSE_SIZE_VNEXT} [v-next])`
  );
}

/** Decoded AchievementReceipt PDA (raw BorshCoder returns snake_case). */
export interface AchievementReceiptDecoded {
  asset: Uint8Array | string;
  awarded_at: bigint | number;
  bump: number;
}

/** Decoded AchievementType PDA (raw BorshCoder returns snake_case). */
export interface AchievementTypeDecoded {
  collection: Uint8Array | string;
  xp_reward: number;
  max_supply: number;
  name: string;
  metadata_uri: string;
  minted_count: number;
  bump: number;
}

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
): Promise<DecodedCourse | null> {
  const [pda] = findCoursePDA(courseId, programId);
  const accountInfo = await connection.getAccountInfo(pda);
  if (!accountInfo) return null;
  return decodeCourseBuffer(accountInfo.data);
}

/**
 * Decode a Course account from raw account data (BorshCoder → snake_case
 * fields, normalised across the v1/v-next layouts — see `DecodedCourse`).
 * Lets a caller that has already fetched the account (e.g. via getAccountInfo)
 * read Course fields without a second RPC round-trip. Throws on an account
 * whose length doesn't match a known layout — callers that just want a field
 * should try/catch.
 */
export function decodeCourse(data: Buffer): DecodedCourse {
  return decodeCourseBuffer(data);
}

export async function fetchAchievementType(
  achievementId: string,
  connection: Connection,
  programId: PublicKey = getProgramId()
): Promise<AchievementTypeDecoded | null> {
  const [pda] = findAchievementTypePDA(achievementId, programId);
  const accountInfo = await connection.getAccountInfo(pda);
  if (!accountInfo) return null;
  return coder.accounts.decode(
    "AchievementType",
    accountInfo.data
  ) as AchievementTypeDecoded;
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

/**
 * Fetch and decode a full AchievementReceipt PDA.
 * Returns the decoded data (asset, awarded_at, bump) or null if it doesn't exist.
 */
export async function fetchAchievementReceiptData(
  achievementId: string,
  recipientAddress: string,
  connection: Connection,
  programId: PublicKey = getProgramId()
): Promise<AchievementReceiptDecoded | null> {
  try {
    const recipient = new PublicKey(recipientAddress);
    const [receiptPda] = findAchievementReceiptPDA(
      achievementId,
      recipient,
      programId
    );
    const accountInfo = await connection.getAccountInfo(receiptPda);
    if (!accountInfo) return null;
    return coder.accounts.decode(
      "AchievementReceipt",
      accountInfo.data
    ) as AchievementReceiptDecoded;
  } catch {
    return null;
  }
}
