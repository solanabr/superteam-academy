import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { OnchainAcademy } from "../target/types/onchain_academy";
import { PublicKey, SystemProgram } from "@solana/web3.js";

const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);
const program = anchor.workspace.onchainAcademy as Program<OnchainAcademy>;

const [configPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("config")],
  program.programId,
);

const NEW_URI = "https://raw.githubusercontent.com/frcd10/superteam-academy/main/app/public/xp-token.json";

async function main() {
  const config = await program.account.config.fetch(configPda);
  console.log("XP Mint:", config.xpMint.toBase58());
  console.log("Updating URI to:", NEW_URI);

  const tx = await program.methods
    .updateXpMetadata("uri", NEW_URI)
    .accountsPartial({
      config: configPda,
      xpMint: config.xpMint,
      authority: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
      tokenProgram: new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"),
    })
    .rpc();

  console.log("\nSuccess! Tx:", tx);
  console.log("URI updated. Phantom should now show the token name and image.");
}

main().catch(console.error);
