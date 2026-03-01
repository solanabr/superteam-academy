import { PublicKey } from "@solana/web3.js";
import nacl from "tweetnacl";
import bs58 from "bs58";

export interface SiwsPayload {
  walletAddress: string;
  signature: string;
  nonce: string;
  message: string;
}

export function verifySiws(payload: SiwsPayload): boolean {
  try {
    const pubkey = new PublicKey(payload.walletAddress);
    const msgBytes = new TextEncoder().encode(payload.message);
    const sigBytes = bs58.decode(payload.signature);
    return nacl.sign.detached.verify(msgBytes, sigBytes, pubkey.toBytes());
  } catch {
    return false;
  }
}

export function buildSiwsMessage(
  domain: string,
  walletAddress: string,
  nonce: string,
  issuedAt: string,
): string {
  return [
    `${domain} wants you to sign in with your Solana account:`,
    walletAddress,
    "",
    "Sign in to Superteam Academy",
    "",
    `URI: https://${domain}`,
    `Version: 1`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
  ].join("\n");
}
