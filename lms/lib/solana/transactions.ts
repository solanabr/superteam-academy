import { Program } from "@coral-xyz/anchor";
import {
  PublicKey,
  Keypair,
  Transaction,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { createMemoInstruction } from "@solana/spl-memo";
import {
  TOKEN_2022_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAccount,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { getConnection } from "./connection";
import {
  getConfigPDA,
  getCoursePDA,
  getLearnerPDA,
  getEnrollmentPDA,
  getLearnerTokenAccount,
} from "./pda";

// ---------------------------------------------------------------------------
// ATA Helper
// ---------------------------------------------------------------------------

export async function ensureATAInstruction(
  payer: PublicKey,
  wallet: PublicKey,
  mint: PublicKey,
): Promise<ReturnType<typeof createAssociatedTokenAccountInstruction> | null> {
  const ata = getLearnerTokenAccount(wallet, mint);
  const connection = getConnection();
  try {
    await getAccount(connection, ata, "confirmed", TOKEN_2022_PROGRAM_ID);
    return null; // already exists
  } catch {
    return createAssociatedTokenAccountInstruction(
      payer,
      ata,
      wallet,
      mint,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID,
    );
  }
}

// ---------------------------------------------------------------------------
// User-Signed Builders
// ---------------------------------------------------------------------------

export async function buildInitLearnerTx(
  program: Program,
  wallet: PublicKey,
): Promise<Transaction> {
  const [learner] = getLearnerPDA(wallet);
  const ix = await program.methods
    .initLearner()
    .accountsPartial({
      learner,
      authority: wallet,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
  return new Transaction().add(ix);
}

export async function buildEnrollTx(
  program: Program,
  wallet: PublicKey,
  courseId: string,
  prerequisiteEnrollment?: PublicKey,
): Promise<Transaction> {
  const [course] = getCoursePDA(courseId);
  const [enrollment] = getEnrollmentPDA(courseId, wallet);
  const ix = await program.methods
    .enroll(courseId)
    .accountsPartial({
      course,
      enrollment,
      prerequisiteEnrollment: prerequisiteEnrollment ?? undefined,
      learner: wallet,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
  return new Transaction().add(ix);
}

export async function buildUnenrollTx(
  program: Program,
  wallet: PublicKey,
  courseId: string,
): Promise<Transaction> {
  const [enrollment] = getEnrollmentPDA(courseId, wallet);
  const ix = await program.methods
    .unenroll(courseId)
    .accountsPartial({
      enrollment,
      learner: wallet,
    })
    .instruction();
  return new Transaction().add(ix);
}

export async function buildRegisterReferralTx(
  program: Program,
  refereeWallet: PublicKey,
  referrerWallet: PublicKey,
): Promise<Transaction> {
  const [refereeProfile] = getLearnerPDA(refereeWallet);
  const [referrerProfile] = getLearnerPDA(referrerWallet);
  const ix = await program.methods
    .registerReferral()
    .accountsPartial({
      refereeProfile,
      referrerProfile,
      referee: refereeWallet,
      referrer: referrerWallet,
    })
    .instruction();
  return new Transaction().add(ix);
}

export async function buildCloseEnrollmentTx(
  program: Program,
  wallet: PublicKey,
  courseId: string,
): Promise<Transaction> {
  const [enrollment] = getEnrollmentPDA(courseId, wallet);
  const ix = await program.methods
    .closeEnrollment(courseId)
    .accountsPartial({
      enrollment,
      learner: wallet,
    })
    .instruction();
  return new Transaction().add(ix);
}

// ---------------------------------------------------------------------------
// Backend-Signed Builders
// ---------------------------------------------------------------------------

export async function buildCompleteLessonTx(
  program: Program,
  backendPubkey: PublicKey,
  wallet: PublicKey,
  courseId: string,
  lessonIndex: number,
  xpAmount: number,
  xpMint: PublicKey,
): Promise<Transaction> {
  const [config] = getConfigPDA();
  const [course] = getCoursePDA(courseId);
  const [learnerProfile] = getLearnerPDA(wallet);
  const [enrollment] = getEnrollmentPDA(courseId, wallet);
  const learnerTokenAccount = getLearnerTokenAccount(wallet, xpMint);

  const tx = new Transaction();

  const ataIx = await ensureATAInstruction(backendPubkey, wallet, xpMint);
  if (ataIx) tx.add(ataIx);

  const ix = await program.methods
    .completeLesson(lessonIndex, xpAmount)
    .accountsPartial({
      config,
      course,
      learnerProfile,
      enrollment,
      xpMint,
      learnerTokenAccount,
      learner: wallet,
      backendSigner: backendPubkey,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
    })
    .instruction();
  tx.add(ix);
  return tx;
}

export async function buildFinalizeCourseTx(
  program: Program,
  backendPubkey: PublicKey,
  wallet: PublicKey,
  courseId: string,
  xpMint: PublicKey,
  creatorWallet: PublicKey,
): Promise<Transaction> {
  const [config] = getConfigPDA();
  const [course] = getCoursePDA(courseId);
  const [learnerProfile] = getLearnerPDA(wallet);
  const [enrollment] = getEnrollmentPDA(courseId, wallet);
  const learnerTokenAccount = getLearnerTokenAccount(wallet, xpMint);
  const creatorTokenAccount = getLearnerTokenAccount(creatorWallet, xpMint);

  const tx = new Transaction();

  // Ensure creator ATA exists
  const creatorAtaIx = await ensureATAInstruction(
    backendPubkey,
    creatorWallet,
    xpMint,
  );
  if (creatorAtaIx) tx.add(creatorAtaIx);

  const ix = await program.methods
    .finalizeCourse()
    .accountsPartial({
      config,
      course,
      learnerProfile,
      enrollment,
      xpMint,
      learnerTokenAccount,
      creatorTokenAccount,
      learner: wallet,
      creator: creatorWallet,
      backendSigner: backendPubkey,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
    })
    .instruction();
  tx.add(ix);
  return tx;
}

export async function buildClaimAchievementTx(
  program: Program,
  backendPubkey: PublicKey,
  wallet: PublicKey,
  achievementIndex: number,
  xpReward: number,
  xpMint: PublicKey,
): Promise<Transaction> {
  const [config] = getConfigPDA();
  const [learnerProfile] = getLearnerPDA(wallet);
  const learnerTokenAccount = getLearnerTokenAccount(wallet, xpMint);

  const tx = new Transaction();

  const ataIx = await ensureATAInstruction(backendPubkey, wallet, xpMint);
  if (ataIx) tx.add(ataIx);

  const ix = await program.methods
    .claimAchievement(achievementIndex, xpReward)
    .accountsPartial({
      config,
      learnerProfile,
      xpMint,
      learnerTokenAccount,
      learner: wallet,
      backendSigner: backendPubkey,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
    })
    .instruction();
  tx.add(ix);
  return tx;
}

export async function buildAwardStreakFreezeTx(
  program: Program,
  backendPubkey: PublicKey,
  wallet: PublicKey,
): Promise<Transaction> {
  const [config] = getConfigPDA();
  const [learnerProfile] = getLearnerPDA(wallet);
  const ix = await program.methods
    .awardStreakFreeze()
    .accountsPartial({
      config,
      learnerProfile,
      learner: wallet,
      backendSigner: backendPubkey,
    })
    .instruction();
  return new Transaction().add(ix);
}

export async function buildIssueCredentialTx(
  program: Program,
  backendPubkey: PublicKey,
  wallet: PublicKey,
  courseId: string,
): Promise<Transaction> {
  const [config] = getConfigPDA();
  const [course] = getCoursePDA(courseId);
  const [enrollment] = getEnrollmentPDA(courseId, wallet);
  const ix = await program.methods
    .issueCredential()
    .accountsPartial({
      config,
      course,
      enrollment,
      learner: wallet,
      backendSigner: backendPubkey,
    })
    .instruction();
  return new Transaction().add(ix);
}

// ---------------------------------------------------------------------------
// Admin Builders
// ---------------------------------------------------------------------------

export async function buildInitializeTx(
  program: Program,
  authority: PublicKey,
  maxDailyXp: number,
  maxAchievementXp: number,
): Promise<Transaction> {
  const [config] = getConfigPDA();
  const ix = await program.methods
    .initialize(maxDailyXp, maxAchievementXp)
    .accountsPartial({
      config,
      authority,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
  return new Transaction().add(ix);
}

export async function buildCreateSeasonTx(
  program: Program,
  authority: PublicKey,
  mintKeypair: Keypair,
  season: number,
): Promise<{ tx: Transaction; mintKeypair: Keypair }> {
  const [config] = getConfigPDA();
  const ix = await program.methods
    .createSeason(season)
    .accountsPartial({
      config,
      authority,
      mint: mintKeypair.publicKey,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .instruction();
  return { tx: new Transaction().add(ix), mintKeypair };
}

export async function buildCreateCourseTx(
  program: Program,
  authority: PublicKey,
  params: {
    courseId: string;
    creator: PublicKey;
    contentTxId: number[];
    contentType: number;
    lessonCount: number;
    challengeCount: number;
    difficulty: number;
    xpTotal: number;
    trackId: number;
    trackLevel: number;
    prerequisite: PublicKey | null;
    completionRewardXp: number;
    minCompletionsForReward: number;
  },
): Promise<Transaction> {
  const [config] = getConfigPDA();
  const [course] = getCoursePDA(params.courseId);
  const ix = await program.methods
    .createCourse({
      courseId: params.courseId,
      creator: params.creator,
      contentTxId: params.contentTxId,
      contentType: params.contentType,
      lessonCount: params.lessonCount,
      challengeCount: params.challengeCount,
      difficulty: params.difficulty,
      xpTotal: params.xpTotal,
      trackId: params.trackId,
      trackLevel: params.trackLevel,
      prerequisite: params.prerequisite,
      completionRewardXp: params.completionRewardXp,
      minCompletionsForReward: params.minCompletionsForReward,
    })
    .accountsPartial({
      config,
      course,
      authority,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
  return new Transaction().add(ix);
}

export async function buildUpdateConfigTx(
  program: Program,
  authority: PublicKey,
  params: {
    backendSigner?: PublicKey | null;
    maxDailyXp?: number | null;
    maxAchievementXp?: number | null;
  },
): Promise<Transaction> {
  const [config] = getConfigPDA();
  const ix = await program.methods
    .updateConfig({
      backendSigner: params.backendSigner ?? null,
      maxDailyXp: params.maxDailyXp ?? null,
      maxAchievementXp: params.maxAchievementXp ?? null,
    })
    .accountsPartial({
      config,
      authority,
    })
    .instruction();
  return new Transaction().add(ix);
}

export async function buildCloseSeasonTx(
  program: Program,
  authority: PublicKey,
): Promise<Transaction> {
  const [config] = getConfigPDA();
  const ix = await program.methods
    .closeSeason()
    .accountsPartial({
      config,
      authority,
    })
    .instruction();
  return new Transaction().add(ix);
}

export async function buildUpdateCourseTx(
  program: Program,
  authority: PublicKey,
  courseId: string,
  params: {
    contentTxId?: number[] | null;
    contentType?: number | null;
    lessonCount?: number | null;
    challengeCount?: number | null;
    difficulty?: number | null;
    xpTotal?: number | null;
    completionRewardXp?: number | null;
    minCompletionsForReward?: number | null;
    isActive?: boolean | null;
  },
): Promise<Transaction> {
  const [course] = getCoursePDA(courseId);
  const ix = await program.methods
    .updateCourse({
      contentTxId: params.contentTxId ?? null,
      contentType: params.contentType ?? null,
      lessonCount: params.lessonCount ?? null,
      challengeCount: params.challengeCount ?? null,
      difficulty: params.difficulty ?? null,
      xpTotal: params.xpTotal ?? null,
      completionRewardXp: params.completionRewardXp ?? null,
      minCompletionsForReward: params.minCompletionsForReward ?? null,
      isActive: params.isActive ?? null,
    })
    .accountsPartial({
      course,
      authority,
    })
    .instruction();
  return new Transaction().add(ix);
}

// ---------------------------------------------------------------------------
// Memo Transaction (real on-chain proof when program isn't deployed)
// ---------------------------------------------------------------------------

export async function sendMemoTx(
  signer: Keypair,
  data: Record<string, string>,
): Promise<string | null> {
  try {
    const connection = getConnection();
    const memo = JSON.stringify(data);
    const tx = new Transaction().add(
      createMemoInstruction(memo, [signer.publicKey]),
    );
    tx.feePayer = signer.publicKey;
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    return await sendAndConfirmTransaction(connection, tx, [signer]);
  } catch (err: any) {
    console.warn("[memo] failed to send memo tx:", err?.message);
    return null;
  }
}
