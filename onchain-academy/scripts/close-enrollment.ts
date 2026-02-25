// onchain-academy/scripts/close-enrollment.ts
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { OnchainAcademy } from "../target/types/onchain_academy";
import { PublicKey } from "@solana/web3.js";

const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);
const program = anchor.workspace.onchainAcademy as Program<OnchainAcademy>;

const courseId = process.argv[2];
if (!courseId) {
    console.error("Please provide a course ID.");
    process.exit(1);
}

const learner = provider.wallet.publicKey;

const [coursePda] = PublicKey.findProgramAddressSync(
  [Buffer.from("course"), Buffer.from(courseId)],
  program.programId
);
const [enrollmentPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("enrollment"), Buffer.from(courseId), learner.toBuffer()],
  program.programId
);

async function main() {
  console.log(`Closing enrollment for ${learner.toBase58()} in course "${courseId}"...`);

  try {
    const tx = await program.methods
      .closeEnrollment()
      .accountsPartial({
        course: coursePda,
        enrollment: enrollmentPda,
        learner: learner,
      }as any)
      .rpc();

    console.log(`✓ Enrollment closed successfully! Rent reclaimed.`);
    console.log(`  Transaction: https://explorer.solana.com/tx/${tx}?cluster=devnet`);
  } catch (error) {
    console.error("Failed to close enrollment:", error);
  }
}

main();