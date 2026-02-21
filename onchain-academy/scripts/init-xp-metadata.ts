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

const TOKEN_NAME = "Superteam Academy XP";
const TOKEN_SYMBOL = "STXP";
const TOKEN_URI = "https://i.ibb.co/Q7NWgn9N/STBR-LOGO.jpg";

async function main() {
  const config = await program.account.config.fetch(configPda);
  console.log("Config PDA:", configPda.toBase58());
  console.log("XP Mint:", config.xpMint.toBase58());
  console.log("Authority:", config.authority.toBase58());
  console.log();
  console.log(`Setting metadata: name="${TOKEN_NAME}", symbol="${TOKEN_SYMBOL}"`);
  console.log(`URI: ${TOKEN_URI}`);

  const tx = await program.methods
    .initXpMetadata(TOKEN_NAME, TOKEN_SYMBOL, TOKEN_URI)
    .accountsPartial({
      config: configPda,
      xpMint: config.xpMint,
      authority: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
      tokenProgram: new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"),
    })
    .rpc();

  console.log("\nSuccess! Tx:", tx);
  console.log("XP token metadata initialized on-chain.");
}

main().catch(console.error);
