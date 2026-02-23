import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { OnchainAcademy } from "../target/types/onchain_academy";
import { PublicKey } from "@solana/web3.js";

const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);
const program = anchor.workspace.onchainAcademy as Program<OnchainAcademy>;

const courseId = process.argv[2] || "solana-mock-test";
const learner = new PublicKey(process.argv[3] || provider.wallet.publicKey.toBase58());

const [enrollmentPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("enrollment"), Buffer.from(courseId), learner.toBuffer()],
  program.programId
);

const [coursePda] = PublicKey.findProgramAddressSync(
  [Buffer.from("course"), Buffer.from(courseId)],
  program.programId
);

function renderBitmap(flags: BN[], lessonCount: number): string {
  const parts: string[] = [];
  for (let i = 0; i < lessonCount; i++) {
    const wordIndex = Math.floor(i / 64);
    const bitIndex = i % 64;
    const done = !flags[wordIndex].and(new BN(1).shln(bitIndex)).isZero();
    parts.push(done ? "✓" : "·");
  }
  return parts.join(" ");
}

function countCompleted(flags: BN[]): number {
  return flags.reduce((sum, word) => {
    let count = 0;
    let w = word.clone();
    while (!w.isZero()) {
      count += w.and(new BN(1)).toNumber();
      w = w.shrn(1);
    }
    return sum + count;
  }, 0);
}

async function main() {
  const enrollment = await program.account.enrollment.fetchNullable(enrollmentPda);

  if (!enrollment) {
    console.log(`No enrollment found for ${learner.toBase58()} in course "${courseId}"`);
    return;
  }

  const course = await program.account.course.fetch(coursePda);
  const completed = countCompleted(enrollment.lessonFlags as BN[]);
  const total = course.lessonCount;

  console.log(`=== Enrollment: ${courseId} ===`);
  console.log("PDA:              ", enrollmentPda.toBase58());
  console.log("Learner:          ", learner.toBase58());
  console.log("Course PDA:       ", enrollment.course.toBase58());
  console.log("Enrolled:         ", new Date(enrollment.enrolledAt.toNumber() * 1000).toISOString());
  console.log("Completed:        ", enrollment.completedAt ? new Date(enrollment.completedAt.toNumber() * 1000).toISOString() : "in progress");
  console.log("Credential Asset: ", enrollment.credentialAsset?.toBase58() || "none");
  console.log(`Progress:          ${completed}/${total} lessons`);
  console.log("Lessons:          ", renderBitmap(enrollment.lessonFlags as BN[], total));
}

main().catch(console.error);
