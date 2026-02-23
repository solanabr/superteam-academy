import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { OnchainAcademy } from "../target/types/onchain_academy";
import { PublicKey } from "@solana/web3.js";

const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);
const program = anchor.workspace.onchainAcademy as Program<OnchainAcademy>;

const courseId = process.argv[2] || "solana-mock-test";

const [coursePda] = PublicKey.findProgramAddressSync(
  [Buffer.from("course"), Buffer.from(courseId)],
  program.programId
);

async function main() {
  const course = await program.account.course.fetch(coursePda);

  console.log(`=== Course: ${courseId} ===`);
  console.log("PDA:                     ", coursePda.toBase58());
  console.log("Creator:                 ", course.creator.toBase58());
  console.log("Version:                 ", course.version);
  console.log("Lesson Count:            ", course.lessonCount);
  console.log("Difficulty:              ", course.difficulty);
  console.log("XP per Lesson:           ", course.xpPerLesson);
  console.log("Track ID:                ", course.trackId);
  console.log("Track Level:             ", course.trackLevel);
  console.log("Prerequisite:            ", course.prerequisite?.toBase58() || "none");
  console.log("Creator Reward XP:       ", course.creatorRewardXp);
  console.log("Min Completions (reward):", course.minCompletionsForReward);
  console.log("Total Completions:       ", course.totalCompletions);
  console.log("Total Enrollments:       ", course.totalEnrollments);
  console.log("Active:                  ", course.isActive);
  console.log("Created:                 ", new Date(course.createdAt.toNumber() * 1000).toISOString());
  console.log("Updated:                 ", new Date(course.updatedAt.toNumber() * 1000).toISOString());
}

main().catch(console.error);
