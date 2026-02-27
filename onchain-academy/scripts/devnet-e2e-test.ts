/**
 * Devnet End-to-End Test Script
 *
 * Tests the full on-chain flow with REAL transactions on devnet:
 *   1. Enroll in "intro-solana" course
 *   2. Create Token-2022 ATAs for XP
 *   3. Complete all 12 lessons (backend-signed)
 *   4. Finalize course (auto-awards bonus + creator reward)
 *   5. Issue credential (Metaplex Core soulbound NFT)
 *   6. Register a minter + reward XP
 *   7. Query leaderboard (token largest accounts)
 *   8. Verify all on-chain state
 *
 * Usage: npx ts-node scripts/devnet-e2e-test.ts
 */

import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Connection,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  getAccount,
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import * as fs from "fs";
import * as path from "path";

// ─── Constants ───
const PROGRAM_ID = new PublicKey("EHgTQKSeAAoh7JVMij46CFVzThh4xUi7RDjZjHnA7qR6");
const MPL_CORE_PROGRAM_ID = new PublicKey("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");
const HELIUS_KEY = "380c8b5f-5220-4b3e-8850-78510b1ed03a";
const RPC_URL = `https://devnet.helius-rpc.com/?api-key=${HELIUS_KEY}`;
const COURSE_ID = "intro-solana";
const LESSON_COUNT = 12;

// ─── PDA Helpers ───
function findConfigPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from("config")], PROGRAM_ID);
}

function findCoursePDA(courseId: string): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("course"), Buffer.from(courseId)],
    PROGRAM_ID
  );
}

function findEnrollmentPDA(courseId: string, user: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("enrollment"), Buffer.from(courseId), user.toBuffer()],
    PROGRAM_ID
  );
}

function findMinterPDA(minter: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("minter"), minter.toBuffer()],
    PROGRAM_ID
  );
}

// ─── Helpers ───
function explorerUrl(sig: string): string {
  return `https://explorer.solana.com/tx/${sig}?cluster=devnet`;
}

function accountUrl(addr: string): string {
  return `https://explorer.solana.com/address/${addr}?cluster=devnet`;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function confirmTx(connection: Connection, sig: string): Promise<void> {
  const latestBlockhash = await connection.getLatestBlockhash();
  await connection.confirmTransaction(
    { signature: sig, ...latestBlockhash },
    "confirmed"
  );
}

// ─── Main ───
async function main() {
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║    ONCHAIN ACADEMY — DEVNET END-TO-END TEST                ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  // ─── Load Keys ───
  const authorityPath = path.resolve(
    process.env.HOME || "~",
    ".config/solana/id.json"
  );
  const authorityKp = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(fs.readFileSync(authorityPath, "utf-8")))
  );

  const backendSignerPath = path.resolve(__dirname, "../backend-signer.json");
  const backendSignerKp = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(fs.readFileSync(backendSignerPath, "utf-8")))
  );

  // Generate a FRESH test wallet for clean state
  const testWallet = Keypair.generate();

  // ─── Connection & Program ───
  const connection = new Connection(RPC_URL, "confirmed");
  const wallet = new anchor.Wallet(authorityKp);
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  anchor.setProvider(provider);

  const idlPath = path.resolve(__dirname, "../target/idl/onchain_academy.json");
  const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));
  const program = new Program(idl, provider);

  // Create a provider with the test wallet for user-signed txs
  const testWalletAdapter = new anchor.Wallet(testWallet);
  const testProvider = new anchor.AnchorProvider(connection, testWalletAdapter, {
    commitment: "confirmed",
  });
  const testProgram = new Program(idl, testProvider);

  // Create a provider with backend signer for backend-signed txs
  const backendWalletAdapter = new anchor.Wallet(backendSignerKp);
  const backendProvider = new anchor.AnchorProvider(
    connection,
    backendWalletAdapter,
    { commitment: "confirmed" }
  );
  const backendProgram = new Program(idl, backendProvider);

  const [configPDA] = findConfigPDA();
  const [coursePDA] = findCoursePDA(COURSE_ID);
  const [enrollmentPDA] = findEnrollmentPDA(COURSE_ID, testWallet.publicKey);

  console.log("Authority:        ", authorityKp.publicKey.toBase58());
  console.log("Backend Signer:   ", backendSignerKp.publicKey.toBase58());
  console.log("Test Wallet:      ", testWallet.publicKey.toBase58());
  console.log("Config PDA:       ", configPDA.toBase58());
  console.log("Course PDA:       ", coursePDA.toBase58());
  console.log("Enrollment PDA:   ", enrollmentPDA.toBase58());
  console.log();

  // ─── Preflight: Verify on-chain state ───
  console.log("── Preflight Checks ──\n");

  const config = await (program.account as any).config.fetch(configPDA);
  const xpMint = config.xpMint as PublicKey;
  console.log("  Config OK        Mint:", xpMint.toBase58());

  const course = await (program.account as any).course.fetch(coursePDA);
  console.log("  Course OK        Lessons:", course.lessonCount, " XP/lesson:", course.xpPerLesson);
  console.log("  Creator:         ", (course.creator as PublicKey).toBase58());
  console.log();

  // ─── Fund test wallet via SOL transfer from authority ───
  console.log("── Step 0: Fund Test Wallet ──\n");

  const transferIx = SystemProgram.transfer({
    fromPubkey: authorityKp.publicKey,
    toPubkey: testWallet.publicKey,
    lamports: 2 * LAMPORTS_PER_SOL,
  });
  const fundTx = new anchor.web3.Transaction().add(transferIx);
  fundTx.feePayer = authorityKp.publicKey;
  fundTx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  fundTx.sign(authorityKp);
  const fundSig = await connection.sendRawTransaction(fundTx.serialize());
  await confirmTx(connection, fundSig);
  const balance = await connection.getBalance(testWallet.publicKey);
  console.log(`  Transfer:  ${fundSig}`);
  console.log(`  Balance:   ${balance / LAMPORTS_PER_SOL} SOL\n`);

  // Also fund backend signer if needed
  const backendBalance = await connection.getBalance(backendSignerKp.publicKey);
  if (backendBalance < 0.5 * LAMPORTS_PER_SOL) {
    console.log("  Funding backend signer...");
    const bsTransferIx = SystemProgram.transfer({
      fromPubkey: authorityKp.publicKey,
      toPubkey: backendSignerKp.publicKey,
      lamports: 2 * LAMPORTS_PER_SOL,
    });
    const bsTx = new anchor.web3.Transaction().add(bsTransferIx);
    bsTx.feePayer = authorityKp.publicKey;
    bsTx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    bsTx.sign(authorityKp);
    const bsFundSig = await connection.sendRawTransaction(bsTx.serialize());
    await confirmTx(connection, bsFundSig);
    console.log(`  Backend signer funded: ${bsFundSig}\n`);
  } else {
    console.log(`  Backend signer balance OK: ${backendBalance / LAMPORTS_PER_SOL} SOL\n`);
  }

  const signatures: Record<string, string> = {};

  // ════════════════════════════════════════
  // STEP 1: Enroll in Course
  // ════════════════════════════════════════
  console.log("═══════════════════════════════════════════════════");
  console.log("  STEP 1: Enroll in 'intro-solana'");
  console.log("═══════════════════════════════════════════════════\n");

  const enrollSig = await testProgram.methods
    .enroll(COURSE_ID)
    .accounts({
      course: coursePDA,
      enrollment: enrollmentPDA,
      learner: testWallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .signers([testWallet])
    .rpc();

  await confirmTx(connection, enrollSig);
  signatures["enroll"] = enrollSig;
  console.log(`  Signature: ${enrollSig}`);
  console.log(`  Explorer:  ${explorerUrl(enrollSig)}`);

  // Verify
  const enrollmentAfterEnroll = await (program.account as any).enrollment.fetch(enrollmentPDA);
  console.log(`  Enrolled At: ${new Date(enrollmentAfterEnroll.enrolledAt.toNumber() * 1000).toISOString()}`);
  console.log(`  PASS\n`);

  // ════════════════════════════════════════
  // STEP 2: Create Token-2022 ATAs for XP
  // ════════════════════════════════════════
  console.log("═══════════════════════════════════════════════════");
  console.log("  STEP 2: Create Token-2022 ATAs for XP Mint");
  console.log("═══════════════════════════════════════════════════\n");

  const learnerATA = getAssociatedTokenAddressSync(
    xpMint,
    testWallet.publicKey,
    true,
    TOKEN_2022_PROGRAM_ID
  );

  // Create learner ATA
  const ataInfo = await connection.getAccountInfo(learnerATA);
  if (!ataInfo) {
    const createAtaIx = createAssociatedTokenAccountInstruction(
      testWallet.publicKey,
      learnerATA,
      testWallet.publicKey,
      xpMint,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    const ataTx = new anchor.web3.Transaction().add(createAtaIx);
    ataTx.feePayer = testWallet.publicKey;
    ataTx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    ataTx.sign(testWallet);
    const ataSig = await connection.sendRawTransaction(ataTx.serialize());
    await confirmTx(connection, ataSig);
    signatures["createATA"] = ataSig;
    console.log(`  Learner ATA created: ${learnerATA.toBase58()}`);
  } else {
    console.log(`  Learner ATA exists: ${learnerATA.toBase58()}`);
  }

  // Create creator ATA (for finalizeCourse creator reward)
  const creatorKey = course.creator as PublicKey;
  const creatorATA = getAssociatedTokenAddressSync(
    xpMint,
    creatorKey,
    true,
    TOKEN_2022_PROGRAM_ID
  );
  const creatorAtaInfo = await connection.getAccountInfo(creatorATA);
  if (!creatorAtaInfo) {
    const createCreatorAtaIx = createAssociatedTokenAccountInstruction(
      authorityKp.publicKey,
      creatorATA,
      creatorKey,
      xpMint,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    const creatorAtaTx = new anchor.web3.Transaction().add(createCreatorAtaIx);
    creatorAtaTx.feePayer = authorityKp.publicKey;
    creatorAtaTx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    creatorAtaTx.sign(authorityKp);
    const creatorAtaSig = await connection.sendRawTransaction(creatorAtaTx.serialize());
    await confirmTx(connection, creatorAtaSig);
    console.log(`  Creator ATA created: ${creatorATA.toBase58()}`);
  } else {
    console.log(`  Creator ATA exists: ${creatorATA.toBase58()}`);
  }
  console.log(`  PASS\n`);

  // ════════════════════════════════════════
  // STEP 3: Complete All 12 Lessons
  // ════════════════════════════════════════
  console.log("═══════════════════════════════════════════════════");
  console.log(`  STEP 3: Complete All ${LESSON_COUNT} Lessons`);
  console.log("═══════════════════════════════════════════════════\n");

  for (let i = 0; i < LESSON_COUNT; i++) {
    const lessonSig = await backendProgram.methods
      .completeLesson(i)
      .accounts({
        config: configPDA,
        course: coursePDA,
        enrollment: enrollmentPDA,
        learner: testWallet.publicKey,
        learnerTokenAccount: learnerATA,
        xpMint,
        backendSigner: backendSignerKp.publicKey,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .signers([backendSignerKp])
      .rpc();

    await confirmTx(connection, lessonSig);
    signatures[`lesson_${i}`] = lessonSig;

    const paddedIdx = String(i).padStart(2, " ");
    console.log(`  Lesson ${paddedIdx}  sig: ${lessonSig}`);

    if (i < LESSON_COUNT - 1) await sleep(500);
  }

  // Verify token balance after lessons
  await sleep(1000);
  const tokenAccount = await getAccount(
    connection,
    learnerATA,
    "confirmed",
    TOKEN_2022_PROGRAM_ID
  );
  const xpAfterLessons = Number(tokenAccount.amount);
  const expectedLessonXP = LESSON_COUNT * course.xpPerLesson;
  console.log(`\n  XP Balance:  ${xpAfterLessons} (expected: ${expectedLessonXP})`);

  // Verify enrollment bitmap
  const enrollmentAfterLessons = await (program.account as any).enrollment.fetch(enrollmentPDA);
  const lessonFlagsArr = enrollmentAfterLessons.lessonFlags as any[];
  const firstWord = new BN(lessonFlagsArr[0]).toNumber();
  const allBitsSet = (1 << LESSON_COUNT) - 1;
  console.log(`  Lesson Bitmap: ${firstWord.toString(2).padStart(LESSON_COUNT, "0")} (expected: ${allBitsSet.toString(2)})`);
  console.log(`  All lessons:   ${firstWord === allBitsSet ? "PASS" : "FAIL"}\n`);

  // ════════════════════════════════════════
  // STEP 4: Finalize Course (auto bonus + creator reward)
  // ════════════════════════════════════════
  console.log("═══════════════════════════════════════════════════");
  console.log("  STEP 4: Finalize Course");
  console.log("═══════════════════════════════════════════════════\n");

  const finalizeSig = await backendProgram.methods
    .finalizeCourse()
    .accounts({
      config: configPDA,
      course: coursePDA,
      enrollment: enrollmentPDA,
      learner: testWallet.publicKey,
      learnerTokenAccount: learnerATA,
      creatorTokenAccount: creatorATA,
      creator: creatorKey,
      xpMint,
      backendSigner: backendSignerKp.publicKey,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
    })
    .signers([backendSignerKp])
    .rpc();

  await confirmTx(connection, finalizeSig);
  signatures["finalizeCourse"] = finalizeSig;
  console.log(`  Signature: ${finalizeSig}`);
  console.log(`  Explorer:  ${explorerUrl(finalizeSig)}`);

  // Verify
  const enrollmentAfterFinalize = await (program.account as any).enrollment.fetch(enrollmentPDA);
  const completedAt = enrollmentAfterFinalize.completedAt;
  console.log(`  Completed At: ${completedAt ? new Date(completedAt.toNumber() * 1000).toISOString() : "null"}`);
  console.log(`  Completed:    ${completedAt !== null ? "PASS" : "FAIL"}`);

  // Verify XP (lessons + 50% bonus)
  await sleep(500);
  const tokenAfterFinalize = await getAccount(
    connection,
    learnerATA,
    "confirmed",
    TOKEN_2022_PROGRAM_ID
  );
  const xpAfterFinalize = Number(tokenAfterFinalize.amount);
  const bonusXP = Math.floor(expectedLessonXP / 2);
  console.log(`  XP Balance:  ${xpAfterFinalize} (expected: ${expectedLessonXP} lessons + ${bonusXP} bonus = ${expectedLessonXP + bonusXP})`);

  const courseAfterFinalize = await (program.account as any).course.fetch(coursePDA);
  console.log(`  Total Completions: ${courseAfterFinalize.totalCompletions}`);
  console.log();

  // ════════════════════════════════════════
  // STEP 5: Create Achievement Type (+ collection) & Issue Credential
  // ════════════════════════════════════════
  console.log("═══════════════════════════════════════════════════");
  console.log("  STEP 5: Create Achievement Type + Issue Credential");
  console.log("═══════════════════════════════════════════════════\n");

  // Create a track collection via createAchievementType (Config PDA signs as update_authority)
  const collectionKeypair = Keypair.generate();
  const achievementId = "rust-track-lv1";
  const [achievementTypePDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("achievement"), Buffer.from(achievementId)],
    PROGRAM_ID
  );

  console.log("  Creating achievement type (which creates Metaplex Core collection)...");
  const achievementSig = await program.methods
    .createAchievementType({
      achievementId,
      name: "Rust Track — Level 1",
      metadataUri: "https://arweave.net/placeholder-collection",
      maxSupply: 0, // unlimited
      xpReward: 1, // minimum required
    })
    .accounts({
      config: configPDA,
      achievementType: achievementTypePDA,
      collection: collectionKeypair.publicKey,
      authority: authorityKp.publicKey,
      payer: authorityKp.publicKey,
      mplCoreProgram: MPL_CORE_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .signers([collectionKeypair])
    .rpc();

  await confirmTx(connection, achievementSig);
  signatures["createAchievementType"] = achievementSig;
  console.log(`  Achievement Type: ${achievementTypePDA.toBase58()}`);
  console.log(`  Collection:       ${collectionKeypair.publicKey.toBase58()}`);
  console.log(`  tx: ${achievementSig}`);

  // Now issue credential using that collection
  const assetKeypair = Keypair.generate();
  const metadataUri = "https://arweave.net/placeholder-e2e-test-credential";

  console.log("\n  Issuing soulbound credential...");
  const credentialSig = await program.methods
    .issueCredential(
      "Rust Track — Level 1",
      metadataUri,
      1, // courses_completed
      new anchor.BN(xpAfterFinalize), // total_xp
    )
    .accounts({
      config: configPDA,
      course: coursePDA,
      enrollment: enrollmentPDA,
      learner: testWallet.publicKey,
      credentialAsset: assetKeypair.publicKey,
      trackCollection: collectionKeypair.publicKey,
      payer: authorityKp.publicKey,
      backendSigner: backendSignerKp.publicKey,
      mplCoreProgram: MPL_CORE_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .signers([backendSignerKp, assetKeypair])
    .rpc();

  await confirmTx(connection, credentialSig);
  signatures["issueCredential"] = credentialSig;
  console.log(`  Signature:        ${credentialSig}`);
  console.log(`  Credential Asset: ${assetKeypair.publicKey.toBase58()}`);
  console.log(`  Asset Explorer:   ${accountUrl(assetKeypair.publicKey.toBase58())}`);

  // Verify enrollment has credential asset stored
  const enrollmentAfterCredential = await (program.account as any).enrollment.fetch(enrollmentPDA);
  const storedAsset = enrollmentAfterCredential.credentialAsset;
  const hasCredential = storedAsset && !storedAsset.equals(PublicKey.default);
  console.log(`  Stored Asset:     ${storedAsset?.toBase58()}`);
  console.log(`  Credential Set:   ${hasCredential ? "PASS" : "FAIL"}\n`);

  // ════════════════════════════════════════
  // STEP 6: Reward XP (via minter role)
  // ════════════════════════════════════════
  console.log("═══════════════════════════════════════════════════");
  console.log("  STEP 6: Reward XP via Minter Role");
  console.log("═══════════════════════════════════════════════════\n");

  // Backend signer is already registered as minter (from setup)
  const [backendMinterPDA] = findMinterPDA(backendSignerKp.publicKey);

  const rewardSig = await backendProgram.methods
    .rewardXp(new anchor.BN(100), "e2e-test-bonus")
    .accounts({
      config: configPDA,
      minterRole: backendMinterPDA,
      xpMint,
      recipientTokenAccount: learnerATA,
      minter: backendSignerKp.publicKey,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
    })
    .signers([backendSignerKp])
    .rpc();

  await confirmTx(connection, rewardSig);
  signatures["rewardXp"] = rewardSig;
  console.log(`  Signature: ${rewardSig}`);
  console.log(`  Explorer:  ${explorerUrl(rewardSig)}`);

  await sleep(500);
  const tokenAfterReward = await getAccount(
    connection,
    learnerATA,
    "confirmed",
    TOKEN_2022_PROGRAM_ID
  );
  console.log(`  XP Balance: ${Number(tokenAfterReward.amount)} (+100 from reward)`);
  console.log(`  PASS\n`);

  // ════════════════════════════════════════
  // STEP 7: Query Leaderboard
  // ════════════════════════════════════════
  console.log("═══════════════════════════════════════════════════");
  console.log("  STEP 7: Query Leaderboard (Token Largest Accounts)");
  console.log("═══════════════════════════════════════════════════\n");

  const largestAccounts = await connection.getTokenLargestAccounts(xpMint);
  console.log(`  XP Mint: ${xpMint.toBase58()}`);
  console.log(`  Top holders:\n`);

  let testWalletFound = false;
  for (const account of largestAccounts.value) {
    if (account.uiAmount === null || account.uiAmount === 0) continue;

    const accountInfo = await connection.getParsedAccountInfo(account.address);
    const parsed = (accountInfo.value?.data as any)?.parsed;
    const owner = parsed?.info?.owner as string | undefined;
    if (!owner) continue;

    const isTestWallet = owner === testWallet.publicKey.toBase58();
    const marker = isTestWallet ? " <── TEST WALLET" : "";
    console.log(`    ${owner.slice(0, 8)}... : ${account.uiAmount} XP${marker}`);
    if (isTestWallet) testWalletFound = true;
  }
  console.log(`\n  Test wallet on leaderboard: ${testWalletFound ? "PASS" : "FAIL"}\n`);

  // ════════════════════════════════════════
  // STEP 8: Verify Final On-Chain State
  // ════════════════════════════════════════
  console.log("═══════════════════════════════════════════════════");
  console.log("  STEP 8: Final On-Chain State Verification");
  console.log("═══════════════════════════════════════════════════\n");

  const finalToken = await getAccount(
    connection,
    learnerATA,
    "confirmed",
    TOKEN_2022_PROGRAM_ID
  );
  const finalXP = Number(finalToken.amount);

  const finalEnrollment = await (program.account as any).enrollment.fetch(enrollmentPDA);
  const finalCourse = await (program.account as any).course.fetch(coursePDA);

  console.log("  Enrollment:");
  console.log(`    Enrolled At:      ${new Date(finalEnrollment.enrolledAt.toNumber() * 1000).toISOString()}`);
  console.log(`    Completed At:     ${finalEnrollment.completedAt ? new Date(finalEnrollment.completedAt.toNumber() * 1000).toISOString() : "null"}`);
  console.log(`    Credential Asset: ${finalEnrollment.credentialAsset?.toBase58()}`);
  const finalFlagsArr = finalEnrollment.lessonFlags as any[];
  const finalFlagsWord0 = new BN(finalFlagsArr[0]).toNumber();
  console.log(`    Lesson Bitmap:    ${finalFlagsWord0.toString(2).padStart(LESSON_COUNT, "0")}`);
  console.log();

  console.log("  Course:");
  console.log(`    Total Enrollments:  ${finalCourse.totalEnrollments}`);
  console.log(`    Total Completions:  ${finalCourse.totalCompletions}`);
  console.log();

  console.log("  XP Token Balance:");
  const expectedFinalXP = expectedLessonXP + bonusXP + 100; // lessons + bonus + reward
  console.log(`    Final:    ${finalXP} XP`);
  console.log(`    Expected: ~${expectedFinalXP} XP (${expectedLessonXP} lessons + ${bonusXP} bonus + 100 reward)`);
  console.log();

  // ════════════════════════════════════════
  // Summary
  // ════════════════════════════════════════
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║    ALL SIGNATURES                                          ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  const orderedKeys = [
    "enroll",
    "createATA",
    ...Array.from({ length: LESSON_COUNT }, (_, i) => `lesson_${i}`),
    "finalizeCourse",
    "issueCredential",
    "rewardXp",
  ];

  for (const key of orderedKeys) {
    const sig = signatures[key];
    if (sig) {
      console.log(`  ${key.padEnd(24)} ${sig}`);
    }
  }

  console.log(`\n  Total transactions: ${Object.keys(signatures).length}`);
  console.log(`  Test wallet:        ${testWallet.publicKey.toBase58()}`);
  console.log(`  Credential asset:   ${assetKeypair.publicKey.toBase58()}`);
  console.log(`  Final XP:           ${finalXP}`);

  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║    EXPLORER LINKS                                          ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");
  console.log(`  Test Wallet:     ${accountUrl(testWallet.publicKey.toBase58())}`);
  console.log(`  Enrollment PDA:  ${accountUrl(enrollmentPDA.toBase58())}`);
  console.log(`  Credential NFT:  ${accountUrl(assetKeypair.publicKey.toBase58())}`);
  console.log(`  XP Mint:         ${accountUrl(xpMint.toBase58())}`);

  console.log("\n  E2E TEST COMPLETE\n");
}

main().catch((err) => {
  console.error("\nE2E TEST FAILED:", err);
  process.exit(1);
});
