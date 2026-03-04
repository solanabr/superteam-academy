import { createHash } from "crypto";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  ACADEMY_PROGRAM_ID,
  MPL_CORE_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
} from "@/lib/onchain/constants";
import {
  deriveAchievementReceiptPda,
  deriveAchievementTypePda,
  deriveConfigPda,
  deriveCoursePda,
  deriveEnrollmentPda,
  deriveMinterRolePda,
} from "@/lib/onchain/pdas";

const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey(
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
);
const DEFAULT_RPC_URL = "https://api.devnet.solana.com";

class BackendBridgeTxError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status = 500) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

function rpcUrl(): string {
  return (
    process.env.SOLANA_RPC_URL ||
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
    DEFAULT_RPC_URL
  );
}

function anchorIxDiscriminator(name: string): Buffer {
  const hash = createHash("sha256")
    .update(`global:${name}`)
    .digest();
  return hash.subarray(0, 8);
}

function encodeU8(value: number): Buffer {
  if (!Number.isInteger(value) || value < 0 || value > 255) {
    throw new BackendBridgeTxError(
      "INVALID_U8",
      "Instruction argument is not a valid u8.",
      400
    );
  }
  return Buffer.from([value]);
}

function encodeU32(value: number): Buffer {
  if (!Number.isInteger(value) || value < 0 || value > 0xffffffff) {
    throw new BackendBridgeTxError(
      "INVALID_U32",
      "Instruction argument is not a valid u32.",
      400
    );
  }
  const out = Buffer.alloc(4);
  out.writeUInt32LE(value);
  return out;
}

function encodeU64(value: number | bigint): Buffer {
  const n = BigInt(value);
  if (n < 0n || n > 0xffffffffffffffffn) {
    throw new BackendBridgeTxError(
      "INVALID_U64",
      "Instruction argument is not a valid u64.",
      400
    );
  }
  const out = Buffer.alloc(8);
  out.writeBigUInt64LE(n);
  return out;
}

function encodeString(value: string): Buffer {
  const bytes = Buffer.from(value, "utf8");
  return Buffer.concat([encodeU32(bytes.length), bytes]);
}

function decodeConfigAccount(data: Buffer): {
  backendSigner: PublicKey;
  xpMint: PublicKey;
} {
  // 8 discriminator + authority(32) + backend_signer(32) + xp_mint(32) + ...
  if (data.length < 8 + 32 + 32 + 32) {
    throw new BackendBridgeTxError(
      "CONFIG_DECODE_FAILED",
      "Config account is too small.",
      500
    );
  }
  const backendSigner = new PublicKey(data.subarray(40, 72));
  const xpMint = new PublicKey(data.subarray(72, 104));
  return { backendSigner, xpMint };
}

function decodeCourseCreator(data: Buffer): {
  courseId: string;
  creator: PublicKey;
} {
  // Anchor account discriminator (8) + String (u32 len + bytes) + creator pubkey (32)
  if (data.length < 8 + 4 + 32) {
    throw new BackendBridgeTxError(
      "COURSE_DECODE_FAILED",
      "Course account is too small.",
      500
    );
  }

  const idLen = data.readUInt32LE(8);
  const idStart = 12;
  const idEnd = idStart + idLen;
  const creatorStart = idEnd;
  const creatorEnd = creatorStart + 32;

  if (idLen > 256 || creatorEnd > data.length) {
    throw new BackendBridgeTxError(
      "COURSE_DECODE_FAILED",
      "Course account has invalid layout.",
      500
    );
  }

  const courseId = data.subarray(idStart, idEnd).toString("utf8");
  const creator = new PublicKey(data.subarray(creatorStart, creatorEnd));
  return { courseId, creator };
}

function decodeEnrollmentCredentialAsset(data: Buffer): PublicKey | null {
  // 8 discriminator + 32 course + 8 enrolled_at + 1+8 completed_at + 32 lesson_flags
  const optionTagOffset = 89;
  if (data.length <= optionTagOffset) {
    throw new BackendBridgeTxError(
      "ENROLLMENT_DECODE_FAILED",
      "Enrollment account is too small.",
      500
    );
  }

  const tag = data[optionTagOffset];
  if (tag === 0) {
    return null;
  }
  if (tag !== 1 || data.length < optionTagOffset + 1 + 32) {
    throw new BackendBridgeTxError(
      "ENROLLMENT_DECODE_FAILED",
      "Enrollment credential asset option is malformed.",
      500
    );
  }

  return new PublicKey(data.subarray(optionTagOffset + 1, optionTagOffset + 33));
}

function decodeAnchorString(
  data: Buffer,
  offset: number
): { value: string; nextOffset: number } {
  if (offset + 4 > data.length) {
    throw new BackendBridgeTxError(
      "ACCOUNT_DECODE_FAILED",
      "Account string length prefix is out of bounds.",
      500
    );
  }
  const len = data.readUInt32LE(offset);
  const start = offset + 4;
  const end = start + len;
  if (len > 1024 || end > data.length) {
    throw new BackendBridgeTxError(
      "ACCOUNT_DECODE_FAILED",
      "Account string field has invalid length.",
      500
    );
  }
  return {
    value: data.subarray(start, end).toString("utf8"),
    nextOffset: end,
  };
}

function decodeAchievementTypeAccount(data: Buffer): {
  achievementId: string;
  collection: PublicKey;
  xpReward: number;
  isActive: boolean;
} {
  if (data.length < 8 + 4 + 32 + 4 + 64 + 4 + 128 + 32 + 32 + 4 + 4 + 4 + 1) {
    throw new BackendBridgeTxError(
      "ACHIEVEMENT_DECODE_FAILED",
      "AchievementType account is too small.",
      500
    );
  }

  const id = decodeAnchorString(data, 8);
  const name = decodeAnchorString(data, id.nextOffset);
  const uri = decodeAnchorString(data, name.nextOffset);
  const collectionStart = uri.nextOffset;
  const collectionEnd = collectionStart + 32;
  const creatorEnd = collectionEnd + 32;
  const maxSupplyEnd = creatorEnd + 4;
  const currentSupplyEnd = maxSupplyEnd + 4;
  const xpRewardEnd = currentSupplyEnd + 4;
  const isActiveOffset = xpRewardEnd;

  if (xpRewardEnd > data.length || isActiveOffset >= data.length) {
    throw new BackendBridgeTxError(
      "ACHIEVEMENT_DECODE_FAILED",
      "AchievementType account has invalid layout.",
      500
    );
  }

  return {
    achievementId: id.value,
    collection: new PublicKey(data.subarray(collectionStart, collectionEnd)),
    xpReward: data.readUInt32LE(currentSupplyEnd),
    isActive: data[isActiveOffset] === 1,
  };
}

function decodeMinterRoleAccount(data: Buffer): {
  minter: PublicKey;
  isActive: boolean;
} {
  if (data.length < 8 + 32 + 4 + 8 + 8 + 1) {
    throw new BackendBridgeTxError(
      "MINTER_ROLE_DECODE_FAILED",
      "MinterRole account is too small.",
      500
    );
  }

  const minter = new PublicKey(data.subarray(8, 40));
  const label = decodeAnchorString(data, 40);
  const maxXpStart = label.nextOffset;
  const totalXpStart = maxXpStart + 8;
  const isActiveOffset = totalXpStart + 8;

  if (isActiveOffset >= data.length) {
    throw new BackendBridgeTxError(
      "MINTER_ROLE_DECODE_FAILED",
      "MinterRole account has invalid layout.",
      500
    );
  }

  return {
    minter,
    isActive: data[isActiveOffset] === 1,
  };
}

function resolveTrackCollection(trackCollection?: string): PublicKey {
  const candidate =
    trackCollection ||
    process.env.NEXT_PUBLIC_CREDENTIAL_COLLECTION ||
    process.env.CREDENTIAL_TRACK_COLLECTION;
  if (!candidate) {
    throw new BackendBridgeTxError(
      "TRACK_COLLECTION_MISSING",
      "track collection address is required (payload or env).",
      400
    );
  }
  try {
    return new PublicKey(candidate);
  } catch {
    throw new BackendBridgeTxError(
      "TRACK_COLLECTION_INVALID",
      "track collection address is invalid.",
      400
    );
  }
}

function deriveToken2022Ata(owner: PublicKey, mint: PublicKey): PublicKey {
  const [ata] = PublicKey.findProgramAddressSync(
    [owner.toBuffer(), TOKEN_2022_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  return ata;
}

async function requireToken2022Account(
  connection: Connection,
  account: PublicKey,
  label: string
): Promise<void> {
  const info = await connection.getAccountInfo(account, "confirmed");
  if (!info) {
    throw new BackendBridgeTxError(
      "TOKEN_ACCOUNT_MISSING",
      `${label} token account does not exist.`,
      400
    );
  }
  if (!info.owner.equals(TOKEN_2022_PROGRAM_ID)) {
    throw new BackendBridgeTxError(
      "TOKEN_ACCOUNT_INVALID_OWNER",
      `${label} token account is not owned by Token-2022 program.`,
      400
    );
  }
}

async function loadConfigState(
  connection: Connection,
  backendSigner: Keypair
): Promise<{ configPda: PublicKey; xpMint: PublicKey }> {
  const [configPda] = deriveConfigPda();
  const info = await connection.getAccountInfo(configPda, "confirmed");
  if (!info) {
    throw new BackendBridgeTxError(
      "CONFIG_NOT_FOUND",
      "Config PDA not found on chain.",
      400
    );
  }
  if (!info.owner.equals(ACADEMY_PROGRAM_ID)) {
    throw new BackendBridgeTxError(
      "CONFIG_OWNER_INVALID",
      "Config PDA owner does not match academy program.",
      400
    );
  }

  const decoded = decodeConfigAccount(info.data);
  if (!decoded.backendSigner.equals(backendSigner.publicKey)) {
    throw new BackendBridgeTxError(
      "BACKEND_SIGNER_MISMATCH",
      "Backend signer does not match on-chain Config.backend_signer.",
      400
    );
  }

  return { configPda, xpMint: decoded.xpMint };
}

async function loadCourseCreator(
  connection: Connection,
  coursePda: PublicKey
): Promise<PublicKey> {
  const info = await connection.getAccountInfo(coursePda, "confirmed");
  if (!info) {
    throw new BackendBridgeTxError(
      "COURSE_NOT_FOUND",
      "Course PDA not found on chain.",
      400
    );
  }
  if (!info.owner.equals(ACADEMY_PROGRAM_ID)) {
    throw new BackendBridgeTxError(
      "COURSE_OWNER_INVALID",
      "Course PDA owner does not match academy program.",
      400
    );
  }

  const decoded = decodeCourseCreator(info.data);
  return decoded.creator;
}

async function loadEnrollmentCredentialAsset(
  connection: Connection,
  enrollmentPda: PublicKey
): Promise<PublicKey | null> {
  const info = await connection.getAccountInfo(enrollmentPda, "confirmed");
  if (!info) {
    throw new BackendBridgeTxError(
      "ENROLLMENT_NOT_FOUND",
      "Enrollment PDA not found on chain.",
      400
    );
  }
  if (!info.owner.equals(ACADEMY_PROGRAM_ID)) {
    throw new BackendBridgeTxError(
      "ENROLLMENT_OWNER_INVALID",
      "Enrollment PDA owner does not match academy program.",
      400
    );
  }
  return decodeEnrollmentCredentialAsset(info.data);
}

async function loadAchievementTypeState(
  connection: Connection,
  achievementTypePda: PublicKey,
  expectedAchievementId: string
): Promise<{ collection: PublicKey; xpReward: number; isActive: boolean }> {
  const info = await connection.getAccountInfo(achievementTypePda, "confirmed");
  if (!info) {
    throw new BackendBridgeTxError(
      "ACHIEVEMENT_NOT_FOUND",
      "AchievementType PDA not found on chain.",
      400
    );
  }
  if (!info.owner.equals(ACADEMY_PROGRAM_ID)) {
    throw new BackendBridgeTxError(
      "ACHIEVEMENT_OWNER_INVALID",
      "AchievementType PDA owner does not match academy program.",
      400
    );
  }

  const decoded = decodeAchievementTypeAccount(info.data);
  if (decoded.achievementId !== expectedAchievementId) {
    throw new BackendBridgeTxError(
      "ACHIEVEMENT_ID_MISMATCH",
      "AchievementType account achievement_id does not match request.",
      400
    );
  }
  return {
    collection: decoded.collection,
    xpReward: decoded.xpReward,
    isActive: decoded.isActive,
  };
}

async function loadMinterRoleState(
  connection: Connection,
  minterRolePda: PublicKey,
  expectedMinter: PublicKey
): Promise<{ isActive: boolean }> {
  const info = await connection.getAccountInfo(minterRolePda, "confirmed");
  if (!info) {
    throw new BackendBridgeTxError(
      "MINTER_ROLE_NOT_FOUND",
      "MinterRole PDA not found for backend signer.",
      400
    );
  }
  if (!info.owner.equals(ACADEMY_PROGRAM_ID)) {
    throw new BackendBridgeTxError(
      "MINTER_ROLE_OWNER_INVALID",
      "MinterRole PDA owner does not match academy program.",
      400
    );
  }

  const decoded = decodeMinterRoleAccount(info.data);
  if (!decoded.minter.equals(expectedMinter)) {
    throw new BackendBridgeTxError(
      "MINTER_ROLE_MISMATCH",
      "MinterRole account minter does not match backend signer.",
      400
    );
  }

  return { isActive: decoded.isActive };
}

async function sendBackendSignedTransaction(
  connection: Connection,
  signers: Keypair[],
  instruction: TransactionInstruction
): Promise<string> {
  if (signers.length === 0) {
    throw new BackendBridgeTxError("NO_SIGNERS", "No signers provided.", 500);
  }
  const feePayer = signers[0].publicKey;
  const latest = await connection.getLatestBlockhash("confirmed");
  const tx = new Transaction({
    feePayer,
    blockhash: latest.blockhash,
    lastValidBlockHeight: latest.lastValidBlockHeight,
  }).add(instruction);

  tx.sign(...signers);

  const signature = await connection.sendRawTransaction(tx.serialize(), {
    skipPreflight: false,
    maxRetries: 3,
    preflightCommitment: "confirmed",
  });

  const confirmation = await connection.confirmTransaction(
    {
      signature,
      blockhash: latest.blockhash,
      lastValidBlockHeight: latest.lastValidBlockHeight,
    },
    "confirmed"
  );

  if (confirmation.value.err) {
    throw new BackendBridgeTxError(
      "TX_CONFIRMATION_FAILED",
      `Transaction failed: ${JSON.stringify(confirmation.value.err)}`,
      500
    );
  }

  return signature;
}

function encodeIssueOrUpgradeCredentialData(params: {
  ixName: "issue_credential" | "upgrade_credential";
  credentialName: string;
  metadataUri: string;
  coursesCompleted: number;
  totalXp: number;
}): Buffer {
  return Buffer.concat([
    anchorIxDiscriminator(params.ixName),
    encodeString(params.credentialName),
    encodeString(params.metadataUri),
    encodeU32(params.coursesCompleted),
    encodeU64(params.totalXp),
  ]);
}

export function normalizeBackendBridgeError(error: unknown): {
  code: string;
  message: string;
  status: number;
} {
  if (error instanceof BackendBridgeTxError) {
    return {
      code: error.code,
      message: error.message,
      status: error.status,
    };
  }
  if (error instanceof Error) {
    return {
      code: "TX_SUBMISSION_FAILED",
      message: error.message,
      status: 500,
    };
  }
  return {
    code: "TX_SUBMISSION_FAILED",
    message: "Unknown transaction submission error.",
    status: 500,
  };
}

export interface BackendSubmissionResult {
  signature: string;
  accountHints: Record<string, string>;
}

export async function submitCompleteLessonTx(params: {
  courseId: string;
  learner: PublicKey;
  lessonIndex: number;
  backendSigner: Keypair;
}): Promise<BackendSubmissionResult> {
  const connection = new Connection(rpcUrl(), "confirmed");
  const { configPda, xpMint } = await loadConfigState(
    connection,
    params.backendSigner
  );

  const [coursePda] = deriveCoursePda(params.courseId);
  const [enrollmentPda] = deriveEnrollmentPda(params.learner, params.courseId);
  const learnerTokenAccount = deriveToken2022Ata(params.learner, xpMint);

  await requireToken2022Account(connection, learnerTokenAccount, "Learner XP");

  const ix = new TransactionInstruction({
    programId: ACADEMY_PROGRAM_ID,
    keys: [
      { pubkey: configPda, isSigner: false, isWritable: false },
      { pubkey: coursePda, isSigner: false, isWritable: false },
      { pubkey: enrollmentPda, isSigner: false, isWritable: true },
      { pubkey: params.learner, isSigner: false, isWritable: false },
      { pubkey: learnerTokenAccount, isSigner: false, isWritable: true },
      { pubkey: xpMint, isSigner: false, isWritable: true },
      {
        pubkey: params.backendSigner.publicKey,
        isSigner: true,
        isWritable: false,
      },
      { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    data: Buffer.concat([
      anchorIxDiscriminator("complete_lesson"),
      encodeU8(params.lessonIndex),
    ]),
  });

  const signature = await sendBackendSignedTransaction(
    connection,
    [params.backendSigner],
    ix
  );

  return {
    signature,
    accountHints: {
      config: configPda.toBase58(),
      course: coursePda.toBase58(),
      enrollment: enrollmentPda.toBase58(),
      learner: params.learner.toBase58(),
      learnerTokenAccount: learnerTokenAccount.toBase58(),
      xpMint: xpMint.toBase58(),
      tokenProgram: TOKEN_2022_PROGRAM_ID.toBase58(),
    },
  };
}

export async function submitCompleteCourseTx(params: {
  courseId: string;
  learner: PublicKey;
  backendSigner: Keypair;
}): Promise<BackendSubmissionResult> {
  const connection = new Connection(rpcUrl(), "confirmed");
  const { configPda, xpMint } = await loadConfigState(
    connection,
    params.backendSigner
  );

  const [coursePda] = deriveCoursePda(params.courseId);
  const [enrollmentPda] = deriveEnrollmentPda(params.learner, params.courseId);
  const creator = await loadCourseCreator(connection, coursePda);
  const learnerTokenAccount = deriveToken2022Ata(params.learner, xpMint);
  const creatorTokenAccount = deriveToken2022Ata(creator, xpMint);

  await requireToken2022Account(connection, learnerTokenAccount, "Learner XP");
  await requireToken2022Account(connection, creatorTokenAccount, "Creator XP");

  const ix = new TransactionInstruction({
    programId: ACADEMY_PROGRAM_ID,
    keys: [
      { pubkey: configPda, isSigner: false, isWritable: false },
      { pubkey: coursePda, isSigner: false, isWritable: true },
      { pubkey: enrollmentPda, isSigner: false, isWritable: true },
      { pubkey: params.learner, isSigner: false, isWritable: false },
      { pubkey: learnerTokenAccount, isSigner: false, isWritable: true },
      { pubkey: creatorTokenAccount, isSigner: false, isWritable: true },
      { pubkey: creator, isSigner: false, isWritable: false },
      { pubkey: xpMint, isSigner: false, isWritable: true },
      {
        pubkey: params.backendSigner.publicKey,
        isSigner: true,
        isWritable: false,
      },
      { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    data: anchorIxDiscriminator("finalize_course"),
  });

  const signature = await sendBackendSignedTransaction(
    connection,
    [params.backendSigner],
    ix
  );

  return {
    signature,
    accountHints: {
      config: configPda.toBase58(),
      course: coursePda.toBase58(),
      enrollment: enrollmentPda.toBase58(),
      learner: params.learner.toBase58(),
      creator: creator.toBase58(),
      learnerTokenAccount: learnerTokenAccount.toBase58(),
      creatorTokenAccount: creatorTokenAccount.toBase58(),
      xpMint: xpMint.toBase58(),
      tokenProgram: TOKEN_2022_PROGRAM_ID.toBase58(),
    },
  };
}

export async function submitIssueCredentialTx(params: {
  courseId: string;
  learner: PublicKey;
  backendSigner: Keypair;
  metadataUri: string;
  credentialName: string;
  coursesCompleted: number;
  totalXp: number;
  trackCollection?: string;
}): Promise<BackendSubmissionResult & { credentialAsset: string }> {
  const connection = new Connection(rpcUrl(), "confirmed");
  const { configPda } = await loadConfigState(connection, params.backendSigner);

  const [coursePda] = deriveCoursePda(params.courseId);
  const [enrollmentPda] = deriveEnrollmentPda(params.learner, params.courseId);
  const trackCollection = resolveTrackCollection(params.trackCollection);
  const credentialAsset = Keypair.generate();

  const ix = new TransactionInstruction({
    programId: ACADEMY_PROGRAM_ID,
    keys: [
      { pubkey: configPda, isSigner: false, isWritable: false },
      { pubkey: coursePda, isSigner: false, isWritable: false },
      { pubkey: enrollmentPda, isSigner: false, isWritable: true },
      { pubkey: params.learner, isSigner: false, isWritable: false },
      { pubkey: credentialAsset.publicKey, isSigner: true, isWritable: true },
      { pubkey: trackCollection, isSigner: false, isWritable: true },
      {
        pubkey: params.backendSigner.publicKey,
        isSigner: true,
        isWritable: true,
      }, // payer
      {
        pubkey: params.backendSigner.publicKey,
        isSigner: true,
        isWritable: false,
      }, // backend_signer
      { pubkey: MPL_CORE_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: encodeIssueOrUpgradeCredentialData({
      ixName: "issue_credential",
      credentialName: params.credentialName,
      metadataUri: params.metadataUri,
      coursesCompleted: params.coursesCompleted,
      totalXp: params.totalXp,
    }),
  });

  const signature = await sendBackendSignedTransaction(
    connection,
    [params.backendSigner, credentialAsset],
    ix
  );

  return {
    signature,
    credentialAsset: credentialAsset.publicKey.toBase58(),
    accountHints: {
      config: configPda.toBase58(),
      course: coursePda.toBase58(),
      enrollment: enrollmentPda.toBase58(),
      learner: params.learner.toBase58(),
      credentialAsset: credentialAsset.publicKey.toBase58(),
      trackCollection: trackCollection.toBase58(),
      payer: params.backendSigner.publicKey.toBase58(),
      backendSigner: params.backendSigner.publicKey.toBase58(),
      mplCoreProgram: MPL_CORE_PROGRAM_ID.toBase58(),
      systemProgram: SystemProgram.programId.toBase58(),
    },
  };
}

export async function submitUpgradeCredentialTx(params: {
  courseId: string;
  learner: PublicKey;
  backendSigner: Keypair;
  metadataUri: string;
  credentialName: string;
  coursesCompleted: number;
  totalXp: number;
  trackCollection?: string;
}): Promise<BackendSubmissionResult & { credentialAsset: string }> {
  const connection = new Connection(rpcUrl(), "confirmed");
  const { configPda } = await loadConfigState(connection, params.backendSigner);

  const [coursePda] = deriveCoursePda(params.courseId);
  const [enrollmentPda] = deriveEnrollmentPda(params.learner, params.courseId);
  const trackCollection = resolveTrackCollection(params.trackCollection);
  const credentialAsset = await loadEnrollmentCredentialAsset(
    connection,
    enrollmentPda
  );
  if (!credentialAsset) {
    throw new BackendBridgeTxError(
      "CREDENTIAL_ASSET_MISSING",
      "Enrollment credential_asset is empty; issue credential first.",
      400
    );
  }

  const ix = new TransactionInstruction({
    programId: ACADEMY_PROGRAM_ID,
    keys: [
      { pubkey: configPda, isSigner: false, isWritable: false },
      { pubkey: coursePda, isSigner: false, isWritable: false },
      { pubkey: enrollmentPda, isSigner: false, isWritable: false },
      { pubkey: params.learner, isSigner: false, isWritable: false },
      { pubkey: credentialAsset, isSigner: false, isWritable: true },
      { pubkey: trackCollection, isSigner: false, isWritable: true },
      {
        pubkey: params.backendSigner.publicKey,
        isSigner: true,
        isWritable: true,
      }, // payer
      {
        pubkey: params.backendSigner.publicKey,
        isSigner: true,
        isWritable: false,
      }, // backend_signer
      { pubkey: MPL_CORE_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: encodeIssueOrUpgradeCredentialData({
      ixName: "upgrade_credential",
      credentialName: params.credentialName,
      metadataUri: params.metadataUri,
      coursesCompleted: params.coursesCompleted,
      totalXp: params.totalXp,
    }),
  });

  const signature = await sendBackendSignedTransaction(
    connection,
    [params.backendSigner],
    ix
  );

  return {
    signature,
    credentialAsset: credentialAsset.toBase58(),
    accountHints: {
      config: configPda.toBase58(),
      course: coursePda.toBase58(),
      enrollment: enrollmentPda.toBase58(),
      learner: params.learner.toBase58(),
      credentialAsset: credentialAsset.toBase58(),
      trackCollection: trackCollection.toBase58(),
      payer: params.backendSigner.publicKey.toBase58(),
      backendSigner: params.backendSigner.publicKey.toBase58(),
      mplCoreProgram: MPL_CORE_PROGRAM_ID.toBase58(),
      systemProgram: SystemProgram.programId.toBase58(),
    },
  };
}

export async function submitAwardAchievementTx(params: {
  achievementId: string;
  recipient: PublicKey;
  backendSigner: Keypair;
}): Promise<BackendSubmissionResult & { asset: string; achievementReceipt: string }> {
  const connection = new Connection(rpcUrl(), "confirmed");
  const { configPda, xpMint } = await loadConfigState(
    connection,
    params.backendSigner
  );

  const [achievementTypePda] = deriveAchievementTypePda(params.achievementId);
  const [achievementReceiptPda] = deriveAchievementReceiptPda(
    params.achievementId,
    params.recipient
  );
  const [minterRolePda] = deriveMinterRolePda(params.backendSigner.publicKey);

  const achievement = await loadAchievementTypeState(
    connection,
    achievementTypePda,
    params.achievementId
  );
  if (!achievement.isActive) {
    throw new BackendBridgeTxError(
      "ACHIEVEMENT_NOT_ACTIVE",
      "Achievement type is inactive.",
      400
    );
  }

  const minterRole = await loadMinterRoleState(
    connection,
    minterRolePda,
    params.backendSigner.publicKey
  );
  if (!minterRole.isActive) {
    throw new BackendBridgeTxError(
      "MINTER_NOT_ACTIVE",
      "Minter role is inactive for backend signer.",
      400
    );
  }

  const recipientTokenAccount = deriveToken2022Ata(params.recipient, xpMint);
  if (achievement.xpReward > 0) {
    await requireToken2022Account(connection, recipientTokenAccount, "Recipient XP");
  }

  const asset = Keypair.generate();
  const ix = new TransactionInstruction({
    programId: ACADEMY_PROGRAM_ID,
    keys: [
      { pubkey: configPda, isSigner: false, isWritable: false },
      { pubkey: achievementTypePda, isSigner: false, isWritable: true },
      { pubkey: achievementReceiptPda, isSigner: false, isWritable: true },
      { pubkey: minterRolePda, isSigner: false, isWritable: true },
      { pubkey: asset.publicKey, isSigner: true, isWritable: true },
      { pubkey: achievement.collection, isSigner: false, isWritable: true },
      { pubkey: params.recipient, isSigner: false, isWritable: false },
      { pubkey: recipientTokenAccount, isSigner: false, isWritable: true },
      { pubkey: xpMint, isSigner: false, isWritable: true },
      {
        pubkey: params.backendSigner.publicKey,
        isSigner: true,
        isWritable: true,
      }, // payer
      {
        pubkey: params.backendSigner.publicKey,
        isSigner: true,
        isWritable: false,
      }, // minter
      { pubkey: MPL_CORE_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: anchorIxDiscriminator("award_achievement"),
  });

  const signature = await sendBackendSignedTransaction(
    connection,
    [params.backendSigner, asset],
    ix
  );

  return {
    signature,
    asset: asset.publicKey.toBase58(),
    achievementReceipt: achievementReceiptPda.toBase58(),
    accountHints: {
      config: configPda.toBase58(),
      achievementType: achievementTypePda.toBase58(),
      achievementReceipt: achievementReceiptPda.toBase58(),
      minterRole: minterRolePda.toBase58(),
      asset: asset.publicKey.toBase58(),
      collection: achievement.collection.toBase58(),
      recipient: params.recipient.toBase58(),
      recipientTokenAccount: recipientTokenAccount.toBase58(),
      xpMint: xpMint.toBase58(),
      payer: params.backendSigner.publicKey.toBase58(),
      minter: params.backendSigner.publicKey.toBase58(),
      mplCoreProgram: MPL_CORE_PROGRAM_ID.toBase58(),
      tokenProgram: TOKEN_2022_PROGRAM_ID.toBase58(),
      systemProgram: SystemProgram.programId.toBase58(),
    },
  };
}
