import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { OnchainAcademy } from "../target/types/onchain_academy";
import { PublicKey } from "@solana/web3.js";

const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);
const program = anchor.workspace.onchainAcademy as Program<OnchainAcademy>;

const [configPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("config")],
  program.programId
);

async function main() {
  const config = await program.account.config.fetch(configPda);

  console.log("=== Config PDA ===");
  console.log("Address:        ", configPda.toBase58());
  console.log("Authority:      ", config.authority.toBase58());
  console.log("Backend Signer: ", config.backendSigner.toBase58());
  console.log("XP Mint:        ", config.xpMint.toBase58());
  console.log("Bump:           ", config.bump);
}

main().catch(console.error);
