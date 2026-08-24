import { describe, it, expect } from "vitest";
import { Keypair } from "@solana/web3.js";
import {
  findWalletMismatch,
  isSameWallet,
  parseWalletAddress,
} from "../linked-wallet";

const A = Keypair.generate().publicKey.toBase58();
const B = Keypair.generate().publicKey.toBase58();

describe("findWalletMismatch", () => {
  it("names the linked wallet when it differs from the signer", () => {
    expect(findWalletMismatch(A, B)).toBe(B);
  });

  it("passes the same wallet, whatever the surrounding whitespace-free encoding", () => {
    expect(findWalletMismatch(A, A)).toBeNull();
  });

  it("treats an absent or unparseable linked wallet as unknown, not as a mismatch", () => {
    // One malformed row must not lock an account out of every flow — the
    // callers that cannot act on an unknown wallet refuse on their own.
    expect(findWalletMismatch(A, null)).toBeNull();
    expect(findWalletMismatch(A, "not-a-pubkey")).toBeNull();
  });
});

describe("isSameWallet", () => {
  it("is false whenever either side is missing or unparseable", () => {
    expect(isSameWallet(A, null)).toBe(false);
    expect(isSameWallet(null, A)).toBe(false);
    expect(isSameWallet(A, "not-a-pubkey")).toBe(false);
  });

  it("is true only for the same key", () => {
    expect(isSameWallet(A, A)).toBe(true);
    expect(isSameWallet(A, B)).toBe(false);
  });
});

describe("parseWalletAddress", () => {
  it("returns null instead of throwing on junk", () => {
    expect(parseWalletAddress("not-a-pubkey")).toBeNull();
    expect(parseWalletAddress(null)).toBeNull();
    expect(parseWalletAddress(A)?.toBase58()).toBe(A);
  });
});
