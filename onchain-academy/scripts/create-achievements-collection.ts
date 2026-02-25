// onchain-academy/scripts/create-achievements-collection.ts
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { mplCore, createCollectionV2 } from "@metaplex-foundation/mpl-core";
import { generateSigner, keypairIdentity, publicKey } from "@metaplex-foundation/umi";
import { fromWeb3JsKeypair, fromWeb3JsPublicKey } from "@metaplex-foundation/umi-web3js-adapters";
import * as fs from "fs";
import { Keypair, PublicKey } from "@solana/web3.js";
import path from "path";

// Твой Program ID (обязательно проверь!)
const PROGRAM_ID = new PublicKey("Df2bLNGMb5FanSxsrS32rpuTNs6Dhss975Eyae4Qwcdb");

const WALLET_PATH = path.resolve(__dirname, "../../wallets/signer.json");
const walletFile = JSON.parse(fs.readFileSync(WALLET_PATH, 'utf-8'));
const keypair = Keypair.fromSecretKey(new Uint8Array(walletFile));

const umi = createUmi("https://api.devnet.solana.com")
  .use(mplCore())
  .use(keypairIdentity(fromWeb3JsKeypair(keypair)));

const [configPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("config")],
  PROGRAM_ID
);

async function main() {
  const collectionSigner = generateSigner(umi);

  console.log("Creating Achievements Collection...");
  console.log("Update Authority will be set to Config PDA:", configPda.toBase58());

  await createCollectionV2(umi, {
    collection: collectionSigner,
    name: "Superteam Academy Achievements",
    uri: "https://arweave.net/achievements_collection_metadata", // Заглушка, но это метаданные коллекции
    updateAuthority: fromWeb3JsPublicKey(configPda),
  }).sendAndConfirm(umi);

  console.log("✅ Achievements Collection Created:", collectionSigner.publicKey.toString());
  console.log("👉 Add this address to `app/src/lib/constants.ts` as ACHIEVEMENTS_COLLECTION");
}

main().catch(console.error);