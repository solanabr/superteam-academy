import { PublicKey } from "@solana/web3.js";

export function findProgramAddress(
	seeds: (Uint8Array | Buffer)[],
	programId: PublicKey
): [PublicKey, number] {
	return PublicKey.findProgramAddressSync(seeds, programId);
}
