/**
 * @fileoverview Platform initialization route handler.
 * Provides the XP Mint secret key to the frontend for one-time SPL program initialization.
 */

import { NextResponse } from "next/server";
import { getMintKeypair } from "@/lib/utils/backend-signer";

export async function GET() {
	try {
		const secretKeyArray = getMintKeypair();

		return NextResponse.json({ secretKey: secretKeyArray });
	} catch (error: unknown) {
		console.error("Error reading XP Mint keypair:", error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Unknown Error" },
			{ status: 500 },
		);
	}
}
