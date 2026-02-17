import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { mplCore, createCollection } from "@metaplex-foundation/mpl-core";
import { generateSigner, keypairIdentity } from "@metaplex-foundation/umi";
import { fromWeb3JsKeypair } from "@metaplex-foundation/umi-web3js-adapters";
import * as fs from "fs";
import { Keypair } from "@solana/web3.js";

const secret = JSON.parse(fs.readFileSync("../wallets/signer.json", "utf-8"));
const keypair = Keypair.fromSecretKey(Uint8Array.from(secret));

const umi = createUmi("https://api.devnet.solana.com")
  .use(mplCore())
  .use(keypairIdentity(fromWeb3JsKeypair(keypair)));

async function main() {
  const collectionSigner = generateSigner(umi);

  const { signature } = await createCollection(umi, {
    collection: collectionSigner,
    name: "Superteam Academy Track 1",
    uri: "https://arweave.net/testestest",
  }).sendAndConfirm(umi);

  console.log("Collection created:", collectionSigner.publicKey.toString());
  console.log("Signature:", signature);
}

main().catch(console.error);