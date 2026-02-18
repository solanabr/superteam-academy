import { PublicKey } from "@solana/web3.js";

export function findProgramAddress(
	seeds: (Uint8Array | Buffer)[],
	programId: PublicKey
): [PublicKey, number] {
	return PublicKey.findProgramAddressSync(seeds, programId);
}

const TOKEN_2022_PROGRAM_ID = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");

/** Derive the Associated Token Account address for Token-2022 */
export function findToken2022ATA(wallet: PublicKey, mint: PublicKey): PublicKey {
	const [ata] = PublicKey.findProgramAddressSync(
		[wallet.toBuffer(), TOKEN_2022_PROGRAM_ID.toBuffer(), mint.toBuffer()],
		ASSOCIATED_TOKEN_PROGRAM_ID
	);
	return ata;
}

export { TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID };
