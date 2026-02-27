/**
 * Read-only devnet state verification script.
 *
 * Fetches and displays Config PDA, all Course PDAs, enrollment counts,
 * and XP mint supply.
 *
 * Usage:
 *   npx tsx scripts/verify-devnet-state.ts
 *
 * Requires env var: NEXT_PUBLIC_HELIUS_API_KEY (optional, falls back to public RPC)
 */

import { Connection, PublicKey } from "@solana/web3.js";
import { Program, AnchorProvider, type Idl } from "@coral-xyz/anchor";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import IDL_JSON from "../src/lib/solana/idl/onchain_academy.json";
import { findConfigPDA, findCoursePDA } from "../src/lib/solana/pda";
import { courses } from "../src/lib/services/courses";

const TRACK_NAMES: Record<number, string> = {
  0: "rust",
  1: "anchor",
  2: "frontend",
  3: "security",
  4: "defi",
  5: "mobile",
};

const DIFFICULTY_NAMES: Record<number, string> = {
  1: "beginner",
  2: "intermediate",
  3: "advanced",
};

function getRpcUrl(): string {
  const key = process.env.NEXT_PUBLIC_HELIUS_API_KEY ?? "";
  return key
    ? `https://devnet.helius-rpc.com/?api-key=${key}`
    : "https://api.devnet.solana.com";
}

/** Minimal read-only wallet shim for AnchorProvider. */
const DUMMY_WALLET = {
  publicKey: PublicKey.default,
  signTransaction: async <T>(tx: T) => tx,
  signAllTransactions: async <T>(txs: T[]) => txs,
};

async function main() {
  const rpcUrl = getRpcUrl();
  const connection = new Connection(rpcUrl, "confirmed");
  const provider = new AnchorProvider(connection, DUMMY_WALLET as any, {
    commitment: "confirmed",
  });
  const program = new Program(IDL_JSON as Idl, provider);

  console.log("=== Superteam Academy Devnet State ===");
  console.log("RPC:", rpcUrl);
  console.log("Program:", program.programId.toBase58());

  // ---- Config ----
  const [configPDA] = findConfigPDA();
  console.log("\n--- Config PDA:", configPDA.toBase58(), "---");

  try {
    const config = await (program.account as any).config.fetch(configPDA);
    console.table({
      authority: config.authority.toBase58(),
      backendSigner: config.backendSigner.toBase58(),
      xpMint: config.xpMint.toBase58(),
      bump: config.bump,
    });

    // ---- XP Mint Supply ----
    console.log("\n--- XP Mint ---");
    const mintInfo = await connection.getAccountInfo(config.xpMint);
    if (mintInfo) {
      // Token-2022 mint: supply at offset 36, 8 bytes LE
      const supplyBuf = mintInfo.data.subarray(36, 44);
      const supply = Number(supplyBuf.readBigUInt64LE(0));
      const decimals = mintInfo.data[44];
      console.table({
        address: config.xpMint.toBase58(),
        supply: supply,
        decimals: decimals,
        owner: mintInfo.owner.toBase58(),
        isToken2022: mintInfo.owner.equals(TOKEN_2022_PROGRAM_ID),
      });
    } else {
      console.log("XP Mint account not found on-chain.");
    }
  } catch {
    console.log("Config PDA does not exist. Program not initialized.");
    return;
  }

  // ---- Courses ----
  console.log("\n--- Courses ---");
  const courseRows: Record<string, unknown>[] = [];
  let totalEnrollments = 0;

  for (const c of courses) {
    const [coursePDA] = findCoursePDA(c.id);
    try {
      const onChain = await (program.account as any).course.fetch(coursePDA);
      totalEnrollments += onChain.totalEnrollments;
      courseRows.push({
        courseId: onChain.courseId,
        pda: coursePDA.toBase58().slice(0, 12) + "...",
        track: TRACK_NAMES[onChain.trackId] ?? onChain.trackId,
        difficulty: DIFFICULTY_NAMES[onChain.difficulty] ?? onChain.difficulty,
        lessons: onChain.lessonCount,
        xpPerLesson: onChain.xpPerLesson,
        enrollments: onChain.totalEnrollments,
        completions: onChain.totalCompletions,
        active: onChain.isActive,
        hasPrereq: onChain.prerequisite !== null,
      });
    } catch {
      courseRows.push({
        courseId: c.id,
        pda: coursePDA.toBase58().slice(0, 12) + "...",
        track: c.track,
        difficulty: c.difficulty,
        lessons: c.lessonCount,
        xpPerLesson: "-",
        enrollments: "-",
        completions: "-",
        active: "NOT FOUND",
        hasPrereq: "-",
      });
    }
  }

  console.table(courseRows);
  console.log("\nTotal enrollments across all courses:", totalEnrollments);

  // ---- Summary ----
  const found = courseRows.filter((r) => r.active !== "NOT FOUND").length;
  const missing = courseRows.length - found;
  console.log(`\n--- Summary ---`);
  console.log(`Courses registered: ${found}/${courseRows.length}`);
  if (missing > 0) {
    console.log(
      `Missing courses: ${courseRows.filter((r) => r.active === "NOT FOUND").map((r) => r.courseId).join(", ")}`,
    );
  }
  console.log("=== Done ===");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
