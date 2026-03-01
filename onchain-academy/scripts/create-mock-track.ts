import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { mplCore, createCollectionV2 } from "@metaplex-foundation/mpl-core";
import { generateSigner, keypairIdentity, publicKey } from "@metaplex-foundation/umi";
import { fromWeb3JsKeypair, fromWeb3JsPublicKey } from "@metaplex-foundation/umi-web3js-adapters";
import * as fs from "fs";
import { Keypair, PublicKey } from "@solana/web3.js";

const PROGRAM_ID = new PublicKey("5bzKJ9GdnR6FmnF4Udcza64Hgdiz5vtsX35szuKzXp7c");

const secret = JSON.parse(fs.readFileSync("../wallets/signer.json", "utf-8"));
const keypair = Keypair.fromSecretKey(Uint8Array.from(secret));

const umi = createUmi(process.env.ANCHOR_PROVIDER_URL || "https://devnet.helius-rpc.com/?api-key=3b3e78de-38ad-4f1a-b1b1-fd436978cb33")
  .use(mplCore())
  .use(keypairIdentity(fromWeb3JsKeypair(keypair)));

const [configPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("config")],
  PROGRAM_ID
);

async function main() {
  const collectionSigner = generateSigner(umi);

  console.log("Creating collection with updateAuthority = Config PDA:", configPda.toBase58());

  const { signature } = await createCollectionV2(umi, {
    collection: collectionSigner,
    name: "Superteam Academy Track 1",
    uri: "https://arweave.net/testestest",
    updateAuthority: fromWeb3JsPublicKey(configPda),
  }).sendAndConfirm(umi);

  console.log("Collection created:", collectionSigner.publicKey.toString());
  console.log("Signature:", signature);
  console.log("\nUpdate your README and e2e-flow.ts trackCollection with this address.");
}

main().catch(console.error);