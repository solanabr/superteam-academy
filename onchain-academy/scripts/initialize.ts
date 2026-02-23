import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { OnchainAcademy } from "../target/types/onchain_academy";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import * as fs from "fs";

const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);
const program = anchor.workspace.onchainAcademy as Program<OnchainAcademy>;

// Load XP mint keypair
const xpMintSecret = JSON.parse(fs.readFileSync("../wallets/xp-mint-keypair.json", "utf-8"));
const xpMintKeypair = Keypair.fromSecretKey(Uint8Array.from(xpMintSecret));

const [configPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("config")],
  program.programId
);
const [minterRolePda] = PublicKey.findProgramAddressSync(
  [Buffer.from("minter"), provider.wallet.publicKey.toBuffer()],
  program.programId
);

async function main() {
  const tx = await program.methods
    .initialize()
    .accountsStrict({
      config: configPda,
      xpMint: xpMintKeypair.publicKey,
      authority: provider.wallet.publicKey,
      backendMinterRole: minterRolePda,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
    })
    .signers([xpMintKeypair])
    .rpc();

  console.log("Initialized! Tx:", tx);
  console.log("Config PDA:", configPda.toBase58());
  console.log("XP Mint:", xpMintKeypair.publicKey.toBase58());
}

main().catch(console.error);