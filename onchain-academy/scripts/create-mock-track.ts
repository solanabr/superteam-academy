import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { mplCore, createCollectionV2 } from "@metaplex-foundation/mpl-core";
import { generateSigner, keypairIdentity, publicKey } from "@metaplex-foundation/umi";
import { fromWeb3JsKeypair, fromWeb3JsPublicKey } from "@metaplex-foundation/umi-web3js-adapters";
import * as fs from "fs";
import { Keypair, PublicKey } from "@solana/web3.js";

const PROGRAM_ID = new PublicKey("FEjumbmTCGxTwqikEcyC13czHfTwsnk7B9erNEEuHeBB");

const secret = JSON.parse(fs.readFileSync("../wallets/signer.json", "utf-8"));
const keypair = Keypair.fromSecretKey(Uint8Array.from(secret));

const umi = createUmi("https://devnet.helius-rpc.com/?api-key=44daf6b7-435a-4124-95e4-f5eaa32ff810")
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