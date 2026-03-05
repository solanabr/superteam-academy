/**
 * @fileoverview Utility for loading the backend signer keypair from environment variables.
 * This ensures the private key is never exposed in the source code or client bundles.
 */

import { Keypair } from "@solana/web3.js";

/**
 * Loads the backend signer keypair from the BACKEND_SIGNER_KEYPAIR environment variable.
 * Must ONLY be called on the server-side.
 *
 * @returns {Keypair} The loaded backend signer Keypair
 * @throws {Error} If the environment variable is missing or invalid
 */
export function getBackendSigner(): Keypair {
	const keypairEnv = process.env.BACKEND_SIGNER_KEYPAIR;

	if (!keypairEnv) {
		throw new Error(
			"Missing BACKEND_SIGNER_KEYPAIR in environment variables. Please configure this in your Vercel settings.",
		);
	}

	try {
		// Parse the stringified array back into a JavaScript array of numbers
		const secretKeyArray = JSON.parse(keypairEnv);

		// Convert the array into a Uint8Array and create the Keypair
		return Keypair.fromSecretKey(Uint8Array.from(secretKeyArray));
	} catch {
		throw new Error(
			"Failed to parse BACKEND_SIGNER_KEYPAIR. Expected a JSON stringified array of numbers.",
		);
	}
}

/**
 * Loads the XP mint keypair from the XP_MINT_KEYPAIR environment variable.
 * Must ONLY be called on the server-side.
 *
 * @returns {number[]} The loaded XP mint secret key array
 * @throws {Error} If the environment variable is missing or invalid
 */
export function getMintKeypair(): number[] {
	const keypairEnv = process.env.XP_MINT_KEYPAIR;

	if (!keypairEnv) {
		throw new Error(
			"Missing XP_MINT_KEYPAIR in environment variables. Please configure this in your Vercel settings.",
		);
	}

	try {
		return JSON.parse(keypairEnv);
	} catch {
		throw new Error(
			"Failed to parse XP_MINT_KEYPAIR. Expected a JSON stringified array of numbers.",
		);
	}
}
