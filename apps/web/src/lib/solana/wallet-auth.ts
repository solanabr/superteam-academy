import nacl from "tweetnacl";
import bs58 from "bs58";

interface SIWSMessage {
  domain: string;
  address: string;
  statement: string;
  nonce: string;
  issuedAt: string;
  expirationTime: string;
}

export function createSIWSMessage(params: {
  domain: string;
  address: string;
  statement: string;
  nonce: string;
}): SIWSMessage {
  const now = new Date();
  const expiry = new Date(now.getTime() + 2 * 60 * 1000); // 2 minutes

  return {
    domain: params.domain,
    address: params.address,
    statement: params.statement,
    nonce: params.nonce,
    issuedAt: now.toISOString(),
    expirationTime: expiry.toISOString(),
  };
}

export function formatSIWSMessage(message: SIWSMessage): string {
  return [
    `${message.domain} wants you to sign in with your Solana account:`,
    message.address,
    "",
    message.statement,
    "",
    `Nonce: ${message.nonce}`,
    `Issued At: ${message.issuedAt}`,
    `Expiration Time: ${message.expirationTime}`,
  ].join("\n");
}

export function verifySIWSSignature(params: {
  message: string;
  signature: Uint8Array;
  publicKey: Uint8Array;
}): boolean {
  const messageBytes = new TextEncoder().encode(params.message);
  return nacl.sign.detached.verify(
    messageBytes,
    params.signature,
    params.publicKey
  );
}

export function generateNonce(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return bs58.encode(array);
}

export function isMessageExpired(expirationTime: string): boolean {
  return new Date(expirationTime) < new Date();
}

export function parsePublicKeyFromAddress(address: string): Uint8Array {
  return bs58.decode(address);
}
