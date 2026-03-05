/**
 * @fileoverview Utility script to create Metaplex Core collections for each learning track.
 * These collections serve as the master authorities for course credentials.
 */

import { createCollectionV2, mplCore } from "@metaplex-foundation/mpl-core";
import { generateSigner, keypairIdentity } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
	fromWeb3JsKeypair,
	fromWeb3JsPublicKey,
} from "@metaplex-foundation/umi-web3js-adapters";
import { Keypair, PublicKey } from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";

// YOUR DEPLOYMENT DETAILS
const PROGRAM_ID = new PublicKey(
	"C4EbR5juamTow9GfSuX9F2UiEikspEpwqi9KwNpWoPcU",
);

// Derive Config PDA
const [CONFIG_PDA] = PublicKey.findProgramAddressSync(
	[Buffer.from("config")],
	PROGRAM_ID,
);

console.log("Using Program ID:", PROGRAM_ID.toBase58());
console.log("Derived Config PDA (Authority):", CONFIG_PDA.toBase58());

// Load your signer.json
const keypairPath = path.resolve(process.cwd(), "wallets", "signer.json");
const secret = JSON.parse(fs.readFileSync(keypairPath, "utf-8"));
const keypair = Keypair.fromSecretKey(Uint8Array.from(secret));

const umi = createUmi("https://api.devnet.solana.com")
	.use(mplCore())
	.use(keypairIdentity(fromWeb3JsKeypair(keypair)));

/**
 * Creates a new Metaplex Core collection for a specific learning track.
 * @param name - The human-readable name of the track.
 * @returns The public key of the created collection.
 */
async function createTrack(name: string) {
	const collectionSigner = generateSigner(umi);
	console.log(`Creating collection for "${name}"...`);

	try {
		await createCollectionV2(umi, {
			collection: collectionSigner,
			name: name,
			uri: "https://arweave.net/test", // Placeholder URI
			updateAuthority: fromWeb3JsPublicKey(CONFIG_PDA),
		}).sendAndConfirm(umi);

		console.log(
			`✓ ${name} Collection: ${collectionSigner.publicKey.toString()}`,
		);
		return collectionSigner.publicKey.toString();
	} catch (err) {
		console.error(`✗ Failed to create ${name}:`, err);
		throw err;
	}
}

/**
 * Main execution loop for creating all defined tracks.
 * Outputs the mapping to a JSON file for use in the app.
 */
async function main() {
	const tracks = [
		"Superteam Academy: Rust", // Track 1
		"Superteam Academy: Anchor", // Track 2
		"Superteam Academy: DeFi", // Track 3
		"Superteam Academy: Security", // Track 4
		"Superteam Academy: Frontend", // Track 5
	];

	const results: Record<number, string> = {};

	for (let i = 0; i < tracks.length; i++) {
		const address = await createTrack(tracks[i]);
		results[i + 1] = address;
	}

	console.log("\n--- TRACK_COLLECTIONS MAPPING ---");
	console.log(JSON.stringify(results, null, 2));

	// Also write to a temporary file just in case
	fs.writeFileSync(
		"track-collections-output.json",
		JSON.stringify(results, null, 2),
	);
}

main().catch(console.error);
