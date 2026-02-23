/**
 * Devnet Setup Script — Initializes the Onchain Academy program on devnet.
 *
 * Steps:
 * 1. Initialize Config PDA (creates XP mint via Token-2022, auto-registers authority as minter)
 * 2. Update Config to set backend signer (separate from authority)
 * 3. Register backend signer as a minter
 * 4. Create all 6 courses from the frontend catalog
 *
 * Usage: npx ts-node scripts/devnet-setup.ts
 *
 * Prerequisites:
 * - Program deployed to devnet (EHgTQKSeAAoh7JVMij46CFVzThh4xUi7RDjZjHnA7qR6)
 * - Solana CLI wallet (~/.config/solana/id.json) funded on devnet
 * - backend-signer.json generated in project root
 */

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Connection,
  clusterApiUrl,
} from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import * as fs from "fs";
import * as path from "path";

const PROGRAM_ID = new PublicKey("EHgTQKSeAAoh7JVMij46CFVzThh4xUi7RDjZjHnA7qR6");

// PDA helpers
function findConfigPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from("config")], PROGRAM_ID);
}

function findCoursePDA(courseId: string): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("course"), Buffer.from(courseId)],
    PROGRAM_ID
  );
}

function findMinterPDA(minter: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("minter"), minter.toBuffer()],
    PROGRAM_ID
  );
}

// Track string to numeric ID mapping
const TRACK_IDS: Record<string, number> = {
  rust: 1,
  anchor: 2,
  frontend: 3,
  defi: 4,
  security: 5,
  mobile: 6,
};

const DIFFICULTY_MAP: Record<string, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
};

// Course definitions matching the frontend catalog
const COURSES = [
  {
    courseId: "intro-solana",
    track: "rust",
    difficulty: "beginner",
    lessonCount: 12,
    xpPerLesson: 30,
    trackLevel: 1,
    prerequisite: null as string | null,
    creatorRewardXp: 50,
    minCompletionsForReward: 5,
  },
  {
    courseId: "anchor-dev",
    track: "anchor",
    difficulty: "intermediate",
    lessonCount: 15,
    xpPerLesson: 40,
    trackLevel: 1,
    prerequisite: "intro-solana",
    creatorRewardXp: 80,
    minCompletionsForReward: 5,
  },
  {
    courseId: "frontend-solana",
    track: "frontend",
    difficulty: "intermediate",
    lessonCount: 10,
    xpPerLesson: 40,
    trackLevel: 1,
    prerequisite: "intro-solana",
    creatorRewardXp: 65,
    minCompletionsForReward: 5,
  },
  {
    courseId: "defi-fundamentals",
    track: "defi",
    difficulty: "advanced",
    lessonCount: 8,
    xpPerLesson: 50,
    trackLevel: 1,
    prerequisite: "anchor-dev",
    creatorRewardXp: 70,
    minCompletionsForReward: 3,
  },
  {
    courseId: "solana-security",
    track: "security",
    difficulty: "advanced",
    lessonCount: 10,
    xpPerLesson: 50,
    trackLevel: 1,
    prerequisite: "anchor-dev",
    creatorRewardXp: 90,
    minCompletionsForReward: 3,
  },
  {
    courseId: "mobile-solana",
    track: "mobile",
    difficulty: "advanced",
    lessonCount: 8,
    xpPerLesson: 50,
    trackLevel: 1,
    prerequisite: "frontend-solana",
    creatorRewardXp: 75,
    minCompletionsForReward: 3,
  },
];

async function main() {
  // Load authority wallet (Solana CLI default)
  const walletPath = path.resolve(
    process.env.HOME || "~",
    ".config/solana/id.json"
  );
  const authorityKp = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(fs.readFileSync(walletPath, "utf-8")))
  );

  // Load backend signer
  const backendSignerPath = path.resolve(__dirname, "../backend-signer.json");
  const backendSignerKp = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(fs.readFileSync(backendSignerPath, "utf-8")))
  );

  // Connect to devnet
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  const wallet = new anchor.Wallet(authorityKp);
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  anchor.setProvider(provider);

  // Load IDL
  const idlPath = path.resolve(__dirname, "../target/idl/onchain_academy.json");
  const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));
  const program = new Program(idl, provider);

  const [configPDA] = findConfigPDA();

  console.log("=== Onchain Academy — Devnet Setup ===\n");
  console.log("Authority:       ", authorityKp.publicKey.toBase58());
  console.log("Backend Signer:  ", backendSignerKp.publicKey.toBase58());
  console.log("Config PDA:      ", configPDA.toBase58());
  console.log("Program ID:      ", PROGRAM_ID.toBase58());
  console.log();

  // ─── Step 1: Initialize Config + XP Mint ───
  const configAccount = await connection.getAccountInfo(configPDA);
  let xpMint: PublicKey;

  if (configAccount) {
    console.log("[1/4] Config PDA already exists, skipping initialize.");
    const config = await (program.account as any).config.fetch(configPDA);
    xpMint = config.xpMint as PublicKey;
  } else {
    console.log("[1/4] Initializing Config PDA + XP Mint...");
    const mintKp = Keypair.generate();
    const [backendMinterRole] = findMinterPDA(authorityKp.publicKey);

    const tx = await program.methods
      .initialize()
      .accounts({
        config: configPDA,
        xpMint: mintKp.publicKey,
        authority: authorityKp.publicKey,
        backendMinterRole,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .signers([mintKp])
      .rpc();
    console.log("  tx:", tx);

    const config = await (program.account as any).config.fetch(configPDA);
    xpMint = config.xpMint as PublicKey;
  }

  console.log("  XP Mint:", xpMint.toBase58());

  // ─── Step 2: Update Config to set backend signer ───
  const config = await (program.account as any).config.fetch(configPDA);
  if (
    (config.backendSigner as PublicKey).equals(backendSignerKp.publicKey)
  ) {
    console.log(
      "\n[2/4] Backend signer already set, skipping updateConfig."
    );
  } else {
    console.log("\n[2/4] Setting backend signer via updateConfig...");
    const tx = await program.methods
      .updateConfig({
        newBackendSigner: backendSignerKp.publicKey,
      })
      .accounts({
        config: configPDA,
        authority: authorityKp.publicKey,
      })
      .rpc();
    console.log("  tx:", tx);
  }

  // ─── Step 3: Register backend signer as minter ───
  const [backendMinterPDA] = findMinterPDA(backendSignerKp.publicKey);
  const backendMinterAccount = await connection.getAccountInfo(backendMinterPDA);

  if (backendMinterAccount) {
    console.log(
      "\n[3/4] Backend signer minter role already exists, skipping."
    );
  } else {
    console.log("\n[3/4] Registering backend signer as minter...");
    const tx = await program.methods
      .registerMinter({
        minter: backendSignerKp.publicKey,
        label: "backend",
        maxXpPerCall: new anchor.BN(0), // unlimited
      })
      .accounts({
        config: configPDA,
        minterRole: backendMinterPDA,
        authority: authorityKp.publicKey,
        payer: authorityKp.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    console.log("  tx:", tx);
  }

  // ─── Step 4: Create Courses ───
  console.log("\n[4/4] Creating courses...");

  for (const course of COURSES) {
    const [coursePDA] = findCoursePDA(course.courseId);
    const courseAccount = await connection.getAccountInfo(coursePDA);

    if (courseAccount) {
      console.log(`  [skip] ${course.courseId} — already exists`);
      continue;
    }

    // Resolve prerequisite PDA
    let prerequisite: PublicKey | null = null;
    if (course.prerequisite) {
      [prerequisite] = findCoursePDA(course.prerequisite);
    }

    const tx = await program.methods
      .createCourse({
        courseId: course.courseId,
        creator: authorityKp.publicKey,
        contentTxId: Array(32).fill(0),
        lessonCount: course.lessonCount,
        difficulty: DIFFICULTY_MAP[course.difficulty],
        xpPerLesson: course.xpPerLesson,
        trackId: TRACK_IDS[course.track],
        trackLevel: course.trackLevel,
        prerequisite,
        creatorRewardXp: course.creatorRewardXp,
        minCompletionsForReward: course.minCompletionsForReward,
      })
      .accounts({
        course: coursePDA,
        config: configPDA,
        authority: authorityKp.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log(`  [done] ${course.courseId} — tx: ${tx}`);
  }

  // ─── Summary ───
  console.log("\n=== Setup Complete ===\n");
  console.log("Add these to app/.env.local:");
  console.log(`  NEXT_PUBLIC_PROGRAM_ID=${PROGRAM_ID.toBase58()}`);
  console.log(`  NEXT_PUBLIC_XP_MINT_ADDRESS=${xpMint.toBase58()}`);
  console.log(`  BACKEND_SIGNER_KEY=[already set]`);
  console.log(
    `\nBackend signer pubkey: ${backendSignerKp.publicKey.toBase58()}`
  );
  console.log("(Must match Config.backend_signer on-chain)");
}

main().catch((err) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
