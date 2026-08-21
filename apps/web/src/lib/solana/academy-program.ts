import "server-only";

import {
  Connection,
  Keypair,
  SystemProgram,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { AnchorError, BN } from "@coral-xyz/anchor";
import bs58 from "bs58";
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountIdempotentInstruction,
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import type { Idl } from "@coral-xyz/anchor";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { serverEnv } from "@/lib/env.server";
import IDL from "./idl/superteam_academy_vnext.json";
import {
  findConfigPDA,
  findCoursePDA,
  findEnrollmentPDA,
  findAchievementTypePDA,
  findAchievementReceiptPDA,
  findMinterRolePDA,
  getProgramId,
} from "./pda";
import { extractCustomErrorCode, resolveIdlError } from "./parse-program-error";
import { fetchCourse } from "./academy-reads";

export { getProgramId } from "./pda";

const MPL_CORE_PROGRAM_ID = new PublicKey(
  "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d"
);

// ---------------------------------------------------------------------------
// Anchor dynamic accessor types
// ---------------------------------------------------------------------------
// Anchor's Program<Idl> does not expose specific account/method names at the
// TS level when the IDL is loaded from JSON. We define a minimal interface so
// the backend-signed instruction wrappers can access accounts and methods
// without resorting to `any`.

interface AccountFetcher {
  fetch(address: PublicKey): Promise<Record<string, unknown>>;
}

interface AcademyAccounts {
  config: AccountFetcher;
  course: AccountFetcher;
  achievementType: AccountFetcher;
}

interface MethodBuilder {
  accountsPartial(accounts: Record<string, PublicKey>): MethodBuilder;
  preInstructions(ixs: TransactionInstruction[]): MethodBuilder;
  signers(signers: Keypair[]): MethodBuilder;
  rpc(): Promise<string>;
  transaction(): Promise<Transaction>;
}

interface AcademyMethods {
  completeLesson(lessonIndex: number): MethodBuilder;
  finalizeCourse(): MethodBuilder;
  issueCredential(
    name: string,
    uri: string,
    coursesCompleted: number,
    totalXp: BN
  ): MethodBuilder;
  awardAchievement(): MethodBuilder;
  rewardXp(amount: BN, memo: string): MethodBuilder;
}

// ---------------------------------------------------------------------------
// Layer 2: Setup — server-only lazy singletons
// ---------------------------------------------------------------------------

let _connection: Connection | null = null;

export function getConnection(): Connection {
  if (_connection) return _connection;
  _connection = new Connection(serverEnv.SOLANA_RPC_URL, "confirmed");
  return _connection;
}

let _backendSigner: Keypair | null = null;

export function getBackendSigner(): Keypair {
  if (_backendSigner) return _backendSigner;
  const secret = serverEnv.BACKEND_SIGNER_SECRET;
  if (!secret) {
    throw new Error(
      "BACKEND_SIGNER_SECRET env var not set. Required for on-chain instructions."
    );
  }
  const parsed: unknown = JSON.parse(secret);
  if (!Array.isArray(parsed) || parsed.length !== 64) {
    throw new Error("BACKEND_SIGNER_SECRET must be a 64-element JSON array");
  }
  const secretKey = Uint8Array.from(parsed as number[]);
  _backendSigner = Keypair.fromSecretKey(secretKey);
  return _backendSigner;
}

let _serverProgram: Program | null = null;

export function getProgram(): Program {
  if (_serverProgram) return _serverProgram;
  const connection = getConnection();
  const signer = getBackendSigner();
  const provider = new AnchorProvider(connection, new NodeWallet(signer), {
    commitment: "confirmed",
  });
  // Target the env-configured program id, not the IDL's committed canonical
  // address — so pointing NEXT_PUBLIC_PROGRAM_ID at a fresh devnet instance
  // targets that program (matching the getProgramId()-derived PDAs) instead of
  // the hardcoded upstream id.
  _serverProgram = new Program(
    { ...(IDL as unknown as Idl), address: getProgramId().toBase58() },
    provider
  );
  return _serverProgram;
}

// ---------------------------------------------------------------------------
// Deployment check — cached permanently after first true
// ---------------------------------------------------------------------------

let _programLive: boolean | null = null;
let _programLiveCheckedAt = 0;
const CACHE_TTL = 60_000;

export async function isOnChainProgramLive(): Promise<boolean> {
  if (_programLive === true) return true;

  if (_programLive !== null && Date.now() - _programLiveCheckedAt < CACHE_TTL) {
    return _programLive;
  }

  try {
    const connection = getConnection();
    const [configPDA] = findConfigPDA(getProgramId());
    const account = await connection.getAccountInfo(configPDA);
    _programLive = account !== null;
  } catch {
    // RPC failure — assume program is not live; re-checked after TTL
    _programLive = false;
  }
  _programLiveCheckedAt = Date.now();
  return _programLive;
}

// ---------------------------------------------------------------------------
// Layer 3a: Backend-signed instructions — server-only
// ---------------------------------------------------------------------------

export async function completeLesson(
  courseId: string,
  learner: PublicKey,
  lessonIndex: number
): Promise<string> {
  const program = getProgram();
  const signer = getBackendSigner();
  const [configPDA] = findConfigPDA(program.programId);
  const [coursePDA] = findCoursePDA(courseId, program.programId);
  const [enrollmentPDA] = findEnrollmentPDA(
    courseId,
    learner,
    program.programId
  );

  const accounts = program.account as unknown as AcademyAccounts;
  const methods = program.methods as unknown as AcademyMethods;

  const config = await accounts.config.fetch(configPDA);
  const xpMint = config.xpMint as PublicKey;

  const learnerTokenAccount = getAssociatedTokenAddressSync(
    xpMint,
    learner,
    false,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  // Ensure the learner's XP token account exists before calling completeLesson.
  // The program constraint checks `learner_token_account.owner == spl_token_2022`,
  // so the ATA must be initialized. The idempotent variant is a no-op if it
  // already exists, making this safe to include unconditionally.
  const createAtaIx = createAssociatedTokenAccountIdempotentInstruction(
    signer.publicKey,
    learnerTokenAccount,
    learner,
    xpMint,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const sig = await methods
    .completeLesson(lessonIndex)
    .preInstructions([createAtaIx])
    .accountsPartial({
      config: configPDA,
      course: coursePDA,
      enrollment: enrollmentPDA,
      learner: learner,
      learnerTokenAccount: learnerTokenAccount,
      xpMint: xpMint,
      backendSigner: signer.publicKey,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
    })
    .rpc();

  return sig;
}

export async function finalizeCourse(
  courseId: string,
  learner: PublicKey
): Promise<string> {
  const program = getProgram();
  const signer = getBackendSigner();
  const [configPDA] = findConfigPDA(program.programId);
  const [coursePDA] = findCoursePDA(courseId, program.programId);
  const [enrollmentPDA] = findEnrollmentPDA(
    courseId,
    learner,
    program.programId
  );

  const accounts = program.account as unknown as AcademyAccounts;
  const methods = program.methods as unknown as AcademyMethods;

  const config = await accounts.config.fetch(configPDA);
  // Length-aware decode (fetchCourse) instead of the typed
  // accounts.course.fetch(): during the mixed-fleet reset window some Course
  // accounts are still 224-byte v1 and others are recreated 253-byte
  // v-next, and the v-next-bound Anchor Program's typed fetch throws a
  // borsh under-run on a v1 account. finalizeCourse only needs `creator`,
  // which fetchCourse normalises across both layouts.
  const course = await fetchCourse(
    courseId,
    program.provider.connection,
    program.programId
  );
  if (!course) {
    throw new Error(
      `finalizeCourse: Course account not found for courseId "${courseId}"`
    );
  }
  const xpMint = config.xpMint as PublicKey;
  const creator = course.creator;

  const learnerTokenAccount = getAssociatedTokenAddressSync(
    xpMint,
    learner,
    false,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const creatorTokenAccount = getAssociatedTokenAddressSync(
    xpMint,
    creator,
    false,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  // Ensure both token accounts exist before finalization (same owner constraint as completeLesson).
  const createLearnerAtaIx = createAssociatedTokenAccountIdempotentInstruction(
    signer.publicKey,
    learnerTokenAccount,
    learner,
    xpMint,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  const createCreatorAtaIx = createAssociatedTokenAccountIdempotentInstruction(
    signer.publicKey,
    creatorTokenAccount,
    creator,
    xpMint,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const sig = await methods
    .finalizeCourse()
    .preInstructions([createLearnerAtaIx, createCreatorAtaIx])
    .accountsPartial({
      config: configPDA,
      course: coursePDA,
      enrollment: enrollmentPDA,
      learner: learner,
      learnerTokenAccount: learnerTokenAccount,
      creatorTokenAccount: creatorTokenAccount,
      creator: creator,
      xpMint: xpMint,
      backendSigner: signer.publicKey,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
    })
    .rpc();

  return sig;
}

export async function issueCredential(
  courseId: string,
  learner: PublicKey,
  credentialName: string,
  metadataUri: string,
  coursesCompleted: number,
  totalXp: number,
  trackCollection: PublicKey
): Promise<{ signature: string; mintAddress: PublicKey }> {
  const program = getProgram();
  const signer = getBackendSigner();
  const [configPDA] = findConfigPDA(program.programId);
  const [coursePDA] = findCoursePDA(courseId, program.programId);
  const [enrollmentPDA] = findEnrollmentPDA(
    courseId,
    learner,
    program.programId
  );

  const credentialAsset = Keypair.generate();

  const methods = program.methods as unknown as AcademyMethods;

  const sig = await methods
    .issueCredential(
      credentialName,
      metadataUri,
      coursesCompleted,
      new BN(totalXp)
    )
    .accountsPartial({
      config: configPDA,
      course: coursePDA,
      enrollment: enrollmentPDA,
      learner: learner,
      credentialAsset: credentialAsset.publicKey,
      trackCollection: trackCollection,
      payer: signer.publicKey,
      backendSigner: signer.publicKey,
      mplCoreProgram: MPL_CORE_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .signers([credentialAsset])
    .rpc();

  return { signature: sig, mintAddress: credentialAsset.publicKey };
}

/**
 * Turn a thrown backend-signed transaction error into a concise, safe,
 * human-readable reason. Resolves Anchor custom program codes against the IDL
 * (e.g. `MintingPaused`, backend-signer constraint) and detects the common
 * infra failures that otherwise look identical (unfunded payer, missing signer,
 * expired blockhash). Falls back to the raw message. Safe to surface to the
 * caller — it exposes program/operational state, never user data.
 */
export function describeProgramError(err: unknown): string {
  // Anchor decodes its own program errors into AnchorError.
  if (err instanceof AnchorError) {
    const { errorCode, errorMessage } = err.error;
    return `${errorCode.code} (${errorCode.number}): ${errorMessage}`;
  }

  const message = err instanceof Error ? err.message : String(err);
  const logs = (err as { logs?: unknown })?.logs;
  const logLines = Array.isArray(logs) ? (logs as string[]) : [];

  // A raw custom-error code in the tx logs -> resolve against the IDL.
  const code = extractCustomErrorCode(logLines);
  if (code !== null) {
    const resolved = resolveIdlError(code, IDL as unknown as Idl);
    if (resolved) return `${resolved.name} (${resolved.code}): ${resolved.msg}`;
  }

  const haystack = [message, ...logLines].join("\n");
  if (
    /insufficient lamports|insufficient funds|Attempt to debit/i.test(haystack)
  ) {
    return "Backend signer wallet has insufficient SOL to pay for the mint";
  }
  if (/BACKEND_SIGNER_SECRET/.test(message)) {
    return "BACKEND_SIGNER_SECRET is not configured on the server";
  }
  if (/blockhash not found|block height exceeded/i.test(haystack)) {
    return "Transaction expired (blockhash) — please retry";
  }
  return message.slice(0, 300);
}

export async function awardAchievement(
  achievementId: string,
  recipient: PublicKey
): Promise<{ signature: string; assetAddress: PublicKey }> {
  const program = getProgram();
  const signer = getBackendSigner();
  const [configPDA] = findConfigPDA(program.programId);
  const [achievementTypePDA] = findAchievementTypePDA(
    achievementId,
    program.programId
  );
  const [minterRolePDA] = findMinterRolePDA(
    signer.publicKey,
    program.programId
  );

  const accounts = program.account as unknown as AcademyAccounts;
  const methods = program.methods as unknown as AcademyMethods;

  const config = await accounts.config.fetch(configPDA);
  const achievementType =
    await accounts.achievementType.fetch(achievementTypePDA);
  const xpMint = config.xpMint as PublicKey;
  const collection = achievementType.collection as PublicKey;

  const recipientTokenAccount = getAssociatedTokenAddressSync(
    xpMint,
    recipient,
    false,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const assetKeypair = Keypair.generate();

  const [achievementReceiptPDA] = findAchievementReceiptPDA(
    achievementId,
    recipient,
    program.programId
  );

  const createRecipientAtaIx =
    createAssociatedTokenAccountIdempotentInstruction(
      signer.publicKey,
      recipientTokenAccount,
      recipient,
      xpMint,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

  const sig = await methods
    .awardAchievement()
    .preInstructions([createRecipientAtaIx])
    .accountsPartial({
      config: configPDA,
      achievementType: achievementTypePDA,
      achievementReceipt: achievementReceiptPDA,
      minterRole: minterRolePDA,
      asset: assetKeypair.publicKey,
      collection: collection,
      recipient: recipient,
      recipientTokenAccount: recipientTokenAccount,
      xpMint: xpMint,
      payer: signer.publicKey,
      minter: signer.publicKey,
      backendSigner: signer.publicKey,
      mplCoreProgram: MPL_CORE_PROGRAM_ID,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .signers([assetKeypair])
    .rpc();

  return { signature: sig, assetAddress: assetKeypair.publicKey };
}

/** A reward_xp transaction that is fully signed but not yet broadcast. */
export interface SignedRewardXpTx {
  /** The transaction's final signature — known BEFORE anything is sent. */
  signature: string;
  /** The exact signed bytes. Re-sending these is idempotent on Solana. */
  rawTransaction: Buffer;
  blockhash: string;
  lastValidBlockHeight: number;
}

// reward_xp has no receipt PDA and no nonce, so the chain cannot tell a retry
// from a second award — the ONLY thing that makes a re-send safe is sending the
// same already-signed bytes. That is why building/signing and sending are split
// here: a caller can learn the signature, durably reserve it, and only then
// broadcast. Never rebuild a reward_xp transaction to "retry" it; a fresh
// blockhash produces a fresh signature and mints again.
export async function buildSignedRewardXpTx(
  recipient: PublicKey,
  amount: number,
  memo: string
): Promise<SignedRewardXpTx> {
  const connection = getConnection();
  const { transaction, signer } = await buildRewardXpTransaction(
    recipient,
    amount,
    memo
  );

  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash("confirmed");
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = signer.publicKey;
  transaction.sign(signer);

  const signature = transaction.signature;
  if (!signature) {
    throw new Error("reward_xp transaction failed to sign");
  }

  return {
    signature: bs58.encode(signature),
    rawTransaction: transaction.serialize(),
    blockhash,
    lastValidBlockHeight,
  };
}

// Thrown when the broadcast itself was REJECTED — the transaction never reached
// the cluster. Node rejection, a preflight revert (on-chain `MintingPaused`,
// a deactivated minter), or a socket error all land here. The distinction
// matters to callers that reserved the signature before sending: nothing
// happened on-chain, so the reservation can safely be released and retried.
// A failure from confirmTransaction is deliberately NOT this error — that case
// is ambiguous (the transaction may well have landed) and must keep its claim.
export class TransactionNotBroadcastError extends Error {
  constructor(
    readonly signature: string,
    readonly cause: unknown
  ) {
    super(
      `reward_xp transaction ${signature} was never broadcast: ${
        cause instanceof Error ? cause.message : String(cause)
      }`
    );
    this.name = "TransactionNotBroadcastError";
  }
}

// Broadcast an already-signed transaction and wait for confirmation. `maxRetries`
// makes the RPC node rebroadcast the SAME bytes until blockhash expiry, so a
// dropped packet never produces a second signature.
export async function sendSignedTransaction(
  tx: SignedRewardXpTx
): Promise<void> {
  const connection = getConnection();
  try {
    await connection.sendRawTransaction(tx.rawTransaction, { maxRetries: 5 });
  } catch (err) {
    // Nothing reached the cluster — safe to unwind and retry from scratch.
    throw new TransactionNotBroadcastError(tx.signature, err);
  }
  const result = await connection.confirmTransaction(
    {
      signature: tx.signature,
      blockhash: tx.blockhash,
      lastValidBlockHeight: tx.lastValidBlockHeight,
    },
    "confirmed"
  );
  if (result.value.err) {
    throw new Error(
      `reward_xp transaction ${tx.signature} failed: ${JSON.stringify(result.value.err)}`
    );
  }
}

async function buildRewardXpTransaction(
  recipient: PublicKey,
  amount: number,
  memo: string
): Promise<{ transaction: Transaction; signer: Keypair }> {
  const program = getProgram();
  const signer = getBackendSigner();
  const [configPDA] = findConfigPDA(program.programId);
  const [minterRolePDA] = findMinterRolePDA(
    signer.publicKey,
    program.programId
  );

  const accounts = program.account as unknown as AcademyAccounts;
  const methods = program.methods as unknown as AcademyMethods;

  const config = await accounts.config.fetch(configPDA);
  const xpMint = config.xpMint as PublicKey;

  const recipientTokenAccount = getAssociatedTokenAddressSync(
    xpMint,
    recipient,
    false,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const createAtaIx = createAssociatedTokenAccountIdempotentInstruction(
    signer.publicKey,
    recipientTokenAccount,
    recipient,
    xpMint,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const transaction = await methods
    .rewardXp(new BN(amount), memo)
    .preInstructions([createAtaIx])
    .accountsPartial({
      config: configPDA,
      minterRole: minterRolePDA,
      xpMint: xpMint,
      recipientTokenAccount: recipientTokenAccount,
      minter: signer.publicKey,
      backendSigner: signer.publicKey,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
    })
    .transaction();

  return { transaction, signer };
}
