/**
 * Create the Anchor Fundamentals course PDA on devnet.
 * Run from onchain-academy with: yarn script:course:anchor-fundamentals
 * Uses the same authority as initialize (Anchor.toml provider.wallet = ../wallets/signer.json).
 * Course id must match the Sanity course slug used by the app for enroll (e.g. anchor-fundamentals).
 */
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { getProgram, getProvider } from "./load-program";

const provider = getProvider();
const program = getProgram();

const [configPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("config")],
  program.programId,
);

const COURSE_ID = "anchor-fundamentals";
const [coursePda] = PublicKey.findProgramAddressSync(
  [Buffer.from("course"), Buffer.from(COURSE_ID)],
  program.programId,
);

const contentTxId = Buffer.alloc(32);

async function main() {
  const tx = await program.methods
    .createCourse({
      courseId: COURSE_ID,
      creator: provider.wallet.publicKey,
      contentTxId: Array.from(contentTxId),
      lessonCount: 10,
      difficulty: 2,
      xpPerLesson: 100,
      trackId: 1,
      trackLevel: 1,
      prerequisite: null,
      creatorRewardXp: 50,
      minCompletionsForReward: 10,
    })
    .accountsStrict({
      config: configPda,
      course: coursePda,
      authority: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  console.log("Course created:", COURSE_ID);
  console.log("Course PDA:", coursePda.toBase58());
  console.log("Tx:", tx);
}

main().catch(console.error);
