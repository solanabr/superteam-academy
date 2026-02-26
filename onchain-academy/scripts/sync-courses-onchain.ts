/**
 * Sync Sanity courses to on-chain.
 * Reads all courses from Sanity, checks which ones are missing on-chain,
 * and creates them using the authority keypair from wallets/signer.json.
 *
 * Run: cd app && npx tsx ../scripts/sync-courses-onchain.ts
 *
 * Options:
 *   --dry-run   Show what would be created without sending transactions
 */

import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { createClient } from "@sanity/client";
import * as dotenv from "dotenv";
import { resolve } from "path";
import * as fs from "fs";

dotenv.config({ path: resolve(__dirname, "../../app/.env.local") });

const DRY_RUN = process.argv.includes("--dry-run");

const connection = new Connection(
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL!,
  "confirmed"
);

const programId = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID!);

const authorityKeypair = Keypair.fromSecretKey(
  Uint8Array.from(
    JSON.parse(
      fs.readFileSync(resolve(__dirname, "../../wallets/signer.json"), "utf-8")
    )
  )
);

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: "2026-02-19",
  token: process.env.SANITY_API_TOKEN!,
  useCdn: false,
});

// Anchor discriminator for "create_course"
const CREATE_COURSE_DISC = Buffer.from([120, 121, 154, 164, 107, 180, 167, 241]);

function getCoursePda(courseId: string): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("course"), Buffer.from(courseId)],
    programId
  );
  return pda;
}

function getConfigPda(): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    programId
  );
  return pda;
}

/**
 * Borsh-serialize CreateCourseParams:
 *   course_id: String (4-byte LE len + utf8)
 *   creator: Pubkey (32 bytes)
 *   content_tx_id: [u8; 32]
 *   lesson_count: u8
 *   difficulty: u8
 *   xp_per_lesson: u32 LE
 *   track_id: u16 LE
 *   track_level: u8
 *   prerequisite: Option<Pubkey> (1 byte tag + 32 if Some)
 *   creator_reward_xp: u32 LE
 *   min_completions_for_reward: u16 LE
 */
function serializeCreateCourseParams(params: {
  courseId: string;
  creator: PublicKey;
  lessonCount: number;
  difficulty: number;
  xpPerLesson: number;
  trackId: number;
  trackLevel: number;
  creatorRewardXp: number;
}): Buffer {
  const courseIdBytes = Buffer.from(params.courseId, "utf-8");
  const contentTxId = Buffer.alloc(32); // zero — no Arweave content yet

  // Calculate buffer size
  const size =
    4 + courseIdBytes.length + // string
    32 + // creator
    32 + // content_tx_id
    1 + // lesson_count
    1 + // difficulty
    4 + // xp_per_lesson
    2 + // track_id
    1 + // track_level
    1 + // prerequisite option tag (None)
    4 + // creator_reward_xp
    2; // min_completions_for_reward

  const buf = Buffer.alloc(size);
  let offset = 0;

  // course_id
  buf.writeUInt32LE(courseIdBytes.length, offset);
  offset += 4;
  courseIdBytes.copy(buf, offset);
  offset += courseIdBytes.length;

  // creator
  params.creator.toBuffer().copy(buf, offset);
  offset += 32;

  // content_tx_id
  contentTxId.copy(buf, offset);
  offset += 32;

  // lesson_count
  buf.writeUInt8(params.lessonCount, offset);
  offset += 1;

  // difficulty
  buf.writeUInt8(params.difficulty, offset);
  offset += 1;

  // xp_per_lesson
  buf.writeUInt32LE(params.xpPerLesson, offset);
  offset += 4;

  // track_id
  buf.writeUInt16LE(params.trackId, offset);
  offset += 2;

  // track_level
  buf.writeUInt8(params.trackLevel, offset);
  offset += 1;

  // prerequisite (None)
  buf.writeUInt8(0, offset);
  offset += 1;

  // creator_reward_xp
  buf.writeUInt32LE(params.creatorRewardXp, offset);
  offset += 4;

  // min_completions_for_reward
  buf.writeUInt16LE(10, offset);
  offset += 2;

  return buf;
}

interface SanityCourse {
  courseId: string;
  title: string;
  lessonCount: number;
  difficulty: number;
  xpPerLesson: number;
  trackId: number;
  trackLevel: number;
}

async function main() {
  console.log(`Authority: ${authorityKeypair.publicKey.toBase58()}`);
  console.log(`Program:   ${programId.toBase58()}`);
  console.log(`Mode:      ${DRY_RUN ? "DRY RUN" : "LIVE"}\n`);

  const courses: SanityCourse[] = await sanity.fetch(
    `*[_type == "course" && defined(courseId)]{
      courseId, title, lessonCount, difficulty, xpPerLesson, trackId, trackLevel
    }`
  );

  console.log(`Found ${courses.length} courses in Sanity\n`);

  const configPda = getConfigPda();
  let created = 0;
  let existing = 0;
  let failed = 0;

  for (const c of courses) {
    const coursePda = getCoursePda(c.courseId);
    const info = await connection.getAccountInfo(coursePda);

    if (info) {
      console.log(`  ✓ ${c.courseId} (already on-chain)`);
      existing++;
      continue;
    }

    if (DRY_RUN) {
      console.log(`  → ${c.courseId} WOULD CREATE (${c.lessonCount} lessons, track ${c.trackId})`);
      created++;
      continue;
    }

    try {
      const paramsData = serializeCreateCourseParams({
        courseId: c.courseId,
        creator: authorityKeypair.publicKey,
        lessonCount: c.lessonCount,
        difficulty: c.difficulty,
        xpPerLesson: c.xpPerLesson ?? 30,
        trackId: c.trackId,
        trackLevel: c.trackLevel ?? 0,
        creatorRewardXp: (c.lessonCount * (c.xpPerLesson ?? 30)),
      });

      const data = Buffer.concat([CREATE_COURSE_DISC, paramsData]);

      const ix = new TransactionInstruction({
        programId,
        keys: [
          { pubkey: coursePda, isSigner: false, isWritable: true },
          { pubkey: configPda, isSigner: false, isWritable: false },
          { pubkey: authorityKeypair.publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data,
      });

      const tx = new Transaction().add(ix);
      const sig = await sendAndConfirmTransaction(connection, tx, [authorityKeypair]);

      console.log(`  ✓ ${c.courseId} CREATED → ${sig}`);
      created++;

      // Small delay to avoid rate limiting
      await new Promise((r) => setTimeout(r, 500));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("already in use")) {
        console.log(`  ✓ ${c.courseId} (already on-chain, race condition)`);
        existing++;
      } else {
        console.error(`  ✗ ${c.courseId} FAILED: ${msg}`);
        failed++;
      }
    }
  }

  console.log(`\nDone! Created: ${created} | Existing: ${existing} | Failed: ${failed}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
