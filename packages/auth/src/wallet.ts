import { PublicKey } from "@solana/web3.js";
import { z } from "zod";
import nacl from "tweetnacl";

export const walletAuthSchema = z.object({
	publicKey: z.string().min(32).max(44),
	signature: z.string(),
	message: z.string(),
});

type WalletAuthPayload = z.infer<typeof walletAuthSchema>;

export function createSignInMessage(nonce: string, domain: string): string {
	return [
		`${domain} wants you to sign in with your Solana account.`,
		"",
		`Nonce: ${nonce}`,
		`Issued At: ${new Date().toISOString()}`,
	].join("\n");
}

export function verifyWalletSignature(payload: WalletAuthPayload): boolean {
	const { publicKey, signature, message } = walletAuthSchema.parse(payload);
	try {
		const pubkey = new PublicKey(publicKey);
		const msgBytes = new TextEncoder().encode(message);
		const sigBytes = Uint8Array.from(Buffer.from(signature, "base64"));
		return nacl.sign.detached.verify(msgBytes, sigBytes, pubkey.toBytes());
	} catch {
		return false;
	}
}
