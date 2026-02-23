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

const courseId = "solana-mock-test";
const [coursePda] = PublicKey.findProgramAddressSync(
  [Buffer.from("course"), Buffer.from(courseId)],
  program.programId
);

// Placeholder content tx ID — replace with a real Arweave tx for production
const contentTxId = Buffer.alloc(32);

async function main() {
  const tx = await program.methods
    .createCourse({
      courseId,
      creator: provider.wallet.publicKey,
      contentTxId: Array.from(contentTxId),
      lessonCount: 5,
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

  console.log("Course created:", courseId);
  console.log("Course PDA:", coursePda.toBase58());
  console.log("Tx:", tx);
}

main().catch(console.error);