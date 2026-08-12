import bs58 from "bs58";
import type { MessageSigner } from "@/lib/phantom/siws";

/**
 * Adapts a Dynamic Solana wallet to the `MessageSigner` our SIWS bridge expects.
 *
 * The two disagree on both ends of `signMessage`, which is the whole reason this
 * file exists:
 *
 * | | our `MessageSigner` | Dynamic's Solana wallet |
 * | --- | --- | --- |
 * | input | `string \| Uint8Array` | `string` only |
 * | output | `{ signature: Uint8Array; publicKey: string }` | `string \| undefined` (base58) |
 *
 * So the message is passed as text, the returned base58 signature is decoded to
 * the raw bytes `/api/auth/wallet` verifies, and the address is carried in
 * separately because Dynamic's signer does not return one.
 *
 * `undefined` is Dynamic's "no signature" — a declined prompt, or a wallet that
 * failed to produce one. It must become a THROW rather than a silent empty
 * signature: `runPhantomSiws` treats a throw as a quiet, retryable decline,
 * whereas an empty Uint8Array would sail on and fail server-side verification
 * as though the learner's signature were forged.
 */

/** The subset of a Dynamic Solana wallet this adapter needs. */
export interface DynamicSolanaWallet {
  address: string;
  signMessage(messageToSign: string): Promise<string | undefined>;
}

export function toMessageSigner(wallet: DynamicSolanaWallet): MessageSigner {
  return {
    async signMessage(message: string | Uint8Array) {
      const text =
        typeof message === "string"
          ? message
          : new TextDecoder().decode(message);

      const signatureBase58 = await wallet.signMessage(text);
      if (!signatureBase58) {
        throw new Error("Dynamic returned no signature");
      }

      return {
        signature: bs58.decode(signatureBase58),
        publicKey: wallet.address,
      };
    },
  };
}
