/**
 * One-time devnet setup:
 * 1. Initialize Config PDA + XP Mint
 * 2. Create Course PDAs for all courses served by Sanity CMS
 *
 * Run: ANCHOR_PROVIDER_URL=https://api.devnet.solana.com ANCHOR_WALLET=../wallets/signer.json \
 *      npx ts-node -P tsconfig.json scripts/setup-devnet.ts
 */

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";
import type { OnchainAcademy } from "../target/types/onchain_academy";

const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);

const program = anchor.workspace.OnchainAcademy as Program<OnchainAcademy>;
const authority = (provider.wallet as anchor.Wallet).payer;

// ─── PDAs ─────────────────────────────────────────────────────────────────────

const [configPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("config")],
  program.programId
);

function coursePda(courseId: string): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("course"), Buffer.from(courseId)],
    program.programId
  )[0];
}

// ─── Courses to register (must match onChainCourseId in Sanity) ───────────────

const COURSES = [
  {
    courseId: "solana-fundamentals",
    lessonCount: 5,
    difficulty: 1, // 1=beginner
    xpPerLesson: 50,
    trackId: 1,
    trackLevel: 1,
  },
  {
    courseId: "anchor-development",
    lessonCount: 3,
    difficulty: 2, // 2=intermediate
    xpPerLesson: 100,
    trackId: 1,
    trackLevel: 2,
  },
];

async function main() {
  console.log("Program ID:   ", program.programId.toBase58());
  console.log("Authority:    ", authority.publicKey.toBase58());
  console.log("Config PDA:   ", configPda.toBase58());
  console.log();

  // ── 1. Initialize (skip if already done) ──────────────────────────────────
  let configExists = false;
  try {
    await program.account.config.fetch(configPda);
    configExists = true;
    console.log("✓ Config already initialized — skipping initialize");
  } catch {
    configExists = false;
  }

  if (!configExists) {
    console.log("Initializing program...");
    const xpMintKeypair = Keypair.generate();
    const minterPda = PublicKey.findProgramAddressSync(
      [Buffer.from("minter"), authority.publicKey.toBuffer()],
      program.programId
    )[0];

    const tx = await program.methods
      .initialize()
      .accountsStrict({
        config: configPda,
        xpMint: xpMintKeypair.publicKey,
        authority: authority.publicKey,
        backendMinterRole: minterPda,
        systemProgram: SystemProgram.programId,
        tokenProgram: new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"),
      })
      .signers([xpMintKeypair])
      .rpc();

    console.log("✓ Initialized. XP Mint:", xpMintKeypair.publicKey.toBase58());
    console.log("  Tx:", tx);

    // Save XP mint address for env
    fs.writeFileSync(
      path.join(__dirname, "../xp-mint.txt"),
      xpMintKeypair.publicKey.toBase58()
    );
  }

  const config = await program.account.config.fetch(configPda);
  console.log("XP Mint:", config.xpMint.toBase58());
  console.log();

  // ── 2. Create Course PDAs ─────────────────────────────────────────────────
  for (const course of COURSES) {
    const pda = coursePda(course.courseId);

    let exists = false;
    try {
      await program.account.course.fetch(pda);
      exists = true;
    } catch {
      exists = false;
    }

    if (exists) {
      console.log(`✓ Course "${course.courseId}" already exists — skipping`);
      continue;
    }

    console.log(`Creating course "${course.courseId}"...`);
    const tx = await program.methods
      .createCourse({
        courseId: course.courseId,
        creator: authority.publicKey,
        contentTxId: Array.from(Buffer.alloc(32)),
        lessonCount: course.lessonCount,
        difficulty: course.difficulty,
        xpPerLesson: course.xpPerLesson,
        trackId: course.trackId,
        trackLevel: course.trackLevel,
        prerequisite: null,
        creatorRewardXp: 500,
        minCompletionsForReward: 10,
      })
      .accountsStrict({
        config: configPda,
        course: pda,
        authority: authority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log(`✓ Course "${course.courseId}" PDA: ${pda.toBase58()}`);
    console.log(`  Tx: ${tx}`);
  }

  console.log();
  console.log("=== Add to your .env.local ===");
  console.log(`NEXT_PUBLIC_PROGRAM_ID=${program.programId.toBase58()}`);
  console.log(`NEXT_PUBLIC_XP_MINT=${config.xpMint.toBase58()}`);
  console.log(`NEXT_PUBLIC_CLUSTER=devnet`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
