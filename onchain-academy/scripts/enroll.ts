import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { OnchainAcademy } from "../target/types/onchain_academy";
import { PublicKey, SystemProgram } from "@solana/web3.js";

const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);
const program = anchor.workspace.onchainAcademy as Program<OnchainAcademy>;

const courseId = process.argv[2] || "solana-mock-test";
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
  console.log(`Enrolling ${learner.toBase58()} in course "${courseId}"...`);

  const tx = await program.methods
    .enroll(courseId)
    .accountsPartial({
      course: coursePda,
      enrollment: enrollmentPda,
      learner,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  console.log("Enrolled! Tx:", tx);
  console.log("Enrollment PDA:", enrollmentPda.toBase58());
}

main().catch(console.error);
