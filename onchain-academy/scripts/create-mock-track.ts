import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { mplCore, createCollectionV2 } from "@metaplex-foundation/mpl-core";
import { generateSigner, keypairIdentity } from "@metaplex-foundation/umi";
import { fromWeb3JsKeypair, fromWeb3JsPublicKey } from "@metaplex-foundation/umi-web3js-adapters";
import * as fs from "fs";
import * as path from "path";
import { Keypair, PublicKey } from "@solana/web3.js";

function resolveProgramId(): PublicKey {
  const cliProgramId = process.argv[2];
  if (cliProgramId) {
    return new PublicKey(cliProgramId);
  }

  const envProgramId = process.env.ACADEMY_PROGRAM_ID;
  if (envProgramId) {
    return new PublicKey(envProgramId);
  }

  const anchorTomlPath = path.resolve(process.cwd(), "Anchor.toml");
  if (fs.existsSync(anchorTomlPath)) {
    const anchorToml = fs.readFileSync(anchorTomlPath, "utf-8");
    const match = anchorToml.match(/onchain_academy\s*=\s*"([^"]+)"/);
    if (match?.[1]) {
      return new PublicKey(match[1]);
    }
  }

  throw new Error(
    "Unable to resolve program ID. Pass it as: npx ts-node scripts/create-mock-track.ts <PROGRAM_ID>"
  );
}

const PROGRAM_ID = resolveProgramId();

const secret = JSON.parse(fs.readFileSync("../wallets/signer.json", "utf-8"));
const keypair = Keypair.fromSecretKey(Uint8Array.from(secret));

const umi = createUmi("https://api.devnet.solana.com")
  .use(mplCore())
  .use(keypairIdentity(fromWeb3JsKeypair(keypair)));

const [configPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("config")],
  PROGRAM_ID
);

async function main() {
  const collectionSigner = generateSigner(umi);

  console.log("Program ID:", PROGRAM_ID.toBase58());
  console.log("Creating collection with updateAuthority = Config PDA:", configPda.toBase58());

  const { signature } = await createCollectionV2(umi, {
    collection: collectionSigner,
    name: "Superteam Academy Track 1",
    uri: "https://arweave.net/testestest",
    updateAuthority: fromWeb3JsPublicKey(configPda),
  }).sendAndConfirm(umi);

  console.log("Collection created:", collectionSigner.publicKey.toString());
  console.log("Signature:", signature);
  console.log("\nUse this collection address as trackCollection in backend/Postman issue-credential calls.");
}

main().catch(console.error);
