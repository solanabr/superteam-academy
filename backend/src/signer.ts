import { type Connection, Keypair, type PublicKey, type Transaction } from "@solana/web3.js";
import { AcademyClient } from "@superteam/anchor";

export class BackendSigner {
	readonly connection: Connection;
	readonly signer: Keypair;
	readonly client: AcademyClient;

	constructor(connection: Connection, signerKeypair: Keypair, programId?: PublicKey) {
		this.connection = connection;
		this.signer = signerKeypair;
		this.client = new AcademyClient(connection, programId);
	}

	get publicKey(): PublicKey {
		return this.signer.publicKey;
	}

	async signAndSend(tx: Transaction): Promise<string> {
		tx.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;
		tx.feePayer = this.signer.publicKey;
		tx.sign(this.signer);
		const signature = await this.connection.sendRawTransaction(tx.serialize());
		await this.connection.confirmTransaction(signature, "confirmed");
		return signature;
	}
}

export function loadSignerKeypair(): Keypair {
	const secretKey = process.env.BACKEND_SIGNER_SECRET_KEY;
	if (!secretKey) {
		throw new Error("BACKEND_SIGNER_SECRET_KEY environment variable is required");
	}
	return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(secretKey)));
}
