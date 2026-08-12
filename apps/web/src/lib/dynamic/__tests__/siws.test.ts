import { describe, it, expect, vi } from "vitest";
import bs58 from "bs58";
import { toMessageSigner } from "../siws";

/**
 * The adapter is the crux of the Dynamic integration: Dynamic's Solana wallet
 * and our SIWS bridge disagree on BOTH ends of `signMessage` —
 *
 *   | | our `MessageSigner`             | Dynamic                       |
 *   | input  | `string \| Uint8Array`   | `string` only                 |
 *   | output | `{ signature: Uint8Array; publicKey }` | base58 `string \| undefined` |
 *
 * — and a mistake at either end fails *server-side*, in signature verification,
 * where it is indistinguishable from a forged signature. So the tests pin the
 * wire format, not just the happy path.
 */

const ADDRESS = "3WECquwCtcKVRYNWBPFWE28ag3b1CDKchLZPXxifAJzQ";

function walletReturning(signature: string | undefined) {
  return {
    address: ADDRESS,
    signMessage: vi.fn(async () => signature),
  };
}

describe("toMessageSigner", () => {
  it("decodes the base58 signature to the exact bytes the server verifies", async () => {
    const raw = Uint8Array.from({ length: 64 }, (_, i) => (i * 7) % 256);
    const wallet = walletReturning(bs58.encode(raw));

    const result = await toMessageSigner(wallet).signMessage("hello");

    expect(result.signature).toEqual(raw);
    // The address rides in from the wallet — Dynamic's signer returns none.
    expect(result.publicKey).toBe(ADDRESS);
  });

  it("passes a string message through verbatim", async () => {
    const wallet = walletReturning(bs58.encode(new Uint8Array(64)));
    await toMessageSigner(wallet).signMessage("sign me");

    expect(wallet.signMessage).toHaveBeenCalledWith("sign me");
  });

  it("decodes a Uint8Array message to text, because Dynamic only takes strings", async () => {
    const wallet = walletReturning(bs58.encode(new Uint8Array(64)));
    const message = "st.academy wants you to sign in";
    await toMessageSigner(wallet).signMessage(
      new TextEncoder().encode(message)
    );

    expect(wallet.signMessage).toHaveBeenCalledWith(message);
  });

  /**
   * `undefined` is Dynamic's "no signature" — a declined prompt. It must THROW:
   * `runWalletSiws` treats a throw as a quiet, retryable decline, whereas an
   * empty Uint8Array would sail on to `/api/auth/wallet` and fail verification
   * there as though the learner had forged a signature.
   */
  it("throws on undefined instead of fabricating an empty signature", async () => {
    const wallet = walletReturning(undefined);

    await expect(
      toMessageSigner(wallet).signMessage("hello")
    ).rejects.toThrow();
    // And the failure is the adapter refusing — not a decode of garbage.
    expect(wallet.signMessage).toHaveBeenCalledOnce();
  });
});
