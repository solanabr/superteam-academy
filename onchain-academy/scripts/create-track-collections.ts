/**
 * Create 5 Metaplex Core collections — one per learning track.
 * Run: npx ts-node scripts/create-track-collections.ts
 */
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { mplCore, createCollectionV2 } from "@metaplex-foundation/mpl-core";
import { generateSigner, keypairIdentity } from "@metaplex-foundation/umi";
import { fromWeb3JsKeypair, fromWeb3JsPublicKey } from "@metaplex-foundation/umi-web3js-adapters";
import * as fs from "fs";
import * as path from "path";
import { Keypair, PublicKey } from "@solana/web3.js";

const PROGRAM_ID = new PublicKey("64XGGSc32TUX7rxge5u4Qsv55RQN5ybSwS4B1eksWTxy");

const TRACKS = [
  { id: 1, name: "Superteam Academy — Solana Basics" },
  { id: 2, name: "Superteam Academy — Anchor Framework" },
  { id: 3, name: "Superteam Academy — DeFi & AMMs" },
  { id: 4, name: "Superteam Academy — NFTs & Digital Assets" },
  { id: 5, name: "Superteam Academy — Full-Stack Solana" },
];

const secret = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../../wallets/signer.json"), "utf-8")
);
const keypair = Keypair.fromSecretKey(Uint8Array.from(secret));

const [configPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("config")],
  PROGRAM_ID
);

const umi = createUmi("https://api.devnet.solana.com")
  .use(mplCore())
  .use(keypairIdentity(fromWeb3JsKeypair(keypair)));

async function main() {
  console.log("Program ID: ", PROGRAM_ID.toBase58());
  console.log("Config PDA: ", configPda.toBase58());
  console.log("Authority:  ", keypair.publicKey.toBase58());
  console.log();

  const addresses: string[] = [];

  for (const track of TRACKS) {
    console.log(`Creating collection for Track ${track.id}: ${track.name}...`);
    const collectionSigner = generateSigner(umi);

    const { signature } = await createCollectionV2(umi, {
      collection: collectionSigner,
      name: track.name,
      uri: `https://arweave.net/placeholder-track-${track.id}`,
      updateAuthority: fromWeb3JsPublicKey(configPda),
    }).sendAndConfirm(umi);

    const addr = collectionSigner.publicKey.toString();
    addresses.push(addr);
    console.log(`  ✓ Address:   ${addr}`);
    console.log(`  ✓ Signature: ${Buffer.from(signature).toString("base64").slice(0, 20)}...`);
    console.log();
  }

  console.log("=== TRACK_COLLECTIONS (paste into backend/.env) ===");
  console.log(`TRACK_COLLECTIONS=${addresses.join(",")}`);
  console.log();
  console.log("=== Also update app/.env.local ===");
  console.log(`NEXT_PUBLIC_TRACK_COLLECTIONS=${addresses.join(",")}`);
}

main().catch(console.error);
