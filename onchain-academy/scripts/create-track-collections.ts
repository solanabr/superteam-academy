/**
 * Create Track Collections — Creates Metaplex Core collections for credential issuance.
 *
 * Each track (rust, anchor, frontend, security, defi, mobile) needs a Metaplex Core
 * collection on devnet. The finalize API uses these collections to issue soulbound
 * credential NFTs when a learner completes a course.
 *
 * Usage: npx ts-node scripts/create-track-collections.ts
 */

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Connection,
} from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";

const PROGRAM_ID = new PublicKey("EHgTQKSeAAoh7JVMij46CFVzThh4xUi7RDjZjHnA7qR6");
const MPL_CORE_PROGRAM_ID = new PublicKey("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");
const HELIUS_KEY = "380c8b5f-5220-4b3e-8850-78510b1ed03a";
const RPC_URL = `https://devnet.helius-rpc.com/?api-key=${HELIUS_KEY}`;

function findConfigPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from("config")], PROGRAM_ID);
}

const TRACKS = [
  { id: "rust", achievementId: "rust-track-credential", name: "Rust Track Credential", envVar: "NEXT_PUBLIC_RUST_COLLECTION" },
  { id: "anchor", achievementId: "anchor-track-credential", name: "Anchor Track Credential", envVar: "NEXT_PUBLIC_ANCHOR_COLLECTION" },
  { id: "frontend", achievementId: "frontend-track-credential", name: "Frontend Track Credential", envVar: "NEXT_PUBLIC_FRONTEND_COLLECTION" },
  { id: "security", achievementId: "security-track-credential", name: "Security Track Credential", envVar: "NEXT_PUBLIC_SECURITY_COLLECTION" },
  { id: "defi", achievementId: "defi-track-credential", name: "DeFi Track Credential", envVar: "NEXT_PUBLIC_DEFI_COLLECTION" },
  { id: "mobile", achievementId: "mobile-track-credential", name: "Mobile Track Credential", envVar: "NEXT_PUBLIC_MOBILE_COLLECTION" },
];

async function main() {
  const walletPath = path.resolve(process.env.HOME || "~", ".config/solana/id.json");
  const authorityKp = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(fs.readFileSync(walletPath, "utf-8")))
  );

  const connection = new Connection(RPC_URL, "confirmed");
  const wallet = new anchor.Wallet(authorityKp);
  const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
  anchor.setProvider(provider);

  const idlPath = path.resolve(__dirname, "../target/idl/onchain_academy.json");
  const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));
  const program = new Program(idl, provider);

  const [configPDA] = findConfigPDA();

  console.log("=== Create Track Collections ===\n");
  console.log("Authority:", authorityKp.publicKey.toBase58());
  console.log("Config:   ", configPDA.toBase58());
  console.log();

  const results: Record<string, string> = {};

  for (const track of TRACKS) {
    const [achievementTypePDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("achievement"), Buffer.from(track.achievementId)],
      PROGRAM_ID
    );

    // Check if already created
    const existing = await connection.getAccountInfo(achievementTypePDA);
    if (existing) {
      // Fetch the achievement type to get the collection address
      const achievementType = await (program.account as any).achievementType.fetch(achievementTypePDA);
      const collectionAddr = (achievementType.collection as PublicKey).toBase58();
      console.log(`[skip] ${track.id} — already exists (collection: ${collectionAddr})`);
      results[track.id] = collectionAddr;
      continue;
    }

    const collectionKeypair = Keypair.generate();

    const tx = await program.methods
      .createAchievementType({
        achievementId: track.achievementId,
        name: track.name,
        metadataUri: `https://superteam.academy/api/metadata/collection/${track.id}`,
        maxSupply: 0, // unlimited
        xpReward: 1,
      })
      .accounts({
        config: configPDA,
        achievementType: achievementTypePDA,
        collection: collectionKeypair.publicKey,
        authority: authorityKp.publicKey,
        payer: authorityKp.publicKey,
        mplCoreProgram: MPL_CORE_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([collectionKeypair])
      .rpc();

    const latestBlockhash = await connection.getLatestBlockhash();
    await connection.confirmTransaction({ signature: tx, ...latestBlockhash }, "confirmed");

    const addr = collectionKeypair.publicKey.toBase58();
    results[track.id] = addr;
    console.log(`[done] ${track.id} — collection: ${addr}  tx: ${tx}`);
  }

  console.log("\n=== Add to app/.env.local ===\n");
  for (const track of TRACKS) {
    console.log(`${track.envVar}=${results[track.id]}`);
  }
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
