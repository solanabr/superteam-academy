import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { OnchainAcademy } from "../target/types/onchain_academy";
import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);
const program = anchor.workspace.onchainAcademy as Program<OnchainAcademy>;

const courseId = process.argv[2] || "solana-mock-test";

const [coursePda] = PublicKey.findProgramAddressSync(
  [Buffer.from("course"), Buffer.from(courseId)],
  program.programId
);

// CS-3: `active_lessons` ([u64; 4] / BN[4] in the camelCase IDL) replaced the
// v1 `lesson_count: u8`. Popcount it client-side for display — there is no
// on-chain helper exposed to the client.
function liveLessonCount(activeLessons: BN[]): number {
  return activeLessons.reduce(
    (sum, word) => sum + word.toString(2).split("1").length - 1,
    0
  );
}

async function main() {
  const course = await program.account.course.fetch(coursePda);

  console.log(`=== Course: ${courseId} ===`);
  console.log("PDA:                     ", coursePda.toBase58());
  console.log("Creator:                 ", course.creator.toBase58());
  console.log("Version:                 ", course.version);
  console.log(
    "Live Lessons:            ",
    liveLessonCount(course.activeLessons)
  );
  console.log("Difficulty:              ", course.difficulty);
  console.log("XP per Lesson:           ", course.xpPerLesson);
  console.log("Track ID:                ", course.trackId);
  console.log("Track Level:             ", course.trackLevel);
  console.log(
    "Prerequisite:            ",
    course.prerequisite?.toBase58() || "none"
  );
  console.log("Creator Reward XP:       ", course.creatorRewardXp);
  console.log("Total Completions:       ", course.totalCompletions);
  console.log("Total Enrollments:       ", course.totalEnrollments);
  console.log("Active:                  ", course.isActive);
  console.log(
    "Created:                 ",
    new Date(course.createdAt.toNumber() * 1000).toISOString()
  );
  console.log(
    "Updated:                 ",
    new Date(course.updatedAt.toNumber() * 1000).toISOString()
  );
}

main().catch(console.error);
