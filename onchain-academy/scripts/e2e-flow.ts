/**
 * End-to-end learner flow against a deployed devnet program.
 *
 * Runs: enroll → complete all lessons → finalize → issue credential → close enrollment
 *
 * Resumable — detects existing state and picks up where it left off.
 *
 * Usage:
 *   npx ts-node scripts/e2e-flow.ts                        # default mock course
 *   npx ts-node scripts/e2e-flow.ts <courseId>              # custom course
 *   npx ts-node scripts/e2e-flow.ts <courseId> <collection> # custom course + track collection
 */

import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { OnchainAcademy } from "../target/types/onchain_academy";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  getAccount,
} from "@solana/spl-token";

const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);
const program = anchor.workspace.onchainAcademy as Program<OnchainAcademy>;

const courseId = process.argv[2] || "solana-mock-test";
const trackCollection = new PublicKey(
  process.argv[3] || "HgbTmCi4wUWAWLx4LD6zJ2AQdayaCe7mVfhJpGwXfeVX"
);
const MPL_CORE_PROGRAM_ID = new PublicKey("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");

const learner = provider.wallet.publicKey;

const [configPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("config")],
  program.programId
);
const [coursePda] = PublicKey.findProgramAddressSync(
  [Buffer.from("course"), Buffer.from(courseId)],
  program.programId
);
const [enrollmentPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("enrollment"), Buffer.from(courseId), learner.toBuffer()],
  program.programId
);

function isBitSet(flags: BN[], index: number): boolean {
  const wordIndex = Math.floor(index / 64);
  const bitIndex = index % 64;
  return !flags[wordIndex].and(new BN(1).shln(bitIndex)).isZero();
}

function countCompleted(flags: BN[]): number {
  return flags.reduce((sum, word) => {
    let count = 0;
    let w = word.clone();
    while (!w.isZero()) {
      count += w.and(new BN(1)).toNumber();
      w = w.shrn(1);
    }
    return sum + count;
  }, 0);
}

function renderBitmap(flags: BN[], lessonCount: number): string {
  const parts: string[] = [];
  for (let i = 0; i < lessonCount; i++) {
    parts.push(isBitSet(flags, i) ? "✓" : "·");
  }
  return parts.join(" ");
}

function explorerUrl(address: string): string {
  return `https://explorer.solana.com/address/${address}?cluster=devnet`;
}

function txUrl(sig: string): string {
  return `https://explorer.solana.com/tx/${sig}?cluster=devnet`;
}

async function ensureAta(
  mint: PublicKey,
  owner: PublicKey,
  label: string
): Promise<PublicKey> {
  const ata = getAssociatedTokenAddressSync(mint, owner, false, TOKEN_2022_PROGRAM_ID);
  try {
    await getAccount(provider.connection, ata, undefined, TOKEN_2022_PROGRAM_ID);
  } catch {
    console.log(`  Creating ${label} XP token account...`);
    const ix = createAssociatedTokenAccountInstruction(
      provider.wallet.publicKey,
      ata,
      owner,
      mint,
      TOKEN_2022_PROGRAM_ID
    );
    const tx = new anchor.web3.Transaction().add(ix);
    await provider.sendAndConfirm(tx);
  }
  return ata;
}

async function main() {
  console.log("═══════════════════════════════════════════════════════");
  console.log("  Superteam Academy — End-to-End Devnet Flow");
  console.log("═══════════════════════════════════════════════════════");
  console.log();

  // --- Setup ---
  console.log("▸ Setup");
  const config = await program.account.config.fetch(configPda);
  const course = await program.account.course.fetch(coursePda);
  const lessonCount = course.lessonCount;

  console.log(`  Program:    ${program.programId.toBase58()}`);
  console.log(`  Learner:    ${learner.toBase58()}`);
  console.log(`  Course:     "${courseId}" (${lessonCount} lessons, ${course.xpPerLesson} XP/lesson)`);
  console.log(`  XP Mint:    ${config.xpMint.toBase58()}`);
  console.log();

  // --- Check existing state ---
  let enrollment = await program.account.enrollment.fetchNullable(enrollmentPda);

  // --- Step 1: Enroll ---
  if (!enrollment) {
    console.log("▸ Step 1: Enroll");
    try {
      const tx = await program.methods
        .enroll(courseId)
        .accountsPartial({
          course: coursePda,
          enrollment: enrollmentPda,
          learner,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      console.log(`  ✓ Enrolled — ${txUrl(tx)}`);
      enrollment = await program.account.enrollment.fetch(enrollmentPda);
    } catch (e: any) {
      console.error(`  ✗ Enroll failed: ${e.message}`);
      return;
    }
  } else {
    const done = countCompleted(enrollment.lessonFlags as BN[]);
    console.log(`▸ Step 1: Enroll — skipped (already enrolled, ${done}/${lessonCount} lessons done)`);
  }
  console.log();

  // --- Step 2: Create XP ATA ---
  console.log("▸ Step 2: Ensure XP token account");
  const learnerAta = await ensureAta(config.xpMint, learner, "learner");
  console.log(`  ATA: ${learnerAta.toBase58()}`);
  console.log();

  // --- Step 3: Complete lessons ---
  console.log("▸ Step 3: Complete lessons");
  // Re-fetch enrollment for fresh bitmap
  enrollment = await program.account.enrollment.fetch(enrollmentPda);

  if (enrollment.completedAt) {
    console.log(`  Skipped — course already finalized`);
  } else {
    for (let i = 0; i < lessonCount; i++) {
      if (isBitSet(enrollment.lessonFlags as BN[], i)) {
        console.log(`  Lesson ${i + 1}/${lessonCount} — already done`);
        continue;
      }

      try {
        const tx = await program.methods
          .completeLesson(i)
          .accountsPartial({
            config: configPda,
            course: coursePda,
            enrollment: enrollmentPda,
            learner,
            learnerTokenAccount: learnerAta,
            xpMint: config.xpMint,
            backendSigner: provider.wallet.publicKey,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
          })
          .rpc();
        console.log(`  Lesson ${i + 1}/${lessonCount} ✓  (+${course.xpPerLesson} XP)`);
      } catch (e: any) {
        console.error(`  ✗ Lesson ${i + 1} failed: ${e.message}`);
        return;
      }
    }
  }
  console.log();

  // --- Step 4: Finalize course ---
  // Re-fetch enrollment
  enrollment = await program.account.enrollment.fetch(enrollmentPda);

  if (enrollment.completedAt) {
    console.log("▸ Step 4: Finalize — skipped (already finalized)");
  } else {
    console.log("▸ Step 4: Finalize course");
    const creatorAta = await ensureAta(config.xpMint, course.creator, "creator");

    try {
      const tx = await program.methods
        .finalizeCourse()
        .accountsPartial({
          config: configPda,
          course: coursePda,
          enrollment: enrollmentPda,
          learner,
          learnerTokenAccount: learnerAta,
          creatorTokenAccount: creatorAta,
          creator: course.creator,
          xpMint: config.xpMint,
          backendSigner: provider.wallet.publicKey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .rpc();

      const bonusXp = Math.floor((lessonCount * course.xpPerLesson) / 2);
      console.log(`  ✓ Finalized — bonus XP: ${bonusXp} — ${txUrl(tx)}`);
    } catch (e: any) {
      console.error(`  ✗ Finalize failed: ${e.message}`);
      return;
    }
  }
  console.log();

  // --- Step 5: Issue credential ---
  // Re-fetch enrollment
  enrollment = await program.account.enrollment.fetch(enrollmentPda);

  if (enrollment.credentialAsset) {
    console.log(`▸ Step 5: Issue credential — skipped (already issued: ${enrollment.credentialAsset.toBase58()})`);
  } else {
    console.log("▸ Step 5: Issue credential");
    const credentialAsset = Keypair.generate();

    // Compute XP totals for credential attributes
    const totalLessonXp = lessonCount * course.xpPerLesson;
    const bonusXp = Math.floor(totalLessonXp / 2);
    const totalXp = totalLessonXp + bonusXp;

    try {
      const tx = await program.methods
        .issueCredential(
          `${courseId} Credential`,
          "https://arweave.net/credential-metadata",
          1,
          new BN(totalXp)
        )
        .accountsPartial({
          config: configPda,
          course: coursePda,
          enrollment: enrollmentPda,
          learner,
          credentialAsset: credentialAsset.publicKey,
          trackCollection,
          payer: provider.wallet.publicKey,
          backendSigner: provider.wallet.publicKey,
          mplCoreProgram: MPL_CORE_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([credentialAsset])
        .rpc();
      console.log(`  ✓ Credential minted: ${credentialAsset.publicKey.toBase58()}`);
      console.log(`    ${txUrl(tx)}`);
    } catch (e: any) {
      console.error(`  ✗ Issue credential failed: ${e.message}`);
      return;
    }
  }
  console.log();

  // --- Summary ---
  console.log("▸ Summary");
  enrollment = await program.account.enrollment.fetch(enrollmentPda);

  // XP balance
  try {
    const balance = await provider.connection.getTokenAccountBalance(learnerAta);
    const xp = Number(balance.value.amount);
    const level = Math.floor(Math.sqrt(xp / 100));
    console.log(`  XP Balance: ${xp}  (Level ${level})`);
  } catch {
    console.log("  XP Balance: unable to read");
  }

  if (enrollment.credentialAsset) {
    console.log(`  Credential: ${explorerUrl(enrollment.credentialAsset.toBase58())}`);
  }
  console.log(`  Enrollment: ${explorerUrl(enrollmentPda.toBase58())}`);
  console.log();

  // --- Step 6: Close enrollment ---
  console.log("▸ Step 6: Close enrollment (reclaim rent)");
  try {
    const tx = await program.methods
      .closeEnrollment()
      .accountsPartial({
        course: coursePda,
        enrollment: enrollmentPda,
        learner,
      })
      .rpc();
    console.log(`  ✓ Enrollment closed, rent reclaimed — ${txUrl(tx)}`);
  } catch (e: any) {
    console.error(`  ✗ Close failed: ${e.message}`);
  }
  console.log();

  console.log("═══════════════════════════════════════════════════════");
  console.log("  Done! Full learner flow complete.");
  console.log("═══════════════════════════════════════════════════════");
}

main().catch(console.error);
