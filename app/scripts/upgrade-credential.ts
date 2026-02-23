/**
 * Upgrade Credential Metadata Script
 *
 * Updates name, URI, and attributes on an already-minted Metaplex Core credential NFT
 * using the on-chain `upgrade_credential` instruction.
 *
 * Usage:
 *   npx ts-node scripts/upgrade-credential.ts <courseId> <learnerWallet>
 *
 * Requires:
 *   - BACKEND_SIGNER_KEY env var (JSON array of secret key bytes)
 *   - NEXT_PUBLIC_HELIUS_RPC or NEXT_PUBLIC_SOLANA_RPC_URL env var
 *   - NEXT_PUBLIC_PROGRAM_ID env var (optional, defaults to program ID)
 *
 * Example:
 *   BACKEND_SIGNER_KEY='[...]' npx ts-node scripts/upgrade-credential.ts solana-getting-started 8NCLTHTiHJsgDoKyydY8vQfyi8RPDU4P59pCUHQGrBFm
 */

import {
  Connection,
  Keypair,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
  TransactionInstruction,
} from "@solana/web3.js";
import * as crypto from "crypto";

// ── Config ──────────────────────────────────────────────

const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID ?? "FEjumbmTCGxTwqikEcyC13czHfTwsnk7B9erNEEuHeBB",
);

const MPL_CORE_PROGRAM_ID = new PublicKey(
  "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d",
);

const CREDENTIAL_COLLECTION = new PublicKey(
  process.env.NEXT_PUBLIC_CREDENTIAL_COLLECTION ?? "3kVGs49bDKKjwhP1B83QuQDdNnCcDPkMoyRGKBm6Nosb",
);

const RPC_URL =
  process.env.NEXT_PUBLIC_HELIUS_RPC ??
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ??
  "https://api.devnet.solana.com";

const SITE_URL = process.env.NEXT_PUBLIC_PRODUCTION_URL ?? "https://superteam-academy-six.vercel.app";

// ── Course titles (fallback if Sanity isn't available from CLI) ──

const COURSE_TITLES: Record<string, string> = {
  "solana-getting-started": "Getting Started with Solana",
  "solana-core-concepts": "Solana Core Concepts",
  "solana-token-basics": "Solana Token Basics",
  "solana-token-extensions": "Solana Token Extensions",
  "solana-developing-programs": "Developing Programs on Solana",
  "solana-frontend": "Solana Frontend Development",
  "solana-rust-sdk": "Solana Rust SDK",
  "solana-typescript-sdk": "Solana TypeScript SDK",
  "solana-python-sdk": "Solana Python SDK",
  "solana-java-sdk": "Solana Java SDK",
  "solana-go-sdk": "Solana Go SDK",
  "solana-gaming-sdks": "Solana Gaming SDKs",
  "solana-dev-setup": "Solana Dev Setup",
  "anchor-fundamentals": "Anchor Fundamentals",
  "metaplex-tokens": "Metaplex Tokens",
  "metaplex-nfts": "Metaplex Core NFTs",
  "metaplex-smart-contracts": "Metaplex Smart Contracts",
  "metaplex-dev-tools": "Metaplex Dev Tools",
};

// ── PDA helpers ─────────────────────────────────────────

function getConfigPda(): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync([Buffer.from("config")], PROGRAM_ID);
  return pda;
}

function getCoursePda(courseId: string): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("course"), Buffer.from(courseId)],
    PROGRAM_ID,
  );
  return pda;
}

function getEnrollmentPda(courseId: string, learner: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("enrollment"), Buffer.from(courseId), learner.toBuffer()],
    PROGRAM_ID,
  );
  return pda;
}

// ── Discriminator ───────────────────────────────────────

function anchorDiscriminator(name: string): Buffer {
  const hash = crypto.createHash("sha256").update(`global:${name}`).digest();
  return Buffer.from(hash.subarray(0, 8));
}

const UPGRADE_CREDENTIAL_DISC = anchorDiscriminator("upgrade_credential");

// ── Parse credential_asset from enrollment ──────────────

function parseCredentialAsset(data: Buffer): PublicKey | null {
  // Layout: 8 disc + 32 course + 8 enrolled_at + Option<i64> completed_at + [u64;4] lesson_flags + Option<Pubkey> credential_asset
  // Option<i64>: tag at byte 48, None=1 byte, Some=9 bytes
  const optionTag = data[48];
  const flagsOffset = 48 + 1 + (optionTag === 1 ? 8 : 0);
  const credentialOffset = flagsOffset + 32; // 4 * u64

  const credTag = data[credentialOffset];
  if (credTag !== 1) return null;

  return new PublicKey(data.subarray(credentialOffset + 1, credentialOffset + 33));
}

// ── Build upgrade_credential instruction ────────────────

function buildUpgradeCredentialIx(
  config: PublicKey,
  course: PublicKey,
  enrollment: PublicKey,
  learner: PublicKey,
  credentialAsset: PublicKey,
  trackCollection: PublicKey,
  payer: PublicKey,
  backendSigner: PublicKey,
  credentialName: string,
  metadataUri: string,
  coursesCompleted: number,
  totalXp: bigint,
): TransactionInstruction {
  const nameBytes = Buffer.from(credentialName, "utf-8");
  const uriBytes = Buffer.from(metadataUri, "utf-8");

  const data = Buffer.alloc(8 + 4 + nameBytes.length + 4 + uriBytes.length + 4 + 8);
  let offset = 0;

  UPGRADE_CREDENTIAL_DISC.copy(data, offset);
  offset += 8;

  data.writeUInt32LE(nameBytes.length, offset);
  offset += 4;
  nameBytes.copy(data, offset);
  offset += nameBytes.length;

  data.writeUInt32LE(uriBytes.length, offset);
  offset += 4;
  uriBytes.copy(data, offset);
  offset += uriBytes.length;

  data.writeUInt32LE(coursesCompleted, offset);
  offset += 4;

  data.writeBigUInt64LE(totalXp, offset);

  return new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: config, isSigner: false, isWritable: false },
      { pubkey: course, isSigner: false, isWritable: false },
      { pubkey: enrollment, isSigner: false, isWritable: false },
      { pubkey: learner, isSigner: false, isWritable: false },
      { pubkey: credentialAsset, isSigner: false, isWritable: true },
      { pubkey: trackCollection, isSigner: false, isWritable: true },
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: backendSigner, isSigner: true, isWritable: false },
      { pubkey: MPL_CORE_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: new PublicKey("11111111111111111111111111111111"), isSigner: false, isWritable: false },
    ],
    data,
  });
}

// ── Main ────────────────────────────────────────────────

async function main() {
  const courseId = process.argv[2];
  const learnerWallet = process.argv[3];

  if (!courseId || !learnerWallet) {
    console.error("Usage: npx ts-node scripts/upgrade-credential.ts <courseId> <learnerWallet>");
    process.exit(1);
  }

  const keyJson = process.env.BACKEND_SIGNER_KEY;
  if (!keyJson) {
    console.error("BACKEND_SIGNER_KEY env var required");
    process.exit(1);
  }

  const backendKeypair = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(keyJson)));
  const connection = new Connection(RPC_URL, "confirmed");
  const learnerKey = new PublicKey(learnerWallet);

  const configPda = getConfigPda();
  const coursePda = getCoursePda(courseId);
  const enrollmentPda = getEnrollmentPda(courseId, learnerKey);

  console.log("Config PDA:", configPda.toBase58());
  console.log("Course PDA:", coursePda.toBase58());
  console.log("Enrollment PDA:", enrollmentPda.toBase58());

  // Read enrollment to get credential_asset
  const enrollmentAccount = await connection.getAccountInfo(enrollmentPda);
  if (!enrollmentAccount) {
    console.error("Enrollment not found on-chain");
    process.exit(1);
  }

  const credentialAsset = parseCredentialAsset(enrollmentAccount.data);
  if (!credentialAsset) {
    console.error("No credential minted yet for this enrollment");
    process.exit(1);
  }

  console.log("Credential Asset:", credentialAsset.toBase58());

  // Read course to get XP info
  const courseAccount = await connection.getAccountInfo(coursePda);
  if (!courseAccount) {
    console.error("Course not found on-chain");
    process.exit(1);
  }

  const courseData = courseAccount.data;
  const courseIdLen = courseData.readUInt32LE(8);
  const lessonCountOffset = 8 + 4 + courseIdLen + 32 + 32 + 2;
  const lessonCount = courseData.readUInt8(lessonCountOffset);
  const xpPerLessonOffset = lessonCountOffset + 2; // skip lesson_count (u8) + difficulty (u8)
  const xpPerLesson = courseData.readUInt32LE(xpPerLessonOffset);
  const totalXp = BigInt(lessonCount * xpPerLesson);

  const courseTitle = COURSE_TITLES[courseId] ?? courseId;
  const credentialName = `${courseTitle} — Superteam Academy`;
  const metadataUri = `${SITE_URL}/api/metadata/credential/${courseId}`;

  console.log("\nUpgrading credential:");
  console.log("  Name:", credentialName);
  console.log("  URI:", metadataUri);
  console.log("  Lessons:", lessonCount);
  console.log("  XP per lesson:", xpPerLesson);
  console.log("  Total XP:", totalXp.toString());

  const ix = buildUpgradeCredentialIx(
    configPda,
    coursePda,
    enrollmentPda,
    learnerKey,
    credentialAsset,
    CREDENTIAL_COLLECTION,
    backendKeypair.publicKey, // backend pays
    backendKeypair.publicKey,
    credentialName,
    metadataUri,
    1,
    totalXp,
  );

  const { blockhash } = await connection.getLatestBlockhash("confirmed");

  const msg = new TransactionMessage({
    payerKey: backendKeypair.publicKey,
    recentBlockhash: blockhash,
    instructions: [ix],
  }).compileToV0Message();

  const tx = new VersionedTransaction(msg);
  tx.sign([backendKeypair]);

  console.log("\nSending transaction...");
  const sig = await connection.sendTransaction(tx, { skipPreflight: false });
  console.log("Transaction signature:", sig);

  const confirmation = await connection.confirmTransaction(sig, "confirmed");
  if (confirmation.value.err) {
    console.error("Transaction failed:", confirmation.value.err);
    process.exit(1);
  }

  console.log("Credential upgraded successfully!");
  console.log(`Explorer: https://explorer.solana.com/tx/${sig}?cluster=devnet`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
