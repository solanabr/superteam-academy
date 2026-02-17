import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { OnchainAcademy } from "../target/types/onchain_academy";
import { PublicKey } from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  getAccount,
} from "@solana/spl-token";

const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);
const program = anchor.workspace.onchainAcademy as Program<OnchainAcademy>;

const courseId = process.argv[2] || "solana-mock-test";
const learner = new PublicKey(process.argv[3] || provider.wallet.publicKey.toBase58());

const [configPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("config")],
  program.programId
);
const [coursePda] = PublicKey.findProgramAddressSync(
  [Buffer.from("course"), Buffer.from(courseId)],
  program.programId
);
const [enrollmentPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("enrollment"), Buffer.from(courseId), learner.toBuffer()],
  program.programId
);

async function main() {
  const config = await program.account.config.fetch(configPda);
  const course = await program.account.course.fetch(coursePda);

  const learnerAta = getAssociatedTokenAddressSync(
    config.xpMint,
    learner,
    false,
    TOKEN_2022_PROGRAM_ID
  );
  const creatorAta = getAssociatedTokenAddressSync(
    config.xpMint,
    course.creator,
    false,
    TOKEN_2022_PROGRAM_ID
  );

  // Create creator ATA if it doesn't exist
  try {
    await getAccount(provider.connection, creatorAta, undefined, TOKEN_2022_PROGRAM_ID);
  } catch {
    console.log("Creating XP token account for creator...");
    const ix = createAssociatedTokenAccountInstruction(
      provider.wallet.publicKey,
      creatorAta,
      course.creator,
      config.xpMint,
      TOKEN_2022_PROGRAM_ID
    );
    const tx = new anchor.web3.Transaction().add(ix);
    await provider.sendAndConfirm(tx);
    console.log("Creator ATA created:", creatorAta.toBase58());
  }

  console.log(`Finalizing course "${courseId}" for ${learner.toBase58()}...`);

  const tx = await program.methods
    .finalizeCourse()
    .accountsPartial({
      config: configPda,
      course: coursePda,
      enrollment: enrollmentPda,
      learner,
      learnerTokenAccount: learnerAta,
      creatorTokenAccount: creatorAta,
      creator: course.creator,
      xpMint: config.xpMint,
      backendSigner: provider.wallet.publicKey,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
    })
    .rpc();

  console.log("Course finalized! Tx:", tx);
}

main().catch(console.error);
