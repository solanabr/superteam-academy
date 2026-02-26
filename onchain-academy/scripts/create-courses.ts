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

const contentTxId = Buffer.alloc(32);

const courses = [
  {
    courseId: "anchor-fundamentals",
    lessonCount: 10,
    difficulty: 2,
    xpPerLesson: 30,
    trackId: 1,
    trackLevel: 2,
    creatorRewardXp: 300,
  },
  {
    courseId: "metaplex-core",
    lessonCount: 5,
    difficulty: 2,
    xpPerLesson: 35,
    trackId: 4,
    trackLevel: 2,
    creatorRewardXp: 175,
  },
  {
    courseId: "solana-dev-setup",
    lessonCount: 5,
    difficulty: 1,
    xpPerLesson: 25,
    trackId: 1,
    trackLevel: 0,
    creatorRewardXp: 125,
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
          minCompletionsForReward: 10,
        })
        .accountsStrict({
          config: configPda,
          course: coursePda,
          authority: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log(`Created "${c.courseId}" → PDA: ${coursePda.toBase58()} | Tx: ${tx}`);
    } catch (err: any) {
      if (err.message?.includes("already in use")) {
        console.log(`"${c.courseId}" already exists at ${coursePda.toBase58()}`);
      } else {
        console.error(`Failed to create "${c.courseId}":`, err.message);
      }
    }
  }
}

main().catch(console.error);
