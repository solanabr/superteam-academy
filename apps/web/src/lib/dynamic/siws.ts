import bs58 from "bs58";
import type { MessageSigner } from "@/lib/wallet/siws";

/**
 * Adapts a Dynamic wallet account to the `MessageSigner` our SIWS bridge wants.
 *
 * The two disagree on both ends of `signMessage`, which is why this file exists:
 *
 * | | our `MessageSigner` | Dynamic's client |
 * | --- | --- | --- |
 * | input | `string \| Uint8Array` | `string` only |
 * | output | `{ signature: Uint8Array; publicKey: string }` | `{ signature: string }` |
 *
 * So the message goes in as text, the returned string is decoded to the raw
 * bytes `/api/auth/wallet` verifies, and the address is carried in separately
 * because Dynamic's signer does not return one.
 *
 * ## Why the signature encoding is DETECTED rather than assumed
 *
 * Dynamic's own SDK is not internally consistent about this, so assuming either
 * encoding would be a coin flip whose failure mode is a silent 401 in
 * production — the signature verifies against nothing and the learner just sees
 * "authentication failed".
 *
 * What the shipped code actually does, read from the installed packages:
 * every Solana provider in `@dynamic-labs-sdk/solana@1.27.1` returns
 * `bufferToBase64(...)` — the wallet-standard provider, the WalletConnect
 * provider, and `bufferToBase64` itself is a plain
 * `Buffer.from(binstr, "binary").toString("base64")`. The LEGACY 5.2.0 SDK, by
 * contrast, ran the embedded-wallet result through `bs58`. The WaaS provider we
 * use composes its signer at runtime and cannot be read statically, so it is
 * the one case the source does not settle.
 *
 * Rather than bet, this decodes by alphabet and then enforces the invariant
 * that actually matters: an ed25519 signature is EXACTLY 64 bytes. That makes a
 * wrong guess impossible to pass silently — a mis-decode fails loudly here,
 * at the point of the bug, instead of server-side as a forged signature.
 *
 * `+`, `/` and `=` are not in the base58 alphabet, so their presence is
 * conclusive; otherwise base58 is tried first and the length check arbitrates.
 */

const SIGNATURE_BYTES = 64;

/** The subset of a Dynamic wallet account this adapter needs. */
export interface DynamicWalletAccount {
  address: string;
}

/**
 * Dynamic's `signMessage`, narrowed to what this adapter calls.
 *
 * Generic over the account type because the SDK's real `signMessage` demands
 * its full `WalletAccount` — typing the parameter as just `{ address }` would
 * make the SDK function unassignable (parameter contravariance). The adapter
 * itself only ever reads `address`.
 */
export type DynamicSignMessage<T extends DynamicWalletAccount> = (args: {
  walletAccount: T;
  message: string;
}) => Promise<{ signature: string }>;

/**
 * Decodes a Dynamic signature string to raw bytes.
 *
 * @throws when neither encoding yields exactly 64 bytes — see the note above on
 *         why that is preferable to returning a plausible-looking wrong value.
 */
export function decodeSignature(signature: string): Uint8Array {
  const looksBase64 = /[+/=]/.test(signature);

  if (!looksBase64) {
    try {
      const decoded = bs58.decode(signature);
      if (decoded.length === SIGNATURE_BYTES) return decoded;
    } catch {
      // Not base58 after all — fall through to base64.
    }
  }

  const fromBase64 = Uint8Array.from(Buffer.from(signature, "base64"));
  if (fromBase64.length === SIGNATURE_BYTES) return fromBase64;

  throw new Error(
    `Dynamic returned a signature that is neither 64-byte base58 nor base64 (got ${fromBase64.length} bytes from base64)`
  );
}

export function toMessageSigner<T extends DynamicWalletAccount>(
  walletAccount: T,
  signMessage: DynamicSignMessage<T>
): MessageSigner {
  return {
    async signMessage(message: string | Uint8Array) {
      const text =
        typeof message === "string"
          ? message
          : new TextDecoder().decode(message);

      const { signature } = await signMessage({ walletAccount, message: text });

      // A missing signature must THROW rather than become an empty array:
      // `runWalletSiws` treats a throw as a quiet, retryable decline, whereas
      // empty bytes would sail on and fail server-side verification as though
      // the learner's signature were forged.
      if (!signature) {
        throw new Error("Dynamic returned no signature");
      }

      return {
        signature: decodeSignature(signature),
        publicKey: walletAccount.address,
      };
    },
  };
}
