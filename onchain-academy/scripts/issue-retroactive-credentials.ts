/**
 * Issue Retroactive Credentials
 *
 * Finds all finalized enrollments that don't have a credential NFT
 * and issues Metaplex Core soulbound credentials for each.
 *
 * Usage: npx ts-node scripts/issue-retroactive-credentials.ts
 */

import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Connection,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  getAccount,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import * as fs from "fs";
import * as path from "path";

const PROGRAM_ID = new PublicKey("EHgTQKSeAAoh7JVMij46CFVzThh4xUi7RDjZjHnA7qR6");
const MPL_CORE_PROGRAM_ID = new PublicKey("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");
const HELIUS_KEY = "380c8b5f-5220-4b3e-8850-78510b1ed03a";
const RPC_URL = `https://devnet.helius-rpc.com/?api-key=${HELIUS_KEY}`;

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

// Course ID -> track mapping
const COURSE_TRACKS: Record<string, string> = {
  "intro-solana": "rust",
  "anchor-dev": "anchor",
  "frontend-solana": "frontend",
  "defi-fundamentals": "defi",
  "solana-security": "security",
  "mobile-solana": "mobile",
};

// Track -> collection address (created by create-track-collections.ts)
const TRACK_COLLECTIONS: Record<string, string> = {
  rust: "Buv9FvB2qWFgXWis7n24D4vjVV9TRJYWHDaAhMoa1cYQ",
  anchor: "5SVt3J5SqTMEzjcWyyKVwMXkgKsCwCnFuRHLiraFuPnT",
  frontend: "HZY7e1BJTN6aefkVyEhXPEfXKQbZSecUff9ZEn98ftAq",
  security: "BrTYsyz4E25VHWjcR99487stN7oAnR1hDo5QGfNpsFvW",
  defi: "2KkNjN59Si2zNS6FcscX66Edcf3EqatrHyPbXS1uy7fz",
  mobile: "CEo92TBdu45aD1VwJGPWNGu2gAckaEfZM8VJ5oAMktM9",
};

const TRACK_LABELS: Record<string, string> = {
  rust: "Rust Track",
  anchor: "Anchor Track",
  frontend: "Frontend Track",
  security: "Security Track",
  defi: "DeFi Track",
  mobile: "Mobile Track",
};

const COURSE_TITLES: Record<string, string> = {
  "intro-solana": "Introduction to Solana",
  "anchor-dev": "Anchor Development",
  "frontend-solana": "Frontend on Solana",
  "defi-fundamentals": "DeFi Fundamentals",
  "solana-security": "Solana Security",
  "mobile-solana": "Mobile on Solana",
};

async function main() {
  const walletPath = path.resolve(process.env.HOME || "~", ".config/solana/id.json");
  const authorityKp = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(fs.readFileSync(walletPath, "utf-8")))
  );

  // Try backend-signer.json first, fall back to .env.local BACKEND_SIGNER_KEY
  let backendSignerKp: Keypair;
  const backendSignerPath = path.resolve(__dirname, "../backend-signer.json");
  if (fs.existsSync(backendSignerPath)) {
    backendSignerKp = Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(fs.readFileSync(backendSignerPath, "utf-8")))
    );
  } else {
    const envPath = path.resolve(__dirname, "../app/.env.local");
    const envContent = fs.readFileSync(envPath, "utf-8");
    const match = envContent.match(/BACKEND_SIGNER_KEY=(\[[\d,]+\])/);
    if (!match) throw new Error("No backend-signer.json and no BACKEND_SIGNER_KEY in .env.local");
    backendSignerKp = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(match[1])));
  }

  const connection = new Connection(RPC_URL, "confirmed");
  const wallet = new anchor.Wallet(authorityKp);
  const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
  anchor.setProvider(provider);

  const idlPath = path.resolve(__dirname, "../target/idl/onchain_academy.json");
  const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));
  const program = new Program(idl, provider);

  const [configPDA] = findConfigPDA();
  const config = await (program.account as any).config.fetch(configPDA);
  const xpMint = config.xpMint as PublicKey;

  console.log("=== Issue Retroactive Credentials ===\n");
  console.log("Authority:      ", authorityKp.publicKey.toBase58());
  console.log("Backend Signer: ", backendSignerKp.publicKey.toBase58());
  console.log();

  // Build course PDA -> courseId map
  const coursePDAMap: Record<string, string> = {};
  for (const courseId of Object.keys(COURSE_TRACKS)) {
    const [pda] = findCoursePDA(courseId);
    coursePDAMap[pda.toBase58()] = courseId;
  }

  // Fetch all enrollments (size 127)
  const allEnrollments = await connection.getProgramAccounts(PROGRAM_ID, {
    filters: [{ dataSize: 127 }],
  });

  console.log(`Found ${allEnrollments.length} total enrollments\n`);

  let issued = 0;
  let skipped = 0;

  for (const { pubkey: enrollmentPDA, account } of allEnrollments) {
    const enrollment = await (program.account as any).enrollment.fetch(enrollmentPDA);

    // Skip non-finalized
    if (!enrollment.completedAt) {
      continue;
    }

    // Skip already has credential
    const credAsset = enrollment.credentialAsset as PublicKey | null;
    if (credAsset && !credAsset.equals(PublicKey.default)) {
      skipped++;
      continue;
    }

    const coursePDAKey = (enrollment.course as PublicKey).toBase58();
    const courseId = coursePDAMap[coursePDAKey];
    if (!courseId) {
      console.log(`  [skip] Unknown course PDA: ${coursePDAKey}`);
      continue;
    }

    const track = COURSE_TRACKS[courseId];
    const collection = TRACK_COLLECTIONS[track];
    if (!collection) {
      console.log(`  [skip] No collection for track: ${track}`);
      continue;
    }

    // Derive the learner from the enrollment PDA seeds
    // We need to find the learner — check all enrollment PDAs against known course
    // Actually, enrollment stores course PDA but not learner directly.
    // We need to find learner by checking who the enrollment belongs to.
    // The enrollment PDA = ["enrollment", courseId, learner] so we can't easily
    // reverse it. Instead, query token accounts for the XP mint to find learners,
    // then check their enrollments.

    // Alternative: scan recent transactions on the enrollment PDA to find the learner
    const sigs = await connection.getSignaturesForAddress(enrollmentPDA, { limit: 1 });
    if (sigs.length === 0) continue;

    const tx = await connection.getTransaction(sigs[sigs.length - 1].signature, {
      maxSupportedTransactionVersion: 0,
    });
    if (!tx) continue;

    // Find the learner from the transaction accounts
    // The enroll instruction has the learner as a signer
    const accountKeys = tx.transaction.message.getAccountKeys();
    let learnerKey: PublicKey | null = null;

    // Try each account key — check if it produces the correct enrollment PDA
    for (let i = 0; i < accountKeys.length; i++) {
      const key = accountKeys.get(i);
      if (!key) continue;
      const [derivedPDA] = findEnrollmentPDA(courseId, key);
      if (derivedPDA.equals(enrollmentPDA)) {
        learnerKey = key;
        break;
      }
    }

    if (!learnerKey) {
      console.log(`  [skip] Could not find learner for enrollment ${enrollmentPDA.toBase58().slice(0, 16)}...`);
      continue;
    }

    // Get learner's XP balance for the credential attributes
    let totalXp = 0;
    try {
      const ata = getAssociatedTokenAddressSync(xpMint, learnerKey, true, TOKEN_2022_PROGRAM_ID);
      const tokenAcc = await getAccount(connection, ata, "confirmed", TOKEN_2022_PROGRAM_ID);
      totalXp = Number(tokenAcc.amount);
    } catch {
      // No ATA = 0 XP
    }

    const [coursePDA] = findCoursePDA(courseId);
    const trackLabel = TRACK_LABELS[track];
    const courseTitle = COURSE_TITLES[courseId];
    const credentialName = `${trackLabel} — ${courseTitle}`;
    const metadataUri = `https://superteam.academy/api/metadata/${courseId}`;

    const assetKeypair = Keypair.generate();

    console.log(`  Issuing: ${credentialName}`);
    console.log(`    Learner:    ${learnerKey.toBase58()}`);
    console.log(`    Enrollment: ${enrollmentPDA.toBase58().slice(0, 16)}...`);
    console.log(`    Collection: ${collection.slice(0, 16)}...`);

    try {
      const tx = await program.methods
        .issueCredential(credentialName, metadataUri, 1, new BN(totalXp))
        .accounts({
          config: configPDA,
          course: coursePDA,
          enrollment: enrollmentPDA,
          learner: learnerKey,
          credentialAsset: assetKeypair.publicKey,
          trackCollection: new PublicKey(collection),
          payer: authorityKp.publicKey,
          backendSigner: backendSignerKp.publicKey,
          mplCoreProgram: MPL_CORE_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([backendSignerKp, assetKeypair])
        .rpc();

      const latestBlockhash = await connection.getLatestBlockhash();
      await connection.confirmTransaction({ signature: tx, ...latestBlockhash }, "confirmed");

      console.log(`    Asset:      ${assetKeypair.publicKey.toBase58()}`);
      console.log(`    tx:         ${tx}`);
      console.log(`    DONE\n`);
      issued++;
    } catch (err: any) {
      console.log(`    ERROR: ${err.message?.slice(0, 100)}\n`);
    }

    // Small delay between txs
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n=== Summary ===`);
  console.log(`  Issued:  ${issued}`);
  console.log(`  Skipped: ${skipped} (already had credential)`);
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
