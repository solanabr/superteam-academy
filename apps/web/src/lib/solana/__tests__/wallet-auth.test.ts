import { describe, it, expect } from "vitest";
import nacl from "tweetnacl";
import bs58 from "bs58";
import {
  createSIWSMessage,
  formatSIWSMessage,
  verifySIWSSignature,
  generateNonce,
  isMessageExpired,
  parsePublicKeyFromAddress,
} from "../wallet-auth";

const encode = (s: string) => new TextEncoder().encode(s);

describe("SIWS signature verification", () => {
  const keypair = nacl.sign.keyPair();
  const address = bs58.encode(keypair.publicKey);

  it("accepts a signature produced by the matching key", () => {
    const message = "superteam.academy wants you to sign in";
    const signature = nacl.sign.detached(encode(message), keypair.secretKey);
    expect(
      verifySIWSSignature({
        message,
        signature,
        publicKey: keypair.publicKey,
      })
    ).toBe(true);
  });

  it("rejects a tampered message", () => {
    const signature = nacl.sign.detached(encode("original"), keypair.secretKey);
    expect(
      verifySIWSSignature({
        message: "tampered",
        signature,
        publicKey: keypair.publicKey,
      })
    ).toBe(false);
  });

  it("rejects a signature made by a different key", () => {
    const attacker = nacl.sign.keyPair();
    const message = "sign in";
    const signature = nacl.sign.detached(encode(message), attacker.secretKey);
    expect(
      verifySIWSSignature({
        message,
        signature,
        publicKey: keypair.publicKey,
      })
    ).toBe(false);
  });

  it("rejects a corrupted signature", () => {
    const message = "sign in";
    const signature = nacl.sign.detached(encode(message), keypair.secretKey);
    signature[0] = (signature[0] ?? 0) ^ 0xff;
    expect(
      verifySIWSSignature({
        message,
        signature,
        publicKey: keypair.publicKey,
      })
    ).toBe(false);
  });

  it("verifies against the key parsed from the wallet address", () => {
    const message = "sign in";
    const signature = nacl.sign.detached(encode(message), keypair.secretKey);
    const publicKey = parsePublicKeyFromAddress(address);
    expect(publicKey).toEqual(keypair.publicKey);
    expect(verifySIWSSignature({ message, signature, publicKey })).toBe(true);
  });
});

describe("SIWS message construction", () => {
  const address = bs58.encode(nacl.sign.keyPair().publicKey);

  it("echoes fields and sets a 2-minute expiry window", () => {
    const message = createSIWSMessage({
      domain: "superteam.academy",
      address,
      statement: "Sign in to Superteam Academy",
      nonce: "nonce-123",
    });
    expect(message.domain).toBe("superteam.academy");
    expect(message.address).toBe(address);
    expect(message.statement).toBe("Sign in to Superteam Academy");
    expect(message.nonce).toBe("nonce-123");
    const windowMs =
      new Date(message.expirationTime).getTime() -
      new Date(message.issuedAt).getTime();
    expect(windowMs).toBe(2 * 60 * 1000);
  });

  it("formats a signable message that the matching key can verify", () => {
    const keypair = nacl.sign.keyPair();
    const message = createSIWSMessage({
      domain: "app.test",
      address: bs58.encode(keypair.publicKey),
      statement: "Sign in",
      nonce: "abc",
    });
    const text = formatSIWSMessage(message);
    expect(text).toContain(
      "app.test wants you to sign in with your Solana account:"
    );
    expect(text).toContain("Nonce: abc");
    expect(text).toContain(`Issued At: ${message.issuedAt}`);

    const signature = nacl.sign.detached(encode(text), keypair.secretKey);
    expect(
      verifySIWSSignature({
        message: text,
        signature,
        publicKey: keypair.publicKey,
      })
    ).toBe(true);
  });
});

describe("SIWS expiry + nonce helpers", () => {
  it("flags past expiry times as expired", () => {
    expect(isMessageExpired(new Date(Date.now() - 1000).toISOString())).toBe(
      true
    );
  });

  it("treats future expiry times as valid", () => {
    expect(isMessageExpired(new Date(Date.now() + 60_000).toISOString())).toBe(
      false
    );
  });

  it("generates unique 32-byte base58 nonces", () => {
    const a = generateNonce();
    const b = generateNonce();
    expect(a).not.toBe(b);
    expect(bs58.decode(a)).toHaveLength(32);
  });
});
