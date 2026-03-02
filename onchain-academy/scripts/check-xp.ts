import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { OnchainAcademy } from "../target/types/onchain_academy";
import { PublicKey } from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";

const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);
const program = anchor.workspace.onchainAcademy as Program<OnchainAcademy>;

const wallet = new PublicKey(process.argv[2] || provider.wallet.publicKey.toBase58());

const [configPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("config")],
  program.programId
);

async function main() {
  const config = await program.account.config.fetch(configPda);
  const xpAta = getAssociatedTokenAddressSync(
    config.xpMint,
    wallet,
    false,
    TOKEN_2022_PROGRAM_ID
  );

  try {
    const balance = await provider.connection.getTokenAccountBalance(xpAta);
    const xp = Number(balance.value.amount);
    const level = Math.floor(Math.sqrt(xp / 100));

    console.log(`=== XP Balance ===`);
    console.log("Wallet: ", wallet.toBase58());
    console.log("ATA:    ", xpAta.toBase58());
    console.log("XP:     ", xp);
    console.log("Level:  ", level);
  } catch {
    console.log(`No XP token account found for ${wallet.toBase58()}`);
    console.log("ATA would be:", xpAta.toBase58());
  }
}

main().catch(console.error);
