import { describe, it, expect, vi } from "vitest";
import bs58 from "bs58";
import { toMessageSigner, decodeSignature } from "../siws";

/**
 * The adapter is the crux of the Dynamic integration: Dynamic's client and our
 * SIWS bridge disagree on BOTH ends of `signMessage` —
 *
 *   | | our `MessageSigner`                    | Dynamic                 |
 *   | input  | `string \| Uint8Array`          | `string` only           |
 *   | output | `{ signature: Uint8Array; publicKey }` | `{ signature: string }` |
 *
 * — and a mistake at either end fails *server-side*, in signature verification,
 * where it is indistinguishable from a forged signature. So the tests pin the
 * wire format, not just the happy path.
 *
 * The encoding cases matter most. Dynamic's own SDK is inconsistent: every
 * Solana provider in 1.27.1 returns base64, while the legacy 5.2.0 SDK ran the
 * embedded-wallet result through bs58. The adapter therefore accepts either and
 * enforces the 64-byte ed25519 invariant, and these tests hold it to that.
 */

const ADDRESS = "3WECquwCtcKVRYNWBPFWE28ag3b1CDKchLZPXxifAJzQ";
const RAW = Uint8Array.from({ length: 64 }, (_, i) => (i * 7) % 256);

function signerReturning(signature: string) {
  return vi.fn(async () => ({ signature }));
}

describe("decodeSignature", () => {
  it("decodes base64, the encoding every 1.27.1 Solana provider emits", () => {
    expect(decodeSignature(Buffer.from(RAW).toString("base64"))).toEqual(RAW);
  });

  it("decodes base58, the encoding the legacy SDK emitted", () => {
    expect(decodeSignature(bs58.encode(RAW))).toEqual(RAW);
  });

  /**
   * The invariant that makes accepting two encodings safe: anything that does
   * not decode to exactly 64 bytes is rejected here, at the point of the bug,
   * rather than passed on to fail as a forged signature.
   */
  it("rejects a value that decodes to the wrong length", () => {
    expect(() => decodeSignature(bs58.encode(new Uint8Array(32)))).toThrow();
  });

  it("rejects a value that is neither encoding", () => {
    expect(() => decodeSignature("!!! not a signature !!!")).toThrow();
  });
});

describe("toMessageSigner", () => {
  it("returns the exact bytes the server verifies, plus the address", async () => {
    const signMessage = signerReturning(Buffer.from(RAW).toString("base64"));
    const result = await toMessageSigner(
      { address: ADDRESS },
      signMessage
    ).signMessage("hello");

    expect(result.signature).toEqual(RAW);
    // The address rides in from the wallet account — Dynamic's signer
    // returns none.
    expect(result.publicKey).toBe(ADDRESS);
  });

  it("passes a string message through verbatim", async () => {
    const signMessage = signerReturning(bs58.encode(RAW));
    await toMessageSigner({ address: ADDRESS }, signMessage).signMessage(
      "sign me"
    );

    expect(signMessage).toHaveBeenCalledWith({
      walletAccount: { address: ADDRESS },
      message: "sign me",
    });
  });

  it("decodes a Uint8Array message to text, because Dynamic only takes strings", async () => {
    const signMessage = signerReturning(bs58.encode(RAW));
    const message = "st.academy wants you to sign in";

    await toMessageSigner({ address: ADDRESS }, signMessage).signMessage(
      new TextEncoder().encode(message)
    );

    expect(signMessage).toHaveBeenCalledWith({
      walletAccount: { address: ADDRESS },
      message,
    });
  });

  /**
   * An empty signature is Dynamic's "no signature" — a declined prompt. It must
   * THROW: `runWalletSiws` treats a throw as a quiet, retryable decline,
   * whereas empty bytes would sail on to `/api/auth/wallet` and fail there as
   * though the learner had forged a signature.
   */
  it("throws on an empty signature instead of fabricating one", async () => {
    const signMessage = signerReturning("");

    await expect(
      toMessageSigner({ address: ADDRESS }, signMessage).signMessage("hello")
    ).rejects.toThrow();
    expect(signMessage).toHaveBeenCalledOnce();
  });
});
