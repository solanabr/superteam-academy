import "server-only";

import {
  Connection,
  Keypair,
  SystemProgram,
  PublicKey,
  clusterApiUrl,
} from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import {
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import type { Idl } from "@coral-xyz/anchor";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import IDL from "./idl/superteam_academy.json";
import {
  findConfigPDA,
  findCoursePDA,
  findEnrollmentPDA,
  findAchievementTypePDA,
  findAchievementReceiptPDA,
  findMinterRolePDA,
  PROGRAM_ID,
} from "./pda";

export { PROGRAM_ID } from "./pda";

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
  signers(signers: Keypair[]): MethodBuilder;
  rpc(): Promise<string>;
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
}

// ---------------------------------------------------------------------------
// Layer 2: Setup — server-only lazy singletons
// ---------------------------------------------------------------------------

let _connection: Connection | null = null;

export function getConnection(): Connection {
  if (_connection) return _connection;
  const rpcUrl =
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? clusterApiUrl("devnet");
  _connection = new Connection(rpcUrl, "confirmed");
  return _connection;
}

let _backendSigner: Keypair | null = null;

export function getBackendSigner(): Keypair {
  if (_backendSigner) return _backendSigner;
  const secret = process.env.BACKEND_SIGNER_SECRET;
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
  _serverProgram = new Program(IDL as unknown as Idl, provider);
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

  const connection = getConnection();
  const [configPDA] = findConfigPDA(PROGRAM_ID);
  const account = await connection.getAccountInfo(configPDA);
  _programLive = account !== null;
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

  const sig = await methods
    .completeLesson(lessonIndex)
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
  const course = await accounts.course.fetch(coursePDA);
  const xpMint = config.xpMint as PublicKey;
  const creator = course.creator as PublicKey;

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

  const sig = await methods
    .finalizeCourse()
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

  const MPL_CORE_PROGRAM_ID = new PublicKey(
    "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d"
  );

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

  const MPL_CORE_PROGRAM_ID = new PublicKey(
    "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d"
  );

  const [achievementReceiptPDA] = findAchievementReceiptPDA(
    achievementId,
    recipient,
    program.programId
  );

  const sig = await methods
    .awardAchievement()
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
      mplCoreProgram: MPL_CORE_PROGRAM_ID,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .signers([assetKeypair])
    .rpc();

  return { signature: sig, assetAddress: assetKeypair.publicKey };
}
