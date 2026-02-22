import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { OnchainAcademy } from "../target/types/onchain_academy";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import * as fs from "fs";

const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);
const program = anchor.workspace.onchainAcademy as Program<OnchainAcademy>;

const backendSecret = JSON.parse(fs.readFileSync("../wallets/backend-signer.json", "utf-8"));
const backendKeypair = Keypair.fromSecretKey(Uint8Array.from(backendSecret));

const [configPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("config")],
  program.programId
);

const [backendMinterPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("minter"), backendKeypair.publicKey.toBuffer()],
  program.programId
);

// Old minter role PDA (authority = signer, registered during initialize)
const [oldMinterPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("minter"), provider.wallet.publicKey.toBuffer()],
  program.programId
);

async function main() {
  // 1. Register backend signer as a minter
  console.log("Registering backend signer as minter...");
  console.log("Backend signer pubkey:", backendKeypair.publicKey.toBase58());

  const tx1 = await program.methods
    .registerMinter({
      minter: backendKeypair.publicKey,
      label: "backend-signer",
      maxXpPerCall: new anchor.BN(0), // unlimited
    })
    .accountsStrict({
      config: configPda,
      minterRole: backendMinterPda,
      authority: provider.wallet.publicKey,
      payer: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  console.log("✓ Minter registered. Tx:", tx1.slice(0, 24) + "...");

  // 2. Update config to set backend_signer
  console.log("\nUpdating config backend_signer...");

  const tx2 = await program.methods
    .updateConfig({
      newBackendSigner: backendKeypair.publicKey,
    })
    .accountsStrict({
      config: configPda,
      authority: provider.wallet.publicKey,
    })
    .remainingAccounts([
      { pubkey: oldMinterPda, isWritable: true, isSigner: false },
    ])
    .rpc();

  console.log("✓ Config updated. Tx:", tx2.slice(0, 24) + "...");

  // 3. Verify
  const config = await program.account.config.fetch(configPda);
  console.log("\n--- Config PDA State ---");
  console.log("Authority:", config.authority.toBase58());
  console.log("Backend Signer:", config.backendSigner.toBase58());
  console.log("XP Mint:", config.xpMint.toBase58());
}

main().catch(console.error);
