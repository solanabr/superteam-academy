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
  getMinterRolePDA,
  getAchievementTypePDA,
  getAchievementReceiptPDA,
} from "./pda";
import { MPL_CORE_PROGRAM_ID } from "./constants";

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
  prerequisiteCourseId?: string,
): Promise<Transaction> {
  const [course] = getCoursePDA(courseId);
  const [enrollment] = getEnrollmentPDA(courseId, wallet);

  const builder = program.methods.enroll(courseId).accountsPartial({
    course,
    enrollment,
    learner: wallet,
    systemProgram: SystemProgram.programId,
  });

  // Prerequisites are handled via remaining accounts
  if (prerequisiteCourseId) {
    const [prereqCourse] = getCoursePDA(prerequisiteCourseId);
    const [prereqEnrollment] = getEnrollmentPDA(prerequisiteCourseId, wallet);
    builder.remainingAccounts([
      { pubkey: prereqCourse, isSigner: false, isWritable: false },
      { pubkey: prereqEnrollment, isSigner: false, isWritable: false },
    ]);
  }

  const ix = await builder.instruction();
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
  const [course] = getCoursePDA(courseId);
  const [enrollment] = getEnrollmentPDA(courseId, wallet);
  const ix = await program.methods
    .closeEnrollment()
    .accountsPartial({
      course,
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
  xpMint: PublicKey,
): Promise<Transaction> {
  const [config] = getConfigPDA();
  const [course] = getCoursePDA(courseId);
  const [enrollment] = getEnrollmentPDA(courseId, wallet);
  const learnerTokenAccount = getLearnerTokenAccount(wallet, xpMint);

  const tx = new Transaction();

  const ataIx = await ensureATAInstruction(backendPubkey, wallet, xpMint);
  if (ataIx) tx.add(ataIx);

  const ix = await program.methods
    .completeLesson(lessonIndex)
    .accountsPartial({
      config,
      course,
      enrollment,
      learner: wallet,
      learnerTokenAccount,
      xpMint,
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
      enrollment,
      learner: wallet,
      learnerTokenAccount,
      creatorTokenAccount,
      creator: creatorWallet,
      xpMint,
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
  credentialAssetKeypair: Keypair,
  trackCollection: PublicKey,
  credentialName: string,
  metadataUri: string,
  coursesCompleted: number,
  totalXp: number,
): Promise<{ tx: Transaction; credentialAssetKeypair: Keypair }> {
  const [config] = getConfigPDA();
  const [course] = getCoursePDA(courseId);
  const [enrollment] = getEnrollmentPDA(courseId, wallet);
  const ix = await program.methods
    .issueCredential(credentialName, metadataUri, coursesCompleted, totalXp)
    .accountsPartial({
      config,
      course,
      enrollment,
      learner: wallet,
      credentialAsset: credentialAssetKeypair.publicKey,
      trackCollection,
      payer: backendPubkey,
      backendSigner: backendPubkey,
      mplCoreProgram: MPL_CORE_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
  return { tx: new Transaction().add(ix), credentialAssetKeypair };
}

export async function buildUpgradeCredentialTx(
  program: Program,
  backendPubkey: PublicKey,
  wallet: PublicKey,
  courseId: string,
  credentialAsset: PublicKey,
  trackCollection: PublicKey,
  credentialName: string,
  metadataUri: string,
  coursesCompleted: number,
  totalXp: number,
): Promise<Transaction> {
  const [config] = getConfigPDA();
  const [course] = getCoursePDA(courseId);
  const [enrollment] = getEnrollmentPDA(courseId, wallet);
  const ix = await program.methods
    .upgradeCredential(credentialName, metadataUri, coursesCompleted, totalXp)
    .accountsPartial({
      config,
      course,
      enrollment,
      learner: wallet,
      credentialAsset,
      trackCollection,
      payer: backendPubkey,
      backendSigner: backendPubkey,
      mplCoreProgram: MPL_CORE_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
  return new Transaction().add(ix);
}

export async function buildRewardXpTx(
  program: Program,
  minterKeypair: PublicKey,
  recipientWallet: PublicKey,
  amount: number,
  memo: string,
  xpMint: PublicKey,
): Promise<Transaction> {
  const [config] = getConfigPDA();
  const [minterRole] = getMinterRolePDA(minterKeypair);
  const recipientTokenAccount = getLearnerTokenAccount(recipientWallet, xpMint);

  const tx = new Transaction();

  const ataIx = await ensureATAInstruction(
    minterKeypair,
    recipientWallet,
    xpMint,
  );
  if (ataIx) tx.add(ataIx);

  const ix = await program.methods
    .rewardXp(amount, memo)
    .accountsPartial({
      config,
      minterRole,
      xpMint,
      recipientTokenAccount,
      minter: minterKeypair,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
    })
    .instruction();
  tx.add(ix);
  return tx;
}

export async function buildAwardAchievementTx(
  program: Program,
  minterPubkey: PublicKey,
  achievementId: string,
  recipientWallet: PublicKey,
  assetKeypair: Keypair,
  xpMint: PublicKey,
  collection: PublicKey,
): Promise<{ tx: Transaction; assetKeypair: Keypair }> {
  const [config] = getConfigPDA();
  const [achievementType] = getAchievementTypePDA(achievementId);
  const [achievementReceipt] = getAchievementReceiptPDA(
    achievementId,
    recipientWallet,
  );
  const [minterRole] = getMinterRolePDA(minterPubkey);
  const recipientTokenAccount = getLearnerTokenAccount(recipientWallet, xpMint);

  const tx = new Transaction();

  const ataIx = await ensureATAInstruction(
    minterPubkey,
    recipientWallet,
    xpMint,
  );
  if (ataIx) tx.add(ataIx);

  const ix = await program.methods
    .awardAchievement()
    .accountsPartial({
      config,
      achievementType,
      achievementReceipt,
      minterRole,
      asset: assetKeypair.publicKey,
      collection,
      recipient: recipientWallet,
      recipientTokenAccount,
      xpMint,
      payer: minterPubkey,
      minter: minterPubkey,
      mplCoreProgram: MPL_CORE_PROGRAM_ID,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
  tx.add(ix);
  return { tx, assetKeypair };
}

// ---------------------------------------------------------------------------
// Admin Builders
// ---------------------------------------------------------------------------

export async function buildInitializeTx(
  program: Program,
  authority: PublicKey,
  xpMintKeypair: Keypair,
): Promise<{ tx: Transaction; xpMintKeypair: Keypair }> {
  const [config] = getConfigPDA();
  const [backendMinterRole] = getMinterRolePDA(authority);
  const ix = await program.methods
    .initialize()
    .accountsPartial({
      config,
      xpMint: xpMintKeypair.publicKey,
      authority,
      backendMinterRole,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
    })
    .instruction();
  return { tx: new Transaction().add(ix), xpMintKeypair };
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
    lessonCount: number;
    difficulty: number;
    xpPerLesson: number;
    trackId: number;
    trackLevel: number;
    prerequisite: PublicKey | null;
    creatorRewardXp: number;
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
      lessonCount: params.lessonCount,
      difficulty: params.difficulty,
      xpPerLesson: params.xpPerLesson,
      trackId: params.trackId,
      trackLevel: params.trackLevel,
      prerequisite: params.prerequisite,
      creatorRewardXp: params.creatorRewardXp,
      minCompletionsForReward: params.minCompletionsForReward,
    })
    .accountsPartial({
      course,
      config,
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
    newBackendSigner?: PublicKey | null;
    maxDailyXp?: number | null;
    maxAchievementXp?: number | null;
  },
): Promise<Transaction> {
  const [config] = getConfigPDA();
  const ix = await program.methods
    .updateConfig({
      newBackendSigner: params.newBackendSigner ?? null,
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
    newContentTxId?: number[] | null;
    newIsActive?: boolean | null;
    newXpPerLesson?: number | null;
    newCreatorRewardXp?: number | null;
    newMinCompletionsForReward?: number | null;
  },
): Promise<Transaction> {
  const [config] = getConfigPDA();
  const [course] = getCoursePDA(courseId);
  const ix = await program.methods
    .updateCourse({
      newContentTxId: params.newContentTxId ?? null,
      newIsActive: params.newIsActive ?? null,
      newXpPerLesson: params.newXpPerLesson ?? null,
      newCreatorRewardXp: params.newCreatorRewardXp ?? null,
      newMinCompletionsForReward: params.newMinCompletionsForReward ?? null,
    })
    .accountsPartial({
      config,
      course,
      authority,
    })
    .instruction();
  return new Transaction().add(ix);
}

export async function buildRegisterMinterTx(
  program: Program,
  authority: PublicKey,
  params: {
    minter: PublicKey;
    label: string;
    maxXpPerCall: number;
  },
): Promise<Transaction> {
  const [config] = getConfigPDA();
  const [minterRole] = getMinterRolePDA(params.minter);
  const ix = await program.methods
    .registerMinter({
      minter: params.minter,
      label: params.label,
      maxXpPerCall: params.maxXpPerCall,
    })
    .accountsPartial({
      config,
      minterRole,
      authority,
      payer: authority,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
  return new Transaction().add(ix);
}

export async function buildRevokeMinterTx(
  program: Program,
  authority: PublicKey,
  minterPubkey: PublicKey,
): Promise<Transaction> {
  const [config] = getConfigPDA();
  const [minterRole] = getMinterRolePDA(minterPubkey);
  const ix = await program.methods
    .revokeMinter()
    .accountsPartial({
      config,
      minterRole,
      authority,
    })
    .instruction();
  return new Transaction().add(ix);
}

export async function buildCreateAchievementTypeTx(
  program: Program,
  authority: PublicKey,
  collectionKeypair: Keypair,
  params: {
    achievementId: string;
    name: string;
    metadataUri: string;
    maxSupply: number;
    xpReward: number;
  },
): Promise<{ tx: Transaction; collectionKeypair: Keypair }> {
  const [config] = getConfigPDA();
  const [achievementType] = getAchievementTypePDA(params.achievementId);
  const ix = await program.methods
    .createAchievementType({
      achievementId: params.achievementId,
      name: params.name,
      metadataUri: params.metadataUri,
      maxSupply: params.maxSupply,
      xpReward: params.xpReward,
    })
    .accountsPartial({
      config,
      achievementType,
      collection: collectionKeypair.publicKey,
      authority,
      payer: authority,
      mplCoreProgram: MPL_CORE_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
  return { tx: new Transaction().add(ix), collectionKeypair };
}

export async function buildDeactivateAchievementTypeTx(
  program: Program,
  authority: PublicKey,
  achievementId: string,
): Promise<Transaction> {
  const [config] = getConfigPDA();
  const [achievementType] = getAchievementTypePDA(achievementId);
  const ix = await program.methods
    .deactivateAchievementType()
    .accountsPartial({
      config,
      achievementType,
      authority,
    })
    .instruction();
  return new Transaction().add(ix);
}

// ---------------------------------------------------------------------------
// Memo Transaction (for community features without on-chain instructions)
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
