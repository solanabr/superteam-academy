import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { OnchainAcademy } from "../target/types/onchain_academy";
import { PublicKey, SystemProgram } from "@solana/web3.js";

const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);
const program = anchor.workspace.onchainAcademy as Program<OnchainAcademy>;

const [configPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("config")],
  program.programId
);

const contentTxId = Buffer.alloc(32); // placeholder — CMS-hosted content

const courses = [
  {
    courseId: "intro-to-solana",
    lessonCount: 10,
    difficulty: 1, // beginner
    xpPerLesson: 25,
    trackId: 1,
    trackLevel: 1,
    creatorRewardXp: 50,
    minCompletionsForReward: 10,
  },
  {
    courseId: "anchor-fundamentals",
    lessonCount: 8,
    difficulty: 2, // intermediate
    xpPerLesson: 30,
    trackId: 4,
    trackLevel: 1,
    creatorRewardXp: 75,
    minCompletionsForReward: 10,
  },
  {
    courseId: "defi-on-solana",
    lessonCount: 6,
    difficulty: 3, // advanced
    xpPerLesson: 40,
    trackId: 2,
    trackLevel: 1,
    creatorRewardXp: 100,
    minCompletionsForReward: 5,
  },
  {
    courseId: "nft-development",
    lessonCount: 7,
    difficulty: 2, // intermediate
    xpPerLesson: 30,
    trackId: 3,
    trackLevel: 1,
    creatorRewardXp: 75,
    minCompletionsForReward: 10,
  },
  {
    courseId: "web3-frontend",
    lessonCount: 8,
    difficulty: 1, // beginner
    xpPerLesson: 25,
    trackId: 5,
    trackLevel: 1,
    creatorRewardXp: 50,
    minCompletionsForReward: 10,
  },
];

async function main() {
  for (const c of courses) {
    const [coursePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("course"), Buffer.from(c.courseId)],
      program.programId
    );

    try {
      const tx = await program.methods
        .createCourse({
          courseId: c.courseId,
          creator: provider.wallet.publicKey,
          contentTxId: Array.from(contentTxId),
          lessonCount: c.lessonCount,
          difficulty: c.difficulty,
          xpPerLesson: c.xpPerLesson,
          trackId: c.trackId,
          trackLevel: c.trackLevel,
          prerequisite: null,
          creatorRewardXp: c.creatorRewardXp,
          minCompletionsForReward: c.minCompletionsForReward,
        })
        .accountsStrict({
          config: configPda,
          course: coursePda,
          authority: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log(`✓ ${c.courseId} → PDA: ${coursePda.toBase58()} (tx: ${tx.slice(0, 16)}...)`);
    } catch (err: any) {
      if (err.message?.includes("already in use")) {
        console.log(`⏭ ${c.courseId} already exists (PDA: ${coursePda.toBase58()})`);
      } else {
        console.error(`✗ ${c.courseId}: ${err.message}`);
      }
    }
  }
}

main().catch(console.error);
