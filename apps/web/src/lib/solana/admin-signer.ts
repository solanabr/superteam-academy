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
import "server-only";

import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  clusterApiUrl,
} from "@solana/web3.js";
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
import IDL from "./idl/superteam_academy.json";
import {
  findConfigPDA,
  findCoursePDA,
  findAchievementTypePDA,
  PROGRAM_ID,
} from "./pda";

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
  createAchievementType(
    params: CreateAchievementTypeOnChainParams
  ): MethodBuilder;
}

// Raw on-chain param shapes that mirror the Rust structs exactly.
// These are separate from the public API params — the public API params
// use friendlier names and get mapped here before being sent.

interface CreateCourseOnChainParams {
  courseId: string;
  creator: PublicKey;
  contentTxId: number[];
  lessonCount: number;
  difficulty: number;
  xpPerLesson: number;
  trackId: number;
  trackLevel: number;
  prerequisite: PublicKey | null;
  creatorRewardXp: number;
  minCompletionsForReward: number;
}

interface UpdateCourseOnChainParams {
  newContentTxId: number[] | null;
  newIsActive: boolean | null;
  newXpPerLesson: number | null;
  newCreatorRewardXp: number | null;
  newMinCompletionsForReward: number | null;
}

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
  minCompletionsForReward: number;
}

export interface UpdateCourseAdminParams {
  courseId: string;
  newXpPerLesson?: number;
  newIsActive?: boolean;
  newCreatorRewardXp?: number;
  newMinCompletionsForReward?: number;
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

  const rpcUrl =
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? clusterApiUrl("devnet");
  _connection = new Connection(rpcUrl, "confirmed");

  const authoritySecret = process.env.PROGRAM_AUTHORITY_SECRET;
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
  _program = new Program(IDL as unknown as Idl, provider);

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
    const [configPDA] = findConfigPDA(PROGRAM_ID);
    const [coursePDA] = findCoursePDA(params.courseId, PROGRAM_ID);

    const prerequisite =
      params.prerequisitePda != null
        ? new PublicKey(params.prerequisitePda)
        : null;

    const onChainParams: CreateCourseOnChainParams = {
      courseId: params.courseId,
      creator: _authority.publicKey,
      contentTxId: Array(32).fill(0) as number[],
      lessonCount: params.lessonCount,
      difficulty: params.difficulty,
      xpPerLesson: params.xpPerLesson,
      trackId: params.trackId,
      trackLevel: params.trackLevel,
      prerequisite,
      creatorRewardXp: params.creatorRewardXp,
      minCompletionsForReward: params.minCompletionsForReward,
    };

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
    const [configPDA] = findConfigPDA(PROGRAM_ID);
    const [coursePDA] = findCoursePDA(params.courseId, PROGRAM_ID);

    const onChainParams: UpdateCourseOnChainParams = {
      newContentTxId: null,
      newIsActive: params.newIsActive ?? null,
      newXpPerLesson: params.newXpPerLesson ?? null,
      newCreatorRewardXp: params.newCreatorRewardXp ?? null,
      newMinCompletionsForReward: params.newMinCompletionsForReward ?? null,
    };

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
    const [configPDA] = findConfigPDA(PROGRAM_ID);
    const [achievementTypePDA] = findAchievementTypePDA(
      params.achievementId,
      PROGRAM_ID
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
    const rpcUrl =
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? clusterApiUrl("devnet");
    const [configPDA] = findConfigPDA(PROGRAM_ID);

    const umi = createUmi(rpcUrl)
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
    const [configPDA] = findConfigPDA(PROGRAM_ID);
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
