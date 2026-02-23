import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { OnchainAcademy } from "../target/types/onchain_academy";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";

const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);
const program = anchor.workspace.onchainAcademy as Program<OnchainAcademy>;

// Default: mock track collection from devnet deployment
const courseId = process.argv[2] || "solana-mock-test";
const learner = new PublicKey(process.argv[3] || provider.wallet.publicKey.toBase58());
const trackCollection = new PublicKey(process.argv[4] || "HgbTmCi4wUWAWLx4LD6zJ2AQdayaCe7mVfhJpGwXfeVX");

const MPL_CORE_PROGRAM_ID = new PublicKey("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");

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
  const credentialAsset = Keypair.generate();

  console.log(`Issuing credential for ${learner.toBase58()} in course "${courseId}"...`);

  const tx = await program.methods
    .issueCredential(
      "Superteam Academy Credential",
      "https://arweave.net/credential-metadata",
      1,            // coursesCompleted
      new BN(500)   // totalXp
    )
    .accountsPartial({
      config: configPda,
      course: coursePda,
      enrollment: enrollmentPda,
      learner,
      credentialAsset: credentialAsset.publicKey,
      trackCollection,
      payer: provider.wallet.publicKey,
      backendSigner: provider.wallet.publicKey,
      mplCoreProgram: MPL_CORE_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .signers([credentialAsset])
    .rpc();

  console.log("Credential issued! Tx:", tx);
  console.log("Credential Asset:", credentialAsset.publicKey.toBase58());
}

main().catch(console.error);
