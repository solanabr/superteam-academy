import "server-only";

/**
 * Server-side authority signer for on-chain admin operations.
 *
 * Loads the program authority keypair from PROGRAM_AUTHORITY_SECRET env var
 * and submits createCourse, updateCourse, and createAchievementType instructions.
 *
 * On devnet, PROGRAM_AUTHORITY_SECRET is typically the same keypair as
 * BACKEND_SIGNER_SECRET (whoever called initialize becomes the authority).
 *
 * This module MUST ONLY be imported from API routes (server-side).
 */
import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import type { Idl } from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { mplCore, createCollectionV2 } from "@metaplex-foundation/mpl-core";
import { generateSigner, keypairIdentity } from "@metaplex-foundation/umi";
import {
  fromWeb3JsKeypair,
  fromWeb3JsPublicKey,
} from "@metaplex-foundation/umi-web3js-adapters";
import bs58 from "bs58";
import IDL from "./idl/superteam_academy_vnext.json";
import {
  findConfigPDA,
  findCoursePDA,
  findAchievementTypePDA,
  getProgramId,
} from "./pda";
import {
  buildCreateCourseOnChainParams,
  buildUpdateCourseOnChainParams,
  type ActiveLessonsMask,
  type CreateCourseOnChainParams,
  type UpdateCourseOnChainParams,
} from "./course-write-params";
import { serverEnv } from "@/lib/env.server";
import {
  padContentTxId,
  assertMaskMatchesLockfile,
} from "@/lib/github/content-commit";

// ---------------------------------------------------------------------------
// Anchor method builder types — mirrors the pattern in academy-program.ts
// ---------------------------------------------------------------------------

interface MethodBuilder {
  accountsPartial(accounts: Record<string, PublicKey>): MethodBuilder;
  signers(signers: Keypair[]): MethodBuilder;
  rpc(): Promise<string>;
}

interface AdminMethods {
  createCourse(params: CreateCourseOnChainParams): MethodBuilder;
  updateCourse(params: UpdateCourseOnChainParams): MethodBuilder;
  closeCourse(courseId: string): MethodBuilder;
  createAchievementType(
    params: CreateAchievementTypeOnChainParams
  ): MethodBuilder;
}

// The raw on-chain param shapes that mirror the Rust structs
// (CreateCourseOnChainParams / UpdateCourseOnChainParams) — plus their pure
// mappers and the mask encoder — live in ./course-write-params, isolated there
// so the encoding is unit tested without server-only/RPC. The achievement param
// shape stays local (unchanged by the v-next cutover).

interface CreateAchievementTypeOnChainParams {
  achievementId: string;
  name: string;
  metadataUri: string;
  maxSupply: number;
  xpReward: number;
}

// ---------------------------------------------------------------------------
// Public result types
// ---------------------------------------------------------------------------

export interface AdminSignerResult {
  success: boolean;
  signature?: string;
  error?: string;
}

export interface DeployAchievementResult {
  success: boolean;
  signature?: string;
  collectionAddress?: string;
  error?: string;
}

// ---------------------------------------------------------------------------
// Public parameter types
// ---------------------------------------------------------------------------

export interface CreateCourseAdminParams {
  courseId: string;
  lessonCount: number;
  difficulty: number;
  xpPerLesson: number;
  trackId: number;
  trackLevel: number;
  prerequisitePda?: string;
  creatorRewardXp: number;
  /**
   * Instructor's on-curve Solana wallet (base58). Becomes the on-chain
   * `course.creator` (creator-reward recipient). Required — a missing, invalid,
   * or off-curve value throws; there is no platform-authority fallback.
   */
  creatorWallet?: string;
  /**
   * Escape hatch for the deliberate case where `creatorWallet` is a denylisted
   * well-known address or equals the platform authority (see
   * {@link assertCreatorAllowed}). Default false → those cases hard-throw. When
   * true, the guard logs loudly and proceeds. No caller sets this today; it
   * exists for a future admin-UI "I know what I'm doing" override.
   */
  allowUnusualCreator?: boolean;
}

export interface UpdateCourseAdminParams {
  courseId: string;
  newXpPerLesson?: number;
  newIsActive?: boolean;
  newCreatorRewardXp?: number;
  /** Base58 address of the Metaplex Core credential collection to set/backfill. */
  newCollection?: string;
  /**
   * The v-next replacement for v1's `newLessonCount`: the 256-bit live-lesson
   * mask (`[u64; 4]`) written via `update_course.new_active_lessons`. Adding,
   * retiring, reordering and replacing lessons all reduce to writing a new mask.
   * The caller MUST cross-check it against the committed `slots.lock.json` first
   * (the sync route does, via `buildCourseCommit`) — `update_course` trusts the
   * authority blindly.
   */
  newActiveLessons?: ActiveLessonsMask;
  /**
   * The 32-byte `content_tx_id` commitment (§11.0), built by `buildCourseCommit`
   * from the synced git SHA. Written via `update_course.new_content_tx_id`.
   * Omit to leave the field unchanged.
   */
  contentTxId?: number[];
}

interface SlotsLock {
  version: number;
  slots: Record<string, number>;
  retired: number[];
  next: number;
}

/**
 * Build the on-chain content commitment for a course (§11.0): the 32-byte
 * content_tx_id (git sha left-padded) and the active_lessons mask. The caller
 * (the chain-sync route, from the admin panel's pending-sync state) supplies the
 * mask it intends to send; this ALWAYS asserts it equals the mask derived from
 * the committed slots.lock.json before returning the signable params — the guard
 * that stops a panel bug setting arbitrary bits, since update_course trusts the
 * authority blindly. Because the two masks come from independent sources
 * (panel state vs the committed lockfile), the assertion is a real cross-check,
 * not a tautology.
 *
 * The returned mask is threaded into `update_course.new_active_lessons` by the
 * sync route (v-next exposes the field) and `content_tx_id` is committed in the
 * same tx. This function only asserts + returns; it performs no encoding.
 */
export function buildCourseCommit(input: {
  courseId: string;
  contentSha: string;
  slotsLock: SlotsLock;
  activeLessons: [bigint, bigint, bigint, bigint];
}): { contentTxId: number[]; activeLessons: [bigint, bigint, bigint, bigint] } {
  assertMaskMatchesLockfile(
    input.courseId,
    input.activeLessons,
    input.slotsLock
  );
  return {
    contentTxId: padContentTxId(input.contentSha),
    activeLessons: input.activeLessons,
  };
}

export interface CreateAchievementAdminParams {
  achievementId: string;
  name: string;
  metadataUri: string;
  maxSupply: number;
  xpReward: number;
}

// ---------------------------------------------------------------------------
// Metaplex Core program ID (hardcoded — stable across all clusters)
// ---------------------------------------------------------------------------

const MPL_CORE_PROGRAM_ID = new PublicKey(
  "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d"
);

// ---------------------------------------------------------------------------
// Lazy-loaded singletons
// ---------------------------------------------------------------------------

let _connection: Connection | null = null;
let _authority: Keypair | null = null;
let _program: Program | null = null;
let _initialized = false;

function initialize(): { ready: boolean } {
  if (_initialized) {
    return { ready: _authority !== null };
  }
  _initialized = true;

  _connection = new Connection(serverEnv.SOLANA_RPC_URL, "confirmed");

  const authoritySecret = serverEnv.PROGRAM_AUTHORITY_SECRET;
  if (!authoritySecret) {
    console.warn(
      "[admin-signer] PROGRAM_AUTHORITY_SECRET not set. Admin on-chain operations disabled."
    );
    return { ready: false };
  }

  try {
    const parsed: unknown = JSON.parse(authoritySecret);
    if (!Array.isArray(parsed) || parsed.length !== 64) {
      console.error(
        "[admin-signer] PROGRAM_AUTHORITY_SECRET must be a 64-element JSON array."
      );
      return { ready: false };
    }
    const secretKey = Uint8Array.from(parsed as number[]);
    _authority = Keypair.fromSecretKey(secretKey);
  } catch {
    console.error("[admin-signer] Failed to parse PROGRAM_AUTHORITY_SECRET.");
    return { ready: false };
  }

  const provider = new AnchorProvider(_connection, new NodeWallet(_authority), {
    commitment: "confirmed",
  });
  // Env-driven program id (see academy-program.ts) so a fresh devnet instance
  // set via NEXT_PUBLIC_PROGRAM_ID is targeted, matching getProgramId() PDAs.
  _program = new Program(
    { ...(IDL as unknown as Idl), address: getProgramId().toBase58() },
    provider
  );

  return { ready: true };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns true if the authority keypair was loaded successfully.
 * Use this to gate admin UI features (show/hide deploy buttons, etc.).
 */
export function isAdminSignerReady(): boolean {
  const { ready } = initialize();
  return ready;
}

/**
 * The loaded platform-authority pubkey, or `null` when the signer is not
 * configured.
 *
 * Exposed so a caller can run {@link assertCreatorAllowed} — which needs the
 * authority to reject `creator == authority` — during a PRE-FLIGHT phase,
 * BEFORE it takes any destructive on-chain action. `deployCoursePda` runs the
 * same guard internally as a backstop, but that is far too late for the
 * recreate flow: by then the old Course PDA is already closed.
 */
export function getAuthorityPublicKey(): PublicKey | null {
  const { ready } = initialize();
  return ready && _authority ? _authority.publicKey : null;
}

// ---------------------------------------------------------------------------
// Creator-wallet guard
// ---------------------------------------------------------------------------

/**
 * Well-known program / sysvar addresses that are structurally valid Ed25519
 * points (so they PASS the upstream `isOnCurve` check in `deployCoursePda`) yet
 * are never a legitimate creator-reward recipient. Setting one of these as a
 * course `creator` would mint the creator reward to an address no human
 * controls — an irreversible mis-mint.
 *
 * Every entry here was verified ON-CURVE with `PublicKey.isOnCurve`. Off-curve
 * well-knowns are deliberately EXCLUDED — the upstream off-curve check already
 * rejects them, so listing them would be dead code. Confirmed off-curve and
 * omitted for exactly that reason: Compute Budget, Vote, BPFLoaderUpgradeable,
 * Ed25519 SigVerify, Secp256k1, and the Incinerator.
 */
export const CREATOR_DENYLIST: ReadonlyArray<{
  address: string;
  label: string;
}> = [
  // System program === the all-zero default Pubkey. The single most likely
  // accidental value (an uninitialized / empty field decodes to this). On-curve.
  { address: "11111111111111111111111111111111", label: "System program" },
  // SPL Token program. On-curve.
  {
    address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    label: "SPL Token program",
  },
  // SPL Token-2022 program. On-curve.
  {
    address: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
    label: "SPL Token-2022 program",
  },
  // Associated Token Account program. On-curve.
  {
    address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
    label: "Associated Token Account program",
  },
  // SPL Memo program. On-curve.
  {
    address: "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
    label: "SPL Memo program",
  },
  // Stake program. On-curve.
  {
    address: "Stake11111111111111111111111111111111111111",
    label: "Stake program",
  },
  // Rent sysvar. On-curve.
  {
    address: "SysvarRent111111111111111111111111111111111",
    label: "Rent sysvar",
  },
  // Clock sysvar. On-curve.
  {
    address: "SysvarC1ock11111111111111111111111111111111",
    label: "Clock sysvar",
  },
  // Wrapped SOL mint. On-curve — a real (vanity-grinded) keypair address, not
  // a PDA, so it is NOT rejected by the upstream off-curve check. #447.
  {
    address: "So11111111111111111111111111111111111111112",
    label: "Wrapped SOL mint",
  },
  // Recent Blockhashes sysvar. On-curve. #447.
  {
    address: "SysvarRecentB1ockHashes11111111111111111111",
    label: "Recent Blockhashes sysvar",
  },
  // Slot Hashes sysvar. On-curve. #447.
  {
    address: "SysvarS1otHashes111111111111111111111111111",
    label: "Slot Hashes sysvar",
  },
  // Slot History sysvar. On-curve. #447.
  {
    address: "SysvarS1otHistory11111111111111111111111111",
    label: "Slot History sysvar",
  },
  // Config native program. On-curve. #447.
  {
    address: "Config1111111111111111111111111111111111111",
    label: "Config program",
  },
  // Feature native program. On-curve. #447.
  {
    address: "Feature111111111111111111111111111111111111",
    label: "Feature program",
  },
  // Metaplex Token Metadata program. On-curve. #447.
  {
    address: "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
    label: "Metaplex Token Metadata program",
  },
  // Metaplex Core program — same id as MPL_CORE_PROGRAM_ID above. On-curve. #447.
  {
    address: "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d",
    label: "Metaplex Core program",
  },
];

/**
 * Defense-in-depth guard for the on-chain course `creator`, run AFTER the
 * caller has parsed `creatorWallet` and confirmed it is on-curve. Refuses two
 * on-curve-but-wrong cases that the off-curve check cannot catch:
 *
 *  1. `creator` is a {@link CREATOR_DENYLIST} well-known (a program/sysvar).
 *  2. `creator` equals the platform authority — the authority signs and pays
 *     for the deploy; it must not also be the creator-reward recipient.
 *
 * Throws a clear, pubkey-naming error (surfaced in the admin deploy UI) unless
 * `allowUnusualCreator` is set, in which case it logs loudly and returns.
 */
export function assertCreatorAllowed(
  creator: PublicKey,
  authority: PublicKey,
  courseId: string,
  allowUnusualCreator: boolean
): void {
  const creator58 = creator.toBase58();

  const denied = CREATOR_DENYLIST.find((e) => e.address === creator58);
  if (denied) {
    if (allowUnusualCreator) {
      console.warn(
        `[admin-signer] deployCoursePda(${courseId}): OVERRIDE — creatorWallet ${creator58} is a denylisted well-known (${denied.label}); proceeding because allowUnusualCreator=true`
      );
    } else {
      throw new Error(
        `deployCoursePda(${courseId}): creatorWallet ${creator58} is a denylisted well-known address (${denied.label}) and cannot receive creator rewards. Pass allowUnusualCreator to override.`
      );
    }
  }

  if (creator.equals(authority)) {
    if (allowUnusualCreator) {
      console.warn(
        `[admin-signer] deployCoursePda(${courseId}): OVERRIDE — creatorWallet ${creator58} equals the platform authority; proceeding because allowUnusualCreator=true`
      );
    } else {
      throw new Error(
        `deployCoursePda(${courseId}): creatorWallet ${creator58} equals the platform authority, which must not be the creator-reward recipient. Pass allowUnusualCreator to override.`
      );
    }
  }
}

/**
 * Deploy a new Course PDA on-chain.
 *
 * The authority keypair acts as both the payer and the config.authority.
 * The platform wallet is used as the creator (XP reward recipient for creator rewards).
 * content_tx_id is zeroed — update it later via updateCoursePda when the
 * Arweave transaction ID is known.
 */
export async function deployCoursePda(
  params: CreateCourseAdminParams
): Promise<AdminSignerResult> {
  const { ready } = initialize();
  if (!ready || !_program || !_authority) {
    return {
      success: false,
      error: "Admin signer not configured (PROGRAM_AUTHORITY_SECRET missing)",
    };
  }

  try {
    const [configPDA] = findConfigPDA(getProgramId());
    const [coursePDA] = findCoursePDA(params.courseId, getProgramId());

    const prerequisite =
      params.prerequisitePda != null
        ? new PublicKey(params.prerequisitePda)
        : null;

    // Creator = course.creator (issue #478; finalize_course pays it the creator
    // reward). Required, and on-curve: Course.creator is immutable on-chain and
    // must own the reward ATA, so an off-curve owner (a PDA) is invalid. There is
    // NO platform-authority fallback — a missing, unparseable, or off-curve wallet
    // is a hard error, never a silent mis-mint to the platform key. The route
    // validates this too; this is the defense-in-depth backstop.
    if (!params.creatorWallet) {
      throw new Error(
        `deployCoursePda(${params.courseId}): creatorWallet is required (no platform-authority fallback)`
      );
    }
    let creator: PublicKey;
    try {
      creator = new PublicKey(params.creatorWallet);
    } catch {
      throw new Error(
        `deployCoursePda(${params.courseId}): creatorWallet "${params.creatorWallet}" is not a valid address`
      );
    }
    if (!PublicKey.isOnCurve(creator.toBytes())) {
      throw new Error(
        `deployCoursePda(${params.courseId}): creatorWallet "${params.creatorWallet}" is off-curve`
      );
    }
    // On-curve but still wrong: reject denylisted well-knowns and the platform
    // authority itself (both would mis-mint the creator reward). Opt-out via
    // params.allowUnusualCreator for the deliberate case.
    assertCreatorAllowed(
      creator,
      _authority.publicKey,
      params.courseId,
      params.allowUnusualCreator ?? false
    );

    const onChainParams: CreateCourseOnChainParams =
      buildCreateCourseOnChainParams({
        courseId: params.courseId,
        creator,
        contentTxId: Array(32).fill(0) as number[],
        lessonCount: params.lessonCount,
        difficulty: params.difficulty,
        xpPerLesson: params.xpPerLesson,
        trackId: params.trackId,
        trackLevel: params.trackLevel,
        prerequisite,
        creatorRewardXp: params.creatorRewardXp,
        // Collection is created after the PDA exists; backfilled via updateCoursePda.
        collection: null,
      });

    const methods = _program.methods as unknown as AdminMethods;

    const signature = await methods
      .createCourse(onChainParams)
      .accountsPartial({
        course: coursePDA,
        config: configPDA,
        authority: _authority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return { success: true, signature };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      `[admin-signer] deployCoursePda(${params.courseId}): ${message}`
    );
    return { success: false, error: message };
  }
}

/**
 * Update mutable fields on an existing Course PDA.
 *
 * Only the fields present (non-undefined) in params are applied.
 * Passing undefined for a field leaves it unchanged on-chain (Option::None).
 */
export async function updateCoursePda(
  params: UpdateCourseAdminParams
): Promise<AdminSignerResult> {
  const { ready } = initialize();
  if (!ready || !_program || !_authority) {
    return {
      success: false,
      error: "Admin signer not configured (PROGRAM_AUTHORITY_SECRET missing)",
    };
  }

  try {
    const [configPDA] = findConfigPDA(getProgramId());
    const [coursePDA] = findCoursePDA(params.courseId, getProgramId());

    const onChainParams: UpdateCourseOnChainParams =
      buildUpdateCourseOnChainParams({
        newContentTxId: params.contentTxId ?? null,
        newIsActive: params.newIsActive ?? null,
        newXpPerLesson: params.newXpPerLesson ?? null,
        newCreatorRewardXp: params.newCreatorRewardXp ?? null,
        newCollection:
          params.newCollection != null
            ? new PublicKey(params.newCollection)
            : null,
        // v-next: `new_active_lessons` replaces v1's `new_lesson_count` +
        // `new_min_completions_for_reward`. Encoded BigInt→BN in the builder.
        newActiveLessons: params.newActiveLessons ?? null,
      });

    const methods = _program.methods as unknown as AdminMethods;

    const signature = await methods
      .updateCourse(onChainParams)
      .accountsPartial({
        config: configPDA,
        course: coursePDA,
        authority: _authority.publicKey,
      })
      .rpc();

    return { success: true, signature };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      `[admin-signer] updateCoursePda(${params.courseId}): ${message}`
    );
    return { success: false, error: message };
  }
}

/**
 * DESTRUCTIVE. Close a Course PDA: drains its lamports to the authority, zeroes
 * its data and hands the address back to the System Program.
 *
 * The ONLY caller is the recreate orchestrator (`lib/admin/recreate-course.ts`),
 * which exists to rewrite the create-only fields (`creator`, `difficulty`,
 * `trackId`, `trackLevel`, `prerequisite`) that `update_course` cannot touch.
 * Do not call this on its own: `create_course` CANNOT run in the same
 * transaction (a 0-lamport account is not garbage-collected until the tx ends,
 * so the `init` fails), so between this call and a successful `deployCoursePda`
 * the Course PDA DOES NOT EXIST and `enroll` / `complete_lesson` have no account
 * to read. See the orchestrator for the pre-flight + retry that bound that window.
 *
 * What survives (verified against the program, not just its doc comment):
 *   - Enrollment PDAs are seeded `["enrollment", course_id, learner]` and are
 *     never passed to `close_course` — they are physically untouched. Their
 *     stored `enrollment.course` is the Course PDA, which is derived from
 *     `course_id` alone, so recreating under the SAME course_id reproduces the
 *     IDENTICAL address and the `enrollment.course == course.key()` constraint
 *     in `complete_lesson` / `finalize_course` still holds. Learner lesson_flags,
 *     completed_at and already-minted XP all survive.
 *
 * What does NOT survive (`create_course` hard-resets these — no instruction can
 * restore them):
 *   - `total_completions` / `total_enrollments` → 0. Reset unconditionally by
 *     `create_course`; there is no instruction that can write them back, so a
 *     recreate always loses these two counters. The orchestrator reads and
 *     reports both for operator visibility.
 *   - `is_active` → true, `collection` → default, `content_tx_id` → zeroes.
 *     The orchestrator restores the first two; a re-sync restores the third.
 */
export async function closeCoursePda(
  courseId: string
): Promise<AdminSignerResult> {
  const { ready } = initialize();
  if (!ready || !_program || !_authority) {
    return {
      success: false,
      error: "Admin signer not configured (PROGRAM_AUTHORITY_SECRET missing)",
    };
  }

  try {
    const [configPDA] = findConfigPDA(getProgramId());
    const [coursePDA] = findCoursePDA(courseId, getProgramId());

    const methods = _program.methods as unknown as AdminMethods;

    const signature = await methods
      .closeCourse(courseId)
      .accountsPartial({
        config: configPDA,
        course: coursePDA,
        authority: _authority.publicKey,
      })
      .rpc();

    return { success: true, signature };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[admin-signer] closeCoursePda(${courseId}): ${message}`);
    return { success: false, error: message };
  }
}

/**
 * Deactivate a Course PDA (sets is_active = false).
 *
 * Convenience wrapper around updateCoursePda. The course will no longer
 * accept new enrollments but existing enrollments are unaffected.
 */
export async function deactivateCoursePda(
  courseId: string
): Promise<AdminSignerResult> {
  return updateCoursePda({ courseId, newIsActive: false });
}

/**
 * Set/backfill the Metaplex Core credential collection on a Course PDA.
 *
 * Required before issue_credential/upgrade_credential will succeed — the
 * program binds the track_collection account to course.collection. The
 * per-course collection is created after the PDA, so this runs as a second
 * step in the sync flow.
 */
export async function setCourseCollectionPda(
  courseId: string,
  collectionAddress: string
): Promise<AdminSignerResult> {
  return updateCoursePda({ courseId, newCollection: collectionAddress });
}

/**
 * Deploy a new AchievementType PDA and its Metaplex Core collection on-chain.
 *
 * A fresh collection keypair is generated here — its address is returned in
 * the result as `collectionAddress` for storage in Supabase/Sanity.
 */
export async function deployAchievementType(
  params: CreateAchievementAdminParams
): Promise<DeployAchievementResult> {
  const { ready } = initialize();
  if (!ready || !_program || !_authority) {
    return {
      success: false,
      error: "Admin signer not configured (PROGRAM_AUTHORITY_SECRET missing)",
    };
  }

  try {
    const [configPDA] = findConfigPDA(getProgramId());
    const [achievementTypePDA] = findAchievementTypePDA(
      params.achievementId,
      getProgramId()
    );

    // Fresh collection keypair — this becomes the Metaplex Core collection.
    // The address must be stored after creation so award_achievement can
    // reference it.
    const collectionKeypair = Keypair.generate();

    const onChainParams: CreateAchievementTypeOnChainParams = {
      achievementId: params.achievementId,
      name: params.name,
      metadataUri: params.metadataUri,
      maxSupply: params.maxSupply,
      xpReward: params.xpReward,
    };

    const methods = _program.methods as unknown as AdminMethods;

    const signature = await methods
      .createAchievementType(onChainParams)
      .accountsPartial({
        config: configPDA,
        achievementType: achievementTypePDA,
        collection: collectionKeypair.publicKey,
        authority: _authority.publicKey,
        payer: _authority.publicKey,
        mplCoreProgram: MPL_CORE_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([collectionKeypair])
      .rpc();

    return {
      success: true,
      signature,
      collectionAddress: collectionKeypair.publicKey.toBase58(),
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      `[admin-signer] deployAchievementType(${params.achievementId}): ${message}`
    );
    return { success: false, error: message };
  }
}

/**
 * Create a standalone Metaplex Core collection for a course's credential NFTs.
 *
 * Called immediately after deployCoursePda() succeeds. The collection address
 * is stored in Sanity via writeCourseTrackCollection() and later passed to
 * issue_credential as the track_collection account.
 *
 * The Config PDA is set as updateAuthority so the on-chain program can sign
 * collection-scoped CPI calls using its PDA seeds.
 *
 * Collection creation failure does NOT affect the already-deployed Course PDA.
 * The caller wraps this in try/catch and logs the error for admin retry.
 */
export async function deployCourseTrackCollection(params: {
  courseId: string;
  courseName: string;
  metadataUri: string;
}): Promise<DeployAchievementResult> {
  const { ready } = initialize();
  if (!ready || !_authority) {
    return {
      success: false,
      error: "Admin signer not configured (PROGRAM_AUTHORITY_SECRET missing)",
    };
  }

  try {
    const [configPDA] = findConfigPDA(getProgramId());

    const umi = createUmi(serverEnv.SOLANA_RPC_URL)
      .use(mplCore())
      .use(keypairIdentity(fromWeb3JsKeypair(_authority)));

    const collectionSigner = generateSigner(umi);

    const { signature } = await createCollectionV2(umi, {
      collection: collectionSigner,
      name: `${params.courseName} Credentials`,
      uri: params.metadataUri,
      updateAuthority: fromWeb3JsPublicKey(configPDA),
    }).sendAndConfirm(umi);

    return {
      success: true,
      signature: bs58.encode(signature),
      collectionAddress: collectionSigner.publicKey.toString(),
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      `[admin-signer] deployCourseTrackCollection(${params.courseId}): ${message}`
    );
    return { success: false, error: message };
  }
}

/**
 * Verify that the locally loaded keypair matches the Config PDA's authority.
 *
 * Returns both addresses so the admin dashboard can surface a mismatch
 * (e.g., wrong keypair loaded, or Config was updated via update_config).
 *
 * Returns { matches: false } without addresses if either side is unavailable.
 */
export async function verifyAuthorityMatchesConfig(): Promise<{
  matches: boolean;
  configAuthority?: string;
  localKey?: string;
}> {
  const { ready } = initialize();
  if (!ready || !_connection || !_authority) {
    return { matches: false };
  }

  try {
    const [configPDA] = findConfigPDA(getProgramId());
    const accountInfo = await _connection.getAccountInfo(configPDA);
    if (!accountInfo) {
      return { matches: false };
    }

    // Config layout (after 8-byte discriminator):
    //   authority:      pubkey  [8..40]
    //   backend_signer: pubkey  [40..72]
    //   xp_mint:        pubkey  [72..104]
    //   _reserved:      [u8;8]  [104..112]
    //   bump:           u8      [112]
    const data = accountInfo.data;
    if (data.length < 113) {
      return { matches: false };
    }

    const configAuthority = new PublicKey(data.slice(8, 40));
    const localKey = _authority.publicKey;

    return {
      matches: configAuthority.equals(localKey),
      configAuthority: configAuthority.toBase58(),
      localKey: localKey.toBase58(),
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[admin-signer] verifyAuthorityMatchesConfig: ${message}`);
    return { matches: false };
  }
}
