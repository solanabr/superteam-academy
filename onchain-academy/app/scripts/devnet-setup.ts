/**
 * Idempotent devnet setup script.
 *
 * Creates Config PDA (if missing), registers all 6 courses, and ensures
 * a MinterRole exists for the backend signer.
 *
 * Usage:
 *   npx tsx scripts/devnet-setup.ts
 *
 * Requires env vars: BACKEND_SIGNER_KEY, NEXT_PUBLIC_HELIUS_API_KEY
 */

import { Keypair, Connection, PublicKey, SystemProgram } from "@solana/web3.js";
import { Program, AnchorProvider, BN, type Idl } from "@coral-xyz/anchor";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import IDL_JSON from "../src/lib/solana/idl/onchain_academy.json";
import {
  findConfigPDA,
  findCoursePDA,
  findMinterPDA,
} from "../src/lib/solana/pda";
import { courses } from "../src/lib/services/courses";

/* ------------------------------------------------------------------ */
/*  Track name -> numeric ID mapping (must match on-chain program)    */
/* ------------------------------------------------------------------ */
const TRACK_IDS: Record<string, number> = {
  rust: 0,
  anchor: 1,
  frontend: 2,
  security: 3,
  defi: 4,
  mobile: 5,
};

const DIFFICULTY_IDS: Record<string, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

class NodeWallet {
  constructor(readonly payer: Keypair) {}
  get publicKey() {
    return this.payer.publicKey;
  }
  async signTransaction<T>(tx: T): Promise<T> {
    return tx;
  }
  async signAllTransactions<T>(txs: T[]): Promise<T[]> {
    return txs;
  }
}

function loadSigner(): Keypair {
  const raw = process.env.BACKEND_SIGNER_KEY;
  if (!raw) {
    throw new Error("BACKEND_SIGNER_KEY env var is required");
  }
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(raw)));
}

function getRpcUrl(): string {
  const key = process.env.NEXT_PUBLIC_HELIUS_API_KEY ?? "";
  return key
    ? `https://devnet.helius-rpc.com/?api-key=${key}`
    : "https://api.devnet.solana.com";
}

async function accountExists(
  connection: Connection,
  address: PublicKey,
): Promise<boolean> {
  const info = await connection.getAccountInfo(address);
  return info !== null;
}

/* ------------------------------------------------------------------ */
/*  Main                                                               */
/* ------------------------------------------------------------------ */

async function main() {
  const signer = loadSigner();
  const rpcUrl = getRpcUrl();
  const connection = new Connection(rpcUrl, "confirmed");
  const wallet = new NodeWallet(signer);
  const provider = new AnchorProvider(connection, wallet as any, {
    commitment: "confirmed",
  });
  const program = new Program(IDL_JSON as Idl, provider);

  console.log("=== Superteam Academy Devnet Setup ===");
  console.log("RPC:", rpcUrl);
  console.log("Authority:", signer.publicKey.toBase58());
  console.log("Program:", program.programId.toBase58());

  const balance = await connection.getBalance(signer.publicKey);
  console.log("Balance:", (balance / 1e9).toFixed(4), "SOL");
  if (balance < 0.1 * 1e9) {
    console.warn("WARNING: Low balance. You may need to airdrop SOL.");
  }

  // ---- 1. Initialize Config ----
  const [configPDA] = findConfigPDA();
  console.log("\n--- Config PDA:", configPDA.toBase58(), "---");

  if (await accountExists(connection, configPDA)) {
    console.log("Config already exists, skipping initialize.");
  } else {
    console.log("Initializing Config...");
    const xpMintKeypair = Keypair.generate();
    const tx = await program.methods
      .initialize()
      .accounts({
        config: configPDA,
        xpMint: xpMintKeypair.publicKey,
        authority: signer.publicKey,
        backendMinterRole: findMinterPDA(signer.publicKey)[0],
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .signers([signer, xpMintKeypair])
      .rpc();
    console.log("Config initialized. Tx:", tx);
    console.log("XP Mint:", xpMintKeypair.publicKey.toBase58());
  }

  // ---- 2. Register courses ----
  console.log("\n--- Registering courses ---");

  // Build a prerequisite map: course.id -> Course PDA pubkey
  const coursePDAMap = new Map<string, PublicKey>();
  for (const c of courses) {
    const [pda] = findCoursePDA(c.id);
    coursePDAMap.set(c.id, pda);
  }

  for (const c of courses) {
    const [coursePDA] = findCoursePDA(c.id);
    console.log(`\nCourse "${c.id}" -> PDA: ${coursePDA.toBase58()}`);

    if (await accountExists(connection, coursePDA)) {
      console.log(`  Already exists, skipping.`);
      continue;
    }

    const trackId = TRACK_IDS[c.track] ?? 0;
    const difficulty = DIFFICULTY_IDS[c.difficulty] ?? 1;
    const xpPerLesson = Math.floor(c.xpReward / c.lessonCount);
    const contentTxId = new Array(32).fill(0);
    const trackLevel = c.difficulty === "beginner" ? 1 : c.difficulty === "intermediate" ? 2 : 3;

    let prerequisite: PublicKey | null = null;
    if (c.prerequisiteId) {
      prerequisite = coursePDAMap.get(c.prerequisiteId) ?? null;
    }

    const params = {
      courseId: c.id,
      creator: signer.publicKey,
      contentTxId,
      lessonCount: c.lessonCount,
      difficulty,
      xpPerLesson,
      trackId,
      trackLevel,
      prerequisite,
      creatorRewardXp: Math.floor(xpPerLesson / 2),
      minCompletionsForReward: 1,
    };

    try {
      const tx = await program.methods
        .createCourse(params)
        .accounts({
          course: coursePDA,
          config: configPDA,
          authority: signer.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([signer])
        .rpc();
      console.log(`  Created. Tx: ${tx}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("already in use")) {
        console.log(`  Already exists (race condition), skipping.`);
      } else {
        console.error(`  FAILED: ${msg}`);
      }
    }
  }

  // ---- 3. Ensure MinterRole for backend signer ----
  console.log("\n--- MinterRole ---");
  const [minterPDA] = findMinterPDA(signer.publicKey);
  console.log("MinterRole PDA:", minterPDA.toBase58());

  if (await accountExists(connection, minterPDA)) {
    console.log("MinterRole already exists.");
  } else {
    console.log("Registering MinterRole...");
    try {
      const tx = await program.methods
        .registerMinter({
          minter: signer.publicKey,
          label: "backend-signer",
          maxXpPerCall: new BN(0),
        })
        .accounts({
          config: configPDA,
          minterRole: minterPDA,
          authority: signer.publicKey,
          payer: signer.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([signer])
        .rpc();
      console.log("MinterRole registered. Tx:", tx);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("already in use")) {
        console.log("MinterRole already exists (race condition).");
      } else {
        console.error("MinterRole registration FAILED:", msg);
      }
    }
  }

  console.log("\n=== Setup complete ===");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
