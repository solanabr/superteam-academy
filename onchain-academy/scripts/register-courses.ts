import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import type { OnchainAcademy } from "../target/types/onchain_academy";

const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);
const program = anchor.workspace.OnchainAcademy as Program<OnchainAcademy>;
const authority = (provider.wallet as anchor.Wallet).payer;

const [configPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("config")],
  program.programId
);

const COURSES = [
  { courseId: "anchor-basics",      lessonCount: 3, difficulty: 2, xpPerLesson: 100, trackId: 1, trackLevel: 2 },
  { courseId: "defi-amm",           lessonCount: 4, difficulty: 3, xpPerLesson: 150, trackId: 1, trackLevel: 3 },
  { courseId: "program-security",   lessonCount: 4, difficulty: 3, xpPerLesson: 150, trackId: 1, trackLevel: 3 },
  { courseId: "token-2022",         lessonCount: 3, difficulty: 2, xpPerLesson: 100, trackId: 2, trackLevel: 1 },
];

async function main() {
  for (const c of COURSES) {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("course"), Buffer.from(c.courseId)],
      program.programId
    );
    try {
      await program.account.course.fetch(pda);
      console.log(`skip (exists): ${c.courseId}`);
      continue;
    } catch { /* doesn't exist, create it */ }

    console.log(`Creating: ${c.courseId}...`);
    const tx = await program.methods
      .createCourse({
        courseId: c.courseId,
        creator: authority.publicKey,
        contentTxId: Array.from(Buffer.alloc(32)),
        lessonCount: c.lessonCount,
        difficulty: c.difficulty,
        xpPerLesson: c.xpPerLesson,
        trackId: c.trackId,
        trackLevel: c.trackLevel,
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

    console.log(`✓ ${c.courseId} → PDA: ${pda.toBase58()} | tx: ${tx}`);
  }
  console.log("Done.");
}

main().catch((e) => { console.error(e); process.exit(1); });
